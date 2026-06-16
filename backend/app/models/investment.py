"""
Investment Model — MongoDB Collection Schema
Tracks user investment portfolio (MF, SIP, FD, Stocks).
"""

from datetime import datetime, timezone
from bson import ObjectId


def create_investment(db, user_id, data):
    """Insert a new investment."""
    investment = {
        "user_id": ObjectId(user_id),
        "type": data["type"],  # MF, SIP, FD, Stocks
        "name": data.get("name", ""),
        "amount": float(data["amount"]),
        "risk_level": data.get("risk_level", "medium"),  # low, medium, high
        "returns_percentage": float(data.get("returns_percentage", 0)),
        "start_date": data.get("start_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "created_at": datetime.now(timezone.utc),
    }
    result = db.investments.insert_one(investment)
    investment["_id"] = result.inserted_id
    return investment


def list_investments(db, user_id):
    """List all investments for a user."""
    return list(db.investments.find({"user_id": ObjectId(user_id)}))


def get_investment(db, inv_id, user_id):
    """Get a single investment."""
    return db.investments.find_one({"_id": ObjectId(inv_id), "user_id": ObjectId(user_id)})


def update_investment(db, inv_id, user_id, data):
    """Update an investment."""
    update_fields = {}
    for field in ["type", "name", "amount", "risk_level", "returns_percentage"]:
        if field in data:
            if field in ("amount", "returns_percentage"):
                update_fields[field] = float(data[field])
            else:
                update_fields[field] = data[field]

    if not update_fields:
        return None

    return db.investments.find_one_and_update(
        {"_id": ObjectId(inv_id), "user_id": ObjectId(user_id)},
        {"$set": update_fields},
        return_document=True,
    )


def delete_investment(db, inv_id, user_id):
    """Delete an investment."""
    result = db.investments.delete_one({"_id": ObjectId(inv_id), "user_id": ObjectId(user_id)})
    return result.deleted_count > 0


def serialize_investment(inv):
    """Convert an investment document to JSON-safe dict."""
    if not inv:
        return None
    return {
        "id": str(inv["_id"]),
        "type": inv["type"],
        "name": inv.get("name", ""),
        "amount": inv["amount"],
        "riskLevel": inv.get("risk_level", "medium"),
        "returnsPercentage": inv.get("returns_percentage", 0),
        "startDate": inv.get("start_date", ""),
        "createdAt": inv["created_at"].isoformat(),
    }
