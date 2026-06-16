"""
Profile Routes
GET /profile — Get current user's profile
PUT /profile — Create or update profile
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import get_db
from app.models.user import upsert_profile, get_profile, serialize_profile

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_user_profile():
    """Get current user's profile."""
    user_id = get_jwt_identity()
    db = get_db()
    profile = get_profile(db, user_id)

    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    return jsonify(serialize_profile(profile))


@profile_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_user_profile():
    """Create or update user profile."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    db = get_db()

    # Map camelCase from frontend to snake_case for MongoDB
    profile_data = {}
    field_map = {
        "phone": "phone",
        "occupation": "occupation",
        "employerName": "employer_name",
        "monthlyIncome": "monthly_income",
        "estimatedMonthlyExpenses": "estimated_monthly_expenses",
        "bankName": "bank_name",
        "accountNumber": "account_number",
        "accountType": "account_type",
        "ifscCode": "ifsc_code",
        "branchName": "branch_name",
        "monthlyRent": "monthly_rent",
        "emiAmount": "emi_amount",
        "insurancePremium": "insurance_premium",
        "financialGoal": "financial_goal",
        "profileCompleted": "profile_completed",
    }

    for camel, snake in field_map.items():
        if camel in data:
            profile_data[snake] = data[camel]

    profile = upsert_profile(db, user_id, profile_data)
    return jsonify(serialize_profile(profile))
