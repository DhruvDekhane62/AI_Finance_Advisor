"""
Budget Routes
GET    /budgets       — List all budgets
POST   /budgets       — Create a budget
PATCH  /budgets/:id   — Update a budget
DELETE /budgets/:id   — Delete a budget
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import get_db
from app.models.budget import (
    create_budget,
    list_budgets,
    update_budget,
    delete_budget,
    serialize_budget,
)

budgets_bp = Blueprint("budgets", __name__)


@budgets_bp.route("/budgets", methods=["GET"])
@jwt_required()
def list_b():
    """List all budgets for the current user."""
    user_id = get_jwt_identity()
    db = get_db()
    budgets = list_budgets(db, user_id)
    return jsonify([serialize_budget(b) for b in budgets])


@budgets_bp.route("/budgets", methods=["POST"])
@jwt_required()
def create_b():
    """Create a new budget."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("category") or not data.get("limit"):
        return jsonify({"error": "category and limit are required"}), 400

    db = get_db()
    budget = create_budget(db, user_id, data)
    return jsonify(serialize_budget(budget)), 201


@budgets_bp.route("/budgets/<budget_id>", methods=["PATCH"])
@jwt_required()
def update_b(budget_id):
    """Update a budget."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    db = get_db()
    budget = update_budget(db, budget_id, user_id, data)

    if not budget:
        return jsonify({"error": "Budget not found"}), 404

    return jsonify(serialize_budget(budget))


@budgets_bp.route("/budgets/<budget_id>", methods=["DELETE"])
@jwt_required()
def delete_b(budget_id):
    """Delete a budget."""
    user_id = get_jwt_identity()
    db = get_db()
    success = delete_budget(db, budget_id, user_id)

    if not success:
        return jsonify({"error": "Budget not found"}), 404

    return "", 204
