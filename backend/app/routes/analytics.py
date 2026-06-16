"""
Analytics Routes — Spending insights, predictions, and budget status
GET /analytics/summary             — Financial summary
GET /analytics/spending-by-category — Category breakdown
GET /analytics/monthly-trend        — 6-month trend
GET /analytics/predictions          — ML-based spending predictions
GET /analytics/budget-status        — Budget utilization
GET /analytics/risk-assessment      — Financial risk score
"""

from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.models import get_db

analytics_bp = Blueprint("analytics", __name__)

CATEGORY_COLORS = {
    "Food & Dining": "#f97316",
    "Transportation": "#3b82f6",
    "Shopping": "#8b5cf6",
    "Entertainment": "#ec4899",
    "Health & Fitness": "#ef4444",
    "Housing": "#06b6d4",
    "Utilities": "#eab308",
    "Education": "#14b8a6",
    "Savings": "#22c55e",
    "Salary": "#84cc16",
    "Freelance": "#a855f7",
    "Investment": "#10b981",
    "Other Income": "#6366f1",
    "Other Expense": "#6b7280",
}


@analytics_bp.route("/analytics/summary", methods=["GET"])
@jwt_required()
def financial_summary():
    """Get income, expenses, savings summary."""
    user_id = get_jwt_identity()
    db = get_db()

    all_tx = list(db.transactions.find({"user_id": ObjectId(user_id)}))
    now = datetime.now()
    this_month = f"{now.year}-{str(now.month).zfill(2)}"

    total_income = sum(t["amount"] for t in all_tx if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in all_tx if t["type"] == "expense")
    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0

    month_tx = [t for t in all_tx if t["date"].startswith(this_month)]
    this_month_income = sum(t["amount"] for t in month_tx if t["type"] == "income")
    this_month_expenses = sum(t["amount"] for t in month_tx if t["type"] == "expense")

    return jsonify({
        "totalIncome": total_income,
        "totalExpenses": total_expenses,
        "netSavings": net_savings,
        "savingsRate": round(savings_rate, 1),
        "transactionCount": len(all_tx),
        "thisMonthIncome": this_month_income,
        "thisMonthExpenses": this_month_expenses,
    })


@analytics_bp.route("/analytics/spending-by-category", methods=["GET"])
@jwt_required()
def spending_by_category():
    """Get spending breakdown by category."""
    user_id = get_jwt_identity()
    db = get_db()

    expenses = list(db.transactions.find({"user_id": ObjectId(user_id), "type": "expense"}))
    total = sum(t["amount"] for t in expenses)
    by_cat = {}

    for t in expenses:
        by_cat[t["category"]] = by_cat.get(t["category"], 0) + t["amount"]

    result = [
        {
            "category": cat,
            "total": round(amt, 2),
            "percentage": round(amt / total * 100, 1) if total > 0 else 0,
            "color": CATEGORY_COLORS.get(cat, "#6b7280"),
        }
        for cat, amt in by_cat.items()
    ]
    result.sort(key=lambda x: x["total"], reverse=True)
    return jsonify(result)


@analytics_bp.route("/analytics/monthly-trend", methods=["GET"])
@jwt_required()
def monthly_trend():
    """Get 6-month income/expense trend."""
    user_id = get_jwt_identity()
    db = get_db()

    all_tx = list(db.transactions.find({"user_id": ObjectId(user_id)}))
    now = datetime.now()
    months = []

    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_key = f"{y}-{str(m).zfill(2)}"
        label = datetime(y, m, 1).strftime("%b '%y")

        month_tx = [t for t in all_tx if t["date"].startswith(month_key)]
        income = sum(t["amount"] for t in month_tx if t["type"] == "income")
        expenses = sum(t["amount"] for t in month_tx if t["type"] == "expense")

        months.append({
            "month": label,
            "income": round(income, 2),
            "expenses": round(expenses, 2),
            "savings": round(income - expenses, 2),
        })

    return jsonify(months)


