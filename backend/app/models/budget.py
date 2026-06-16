"""
Budget Model — MongoDB Collection Schema
Tracks spending limits per category.
"""

from datetime import datetime, timezone
from bson import ObjectId


def create_budget(db, user_id, data):
    """Insert a new budget."""
    budget = {
        "user_id": ObjectId(user_id),
        "category": data["category"],
        "limit": float(data["limit"]),
        "period": data.get("period", "monthly"),  # "monthly" or "weekly"
        "created_at": datetime.now(timezone.utc),
    }
    result = db.budgets.insert_one(budget)
    budget["_id"] = result.inserted_id
    return budget


def list_budgets(db, user_id):
    """List all budgets for a user."""
    return list(db.budgets.find({"user_id": ObjectId(user_id)}))


def update_budget(db, budget_id, user_id, data):
    """Update a budget."""
    update_fields = {}
    for field in ["category", "limit", "period"]:
        if field in data:
            update_fields[field] = float(data[field]) if field == "limit" else data[field]

    if not update_fields:
        return None

    return db.budgets.find_one_and_update(
        {"_id": ObjectId(budget_id), "user_id": ObjectId(user_id)},
        {"$set": update_fields},
        return_document=True,
    )


def delete_budget(db, budget_id, user_id):
    """Delete a budget."""
    result = db.budgets.delete_one({"_id": ObjectId(budget_id), "user_id": ObjectId(user_id)})
    return result.deleted_count > 0


def serialize_budget(b):
    """Convert a budget document to JSON-safe dict."""
    if not b:
        return None
    return {
        "id": str(b["_id"]),
        "category": b["category"],
        "limit": b["limit"],
        "period": b["period"],
        "createdAt": b["created_at"].isoformat(),
    }
