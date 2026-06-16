"""
Financial Risk Scorer
Computes a comprehensive risk score (0-100) based on user financial data.
Lower score = Better financial health.
"""

from bson import ObjectId


def compute_risk_score(db, user_id):
    """
    Analyze income, expenses, debts (EMIs), and savings to calculate
    a risk score.
    """
    # 1. Fetch user profile
    from app.models.user import get_profile
    profile = get_profile(db, user_id)

    # 2. Fetch transactions
    all_tx = list(db.transactions.find({"user_id": ObjectId(user_id)}))
    total_income = sum(t["amount"] for t in all_tx if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in all_tx if t["type"] == "expense")

    # 3. Base calculations
    savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0
    
    emi_amount = float(profile.get("emi_amount", 0)) if profile else 0
    monthly_income = float(profile.get("monthly_income", 0)) if profile else 0
    
    # Debt-to-Income Ratio (DTI)
    dti_ratio = (emi_amount / monthly_income) if monthly_income > 0 else 0

    # 4. Scoring Logic (0-100, where 0 is perfect, 100 is critical risk)
    score = 0
    factors = []

    # A. Savings Rate Impact (0-40 points)
    if savings_rate < 0:
        score += 40
        factors.append({"name": "Negative Cashflow", "impact": "negative", "value": round(savings_rate * 100, 1)})
    elif savings_rate < 0.1:
        score += 30
        factors.append({"name": "Low Savings Rate", "impact": "negative", "value": round(savings_rate * 100, 1)})
    elif savings_rate < 0.2:
        score += 15
        factors.append({"name": "Moderate Savings Rate", "impact": "neutral", "value": round(savings_rate * 100, 1)})
    else:
        factors.append({"name": "Healthy Savings Rate", "impact": "positive", "value": round(savings_rate * 100, 1)})

    # B. Debt-to-Income Ratio Impact (0-40 points)
    if dti_ratio > 0.5:
        score += 40
        factors.append({"name": "Critical Debt Burden", "impact": "negative", "value": round(dti_ratio * 100, 1)})
    elif dti_ratio > 0.35:
        score += 25
        factors.append({"name": "High Debt Burden", "impact": "negative", "value": round(dti_ratio * 100, 1)})
    elif dti_ratio > 0.15:
        score += 10
        factors.append({"name": "Manageable Debt", "impact": "neutral", "value": round(dti_ratio * 100, 1)})
    else:
        factors.append({"name": "Low Debt Burden", "impact": "positive", "value": round(dti_ratio * 100, 1)})

    # C. Emergency Fund Impact (0-20 points)
    # Check if they have an FD investment for emergencies
    investments = list(db.investments.find({"user_id": ObjectId(user_id)}))
    has_emergency_fund = any(inv["type"] == "FD" for inv in investments)
    
    if not has_emergency_fund:
        score += 20
        factors.append({"name": "Missing Emergency Fund", "impact": "negative", "value": 0})
    else:
        factors.append({"name": "Active Emergency Fund", "impact": "positive", "value": 100})

    # 5. Classify Risk Level
    if score >= 70:
        risk_level = "high"
    elif score >= 40:
        risk_level = "medium"
    else:
        risk_level = "low"

    return {
        "riskScore": score,
        "riskLevel": risk_level,
        "factors": factors
    }
