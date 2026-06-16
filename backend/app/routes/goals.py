"""
Financial Goals Routes
GET    /goals       — List all financial goals
POST   /goals       — Create a new goal
GET    /goals/:id   — Get a goal
PATCH  /goals/:id   — Update a goal (including progress)
DELETE /goals/:id   — Delete a goal
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import get_db
from app.models.financial_goal import (
    create_goal,
    list_goals,
    get_goal,
    update_goal,
    delete_goal,
    serialize_goal,
)

goals_bp = Blueprint("goals", __name__)


@goals_bp.route("/goals", methods=["GET"])
@jwt_required()
def list_g():
    """List all financial goals for the current user."""
    user_id = get_jwt_identity()
    db = get_db()
    goals = list_goals(db, user_id)
    return jsonify([serialize_goal(g) for g in goals])


@goals_bp.route("/goals", methods=["POST"])
@jwt_required()
def create_g():
    """Create a new financial goal."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("description") or not data.get("target_amount"):
        return jsonify({"error": "description and target_amount are required"}), 400

    db = get_db()
    goal = create_goal(db, user_id, data)
    return jsonify(serialize_goal(goal)), 201


@goals_bp.route("/goals/<goal_id>", methods=["GET"])
@jwt_required()
def get_g(goal_id):
    """Get a single financial goal."""
    user_id = get_jwt_identity()
    db = get_db()
    goal = get_goal(db, goal_id, user_id)

    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    return jsonify(serialize_goal(goal))


@goals_bp.route("/goals/<goal_id>", methods=["PATCH"])
@jwt_required()
def update_g(goal_id):
    """Update a financial goal (including progress)."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    db = get_db()
    goal = update_goal(db, goal_id, user_id, data)

    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    return jsonify(serialize_goal(goal))


@goals_bp.route("/goals/<goal_id>", methods=["DELETE"])
@jwt_required()
def delete_g(goal_id):
    """Delete a financial goal."""
    user_id = get_jwt_identity()
    db = get_db()
    success = delete_goal(db, goal_id, user_id)

    if not success:
        return jsonify({"error": "Goal not found"}), 404

    return "", 204
