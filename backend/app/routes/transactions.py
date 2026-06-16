"""
Transaction Routes
GET    /transactions       — List transactions (with filters)
POST   /transactions       — Create a transaction
GET    /transactions/:id   — Get a transaction
PATCH  /transactions/:id   — Update a transaction
DELETE /transactions/:id   — Delete a transaction
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import get_db
from app.models.transaction import (
    create_transaction,
    list_transactions,
    get_transaction,
    update_transaction,
    delete_transaction,
    serialize_transaction,
)

transactions_bp = Blueprint("transactions", __name__)


@transactions_bp.route("/transactions", methods=["GET"])
@jwt_required()
def list_tx():
    """List all transactions with optional filters."""
    user_id = get_jwt_identity()
    db = get_db()

    category = request.args.get("category")
    tx_type = request.args.get("type")
    limit = int(request.args.get("limit", 100))

    transactions = list_transactions(db, user_id, category=category, tx_type=tx_type, limit=limit)
    return jsonify([serialize_transaction(tx) for tx in transactions])


@transactions_bp.route("/transactions", methods=["POST"])
@jwt_required()
def create_tx():
    """Create a new transaction."""
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["amount", "type", "category", "description", "date"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"'{field}' is required"}), 400

    if data["type"] not in ("income", "expense"):
        return jsonify({"error": "type must be 'income' or 'expense'"}), 400

    db = get_db()
    tx = create_transaction(db, user_id, data)
    return jsonify(serialize_transaction(tx)), 201


@transactions_bp.route("/transactions/<tx_id>", methods=["GET"])
@jwt_required()
def get_tx(tx_id):
    """Get a single transaction."""
    user_id = get_jwt_identity()
    db = get_db()
    tx = get_transaction(db, tx_id, user_id)

    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    return jsonify(serialize_transaction(tx))


@transactions_bp.route("/transactions/<tx_id>", methods=["PATCH"])
@jwt_required()
def update_tx(tx_id):
    """Update a transaction."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify({"error": "Request body required"}), 400

    db = get_db()
    tx = update_transaction(db, tx_id, user_id, data)

    if not tx:
        return jsonify({"error": "Transaction not found"}), 404

    return jsonify(serialize_transaction(tx))


@transactions_bp.route("/transactions/<tx_id>", methods=["DELETE"])
@jwt_required()
def delete_tx(tx_id):
    """Delete a transaction."""
    user_id = get_jwt_identity()
    db = get_db()
    success = delete_transaction(db, tx_id, user_id)

    if not success:
        return jsonify({"error": "Transaction not found"}), 404

    return "", 204
