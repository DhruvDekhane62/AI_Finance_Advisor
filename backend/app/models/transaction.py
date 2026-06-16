"""
Transaction Model — MongoDB Collection Schema
Tracks all income and expense transactions.
"""

from datetime import datetime, timezone
from bson import ObjectId


def create_transaction(db, user_id, data):
    """Insert a new transaction."""
    transaction = {
        "user_id": ObjectId(user_id),
        "amount": float(data["amount"]),
        "type": data["type"],  # "income" or "expense"
        "category": data["category"],
        "description": data["description"],
        "date": data["date"],  # ISO date string YYYY-MM-DD
        "created_at": datetime.now(timezone.utc),
    }
    result = db.transactions.insert_one(transaction)
    transaction["_id"] = result.inserted_id
    return transaction


def list_transactions(db, user_id, category=None, tx_type=None, limit=100):
    """List transactions for a user with optional filters."""
    query = {"user_id": ObjectId(user_id)}
    if category:
        query["category"] = category
    if tx_type:
        query["type"] = tx_type

    cursor = db.transactions.find(query).sort("date", -1).limit(limit)
    return list(cursor)


def get_transaction(db, tx_id, user_id):
    """Get a single transaction by ID."""
    return db.transactions.find_one({"_id": ObjectId(tx_id), "user_id": ObjectId(user_id)})


def update_transaction(db, tx_id, user_id, data):
    """Update a transaction."""
    update_fields = {}
    for field in ["amount", "type", "category", "description", "date"]:
        if field in data:
            update_fields[field] = float(data[field]) if field == "amount" else data[field]

    if not update_fields:
        return None

    result = db.transactions.find_one_and_update(
        {"_id": ObjectId(tx_id), "user_id": ObjectId(user_id)},
        {"$set": update_fields},
        return_document=True,
    )
    return result


def delete_transaction(db, tx_id, user_id):
    """Delete a transaction."""
    result = db.transactions.delete_one({"_id": ObjectId(tx_id), "user_id": ObjectId(user_id)})
    return result.deleted_count > 0


def serialize_transaction(tx):
    """Convert a transaction document to JSON-safe dict."""
    if not tx:
        return None
    return {
        "id": str(tx["_id"]),
        "amount": tx["amount"],
        "type": tx["type"],
        "category": tx["category"],
        "description": tx["description"],
        "date": tx["date"],
        "createdAt": tx["created_at"].isoformat(),
    }
