"""
Investment Routes
GET    /investments           — List investments
POST   /investments           — Add an investment
GET    /investments/:id       — Get an investment
PATCH  /investments/:id       — Update an investment
DELETE /investments/:id       — Delete an investment
GET    /investments/suggest   — AI-powered investment suggestions
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import get_db
from app.models.investment import (
    create_investment,
    list_investments,
    get_investment,
    update_investment,
    delete_investment,
    serialize_investment,
)

investments_bp = Blueprint("investments", __name__)


@investments_bp.route("/investments", methods=["GET"])
@jwt_required()
def list_inv():
    """List all investments for the current user."""
    user_id = get_jwt_identity()
    db = get_db()
    investments = list_investments(db, user_id)
    return jsonify([serialize_investment(inv) for inv in investments])


@investments_bp.route("/investments", methods=["POST"])
@jwt_required()
def create_inv():
    """Add a new investment."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("type") or not data.get("amount"):
        return jsonify({"error": "type and amount are required"}), 400

    db = get_db()
    inv = create_investment(db, user_id, data)
    return jsonify(serialize_investment(inv)), 201


@investments_bp.route("/investments/<inv_id>", methods=["GET"])
@jwt_required()
def get_inv(inv_id):
    """Get a single investment."""
    user_id = get_jwt_identity()
    db = get_db()
    inv = get_investment(db, inv_id, user_id)

    if not inv:
        return jsonify({"error": "Investment not found"}), 404

    return jsonify(serialize_investment(inv))


@investments_bp.route("/investments/<inv_id>", methods=["PATCH"])
@jwt_required()
def update_inv(inv_id):
    """Update an investment."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    db = get_db()
    inv = update_investment(db, inv_id, user_id, data)

    if not inv:
        return jsonify({"error": "Investment not found"}), 404

    return jsonify(serialize_investment(inv))


@investments_bp.route("/investments/<inv_id>", methods=["DELETE"])
@jwt_required()
def delete_inv(inv_id):
    """Delete an investment."""
    user_id = get_jwt_identity()
    db = get_db()
    success = delete_investment(db, inv_id, user_id)

    if not success:
        return jsonify({"error": "Investment not found"}), 404

    return "", 204


@investments_bp.route("/investments/suggest", methods=["GET"])
@jwt_required()
def suggest_investments():
    """AI-powered investment suggestions based on user profile and risk appetite."""
    user_id = get_jwt_identity()
    db = get_db()

    # Get user profile for context
    from app.models.user import get_profile
    profile = get_profile(db, user_id)

    monthly_income = profile.get("monthly_income", 0) if profile else 0
    monthly_expenses = profile.get("estimated_monthly_expenses", 0) if profile else 0
    surplus = monthly_income - monthly_expenses

    # Get existing investments
    existing = list_investments(db, user_id)
    existing_types = [inv["type"] for inv in existing]

    suggestions = []

    if surplus > 0:
        # SIP recommendation
        if "SIP" not in existing_types:
            suggestions.append({
                "type": "SIP",
                "name": "Systematic Investment Plan",
                "suggestedAmount": round(surplus * 0.3, 0),
                "riskLevel": "medium",
                "expectedReturns": 12.0,
                "reason": "SIPs average 12% annual returns and build long-term wealth with rupee cost averaging.",
            })

        # FD for emergency fund
        if "FD" not in existing_types:
            suggestions.append({
                "type": "FD",
                "name": "Fixed Deposit (Emergency Fund)",
                "suggestedAmount": round(monthly_expenses * 6, 0),
                "riskLevel": "low",
                "expectedReturns": 7.0,
                "reason": "Maintain 6 months of expenses as emergency fund in safe FDs.",
            })

        # Mutual Funds
        if surplus > 5000:
            suggestions.append({
                "type": "MF",
                "name": "Diversified Equity Mutual Fund",
                "suggestedAmount": round(surplus * 0.2, 0),
                "riskLevel": "medium",
                "expectedReturns": 14.0,
                "reason": "Diversified equity funds offer higher returns for medium-risk appetite.",
            })

        # Stocks for higher surplus
        if surplus > 15000:
            suggestions.append({
                "type": "Stocks",
                "name": "Blue-chip Stock Portfolio",
                "suggestedAmount": round(surplus * 0.1, 0),
                "riskLevel": "high",
                "expectedReturns": 18.0,
                "reason": "Blue-chip stocks offer higher growth potential for experienced investors.",
            })
    else:
        suggestions.append({
            "type": "Savings",
            "name": "Build Emergency Fund First",
            "suggestedAmount": 1000,
            "riskLevel": "low",
            "expectedReturns": 4.0,
            "reason": "Start with a savings account and build an emergency fund before investing.",
        })

    return jsonify(suggestions)