@analytics_bp.route("/analytics/predictions", methods=["GET"])
@jwt_required()
def spending_predictions():
    """ML-based spending predictions using Scikit-learn models."""
    user_id = get_jwt_identity()
    db = get_db()

    all_tx = list(db.transactions.find({"user_id": ObjectId(user_id)}))
    now = datetime.now()

    # Compute monthly expenses for last 3 months
    monthly_expenses = []
    for i in range(2, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_key = f"{y}-{str(m).zfill(2)}"
        total = sum(t["amount"] for t in all_tx if t["type"] == "expense" and t["date"].startswith(month_key))
        monthly_expenses.append(total)

    # ── ML Prediction (Scikit-learn) ──────────────────────────────
    try:
        from app.ml.predictor import predict_next_month
        predicted = predict_next_month(monthly_expenses, all_tx)
    except Exception:
        # Fallback: weighted moving average
        weights = [0.2, 0.3, 0.5]
        valid = [e for e in monthly_expenses if e > 0]
        if len(monthly_expenses) == 3 and all(e > 0 for e in monthly_expenses):
            predicted = sum(e * w for e, w in zip(monthly_expenses, weights))
        elif valid:
            predicted = sum(valid) / len(valid)
        else:
            predicted = 0

    # Current month expenses
    this_month = f"{now.year}-{str(now.month).zfill(2)}"
    this_month_expenses = sum(t["amount"] for t in all_tx if t["type"] == "expense" and t["date"].startswith(this_month))

    # Compute totals for risk analysis
    total_income = sum(t["amount"] for t in all_tx if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in all_tx if t["type"] == "expense")
    savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0

    # Generate alerts and recommendations
    alerts = []
    recommendations = []
    risk_level = "low"

    # Trend: 3 consecutive months of increase
    if len(monthly_expenses) == 3 and monthly_expenses[2] > monthly_expenses[1] > monthly_expenses[0]:
        alerts.append("⚠️ Your expenses have been increasing for 3 consecutive months.")
        risk_level = "medium"

    if 0 < savings_rate < 0.1 and total_income > 0:
        alerts.append("🔴 Your savings rate is below 10% — experts recommend at least 20%.")
        risk_level = "high"
        recommendations.append("Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings.")

    if predicted > 0 and this_month_expenses > predicted * 0.8:
        alerts.append(f"📊 You've already spent 80% of your predicted ₹{predicted:.0f} monthly budget.")

    if savings_rate > 0.3:
        recommendations.append("🎉 Great savings! Consider SIPs or mutual funds for surplus.")
    else:
        recommendations.append("💡 Set up auto-transfer to savings on payday.")

    recommendations.append("📋 Track discretionary spending to identify reduction areas.")
    recommendations.append("🔄 Review subscriptions and recurring expenses quarterly.")

    if not alerts:
        alerts.append("✅ Your spending pattern looks healthy this month!")

    valid_months = [e for e in monthly_expenses if e > 0]
    confidence = 75 if len(valid_months) >= 2 else 50

    return jsonify({
        "predictedMonthlyExpense": round(predicted, 2),
        "confidenceLevel": confidence,
        "riskLevel": risk_level,
        "alerts": alerts,
        "recommendations": recommendations,
    })


@analytics_bp.route("/analytics/budget-status", methods=["GET"])
@jwt_required()
def budget_status():
    """Get budget utilization for all active budgets."""
    user_id = get_jwt_identity()
    db = get_db()

    budgets = list(db.budgets.find({"user_id": ObjectId(user_id)}))
    expenses = list(db.transactions.find({"user_id": ObjectId(user_id), "type": "expense"}))
    now = datetime.now()
    this_month = f"{now.year}-{str(now.month).zfill(2)}"

    # Week start (Sunday)
    week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    days_since_sun = week_start.weekday() + 1 if week_start.weekday() != 6 else 0
    from datetime import timedelta
    week_start = week_start - timedelta(days=days_since_sun)
    week_start_str = week_start.strftime("%Y-%m-%d")

    result = []
    for b in budgets:
        if b["period"] == "monthly":
            spent = sum(t["amount"] for t in expenses if t["category"] == b["category"] and t["date"].startswith(this_month))
        else:
            spent = sum(t["amount"] for t in expenses if t["category"] == b["category"] and t["date"] >= week_start_str)

        percentage = min((spent / b["limit"]) * 100, 100) if b["limit"] > 0 else 0
        remaining = max(b["limit"] - spent, 0)
        status = "exceeded" if spent > b["limit"] else ("warning" if percentage >= 80 else "safe")

        result.append({
            "id": str(b["_id"]),
            "category": b["category"],
            "limit": b["limit"],
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "percentage": round(percentage, 1),
            "period": b["period"],
            "status": status,
        })

    return jsonify(result)


@analytics_bp.route("/analytics/risk-assessment", methods=["GET"])
@jwt_required()
def risk_assessment():
    """Compute overall financial risk score (0-100)."""
    user_id = get_jwt_identity()
    db = get_db()

    try:
        from app.ml.risk_scorer import compute_risk_score
        score_data = compute_risk_score(db, user_id)
    except Exception:
        # Fallback: basic rule-based scoring
        all_tx = list(db.transactions.find({"user_id": ObjectId(user_id)}))
        total_income = sum(t["amount"] for t in all_tx if t["type"] == "income")
        total_expenses = sum(t["amount"] for t in all_tx if t["type"] == "expense")
        savings_rate = (total_income - total_expenses) / total_income if total_income > 0 else 0

        score = 50  # baseline
        if savings_rate > 0.3:
            score = 25
        elif savings_rate > 0.2:
            score = 35
        elif savings_rate > 0.1:
            score = 55
        elif savings_rate > 0:
            score = 70
        else:
            score = 85

        score_data = {
            "riskScore": score,
            "riskLevel": "low" if score < 40 else ("medium" if score < 70 else "high"),
            "factors": [
                {"name": "Savings Rate", "value": round(savings_rate * 100, 1), "impact": "positive" if savings_rate > 0.2 else "negative"},
            ],
        }

    return jsonify(score_data)
