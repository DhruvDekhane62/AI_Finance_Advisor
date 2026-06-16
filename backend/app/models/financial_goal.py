"""
Financial Goal Model — MongoDB Collection Schema
Tracks user savings and investment goals with progress.
"""

from datetime import datetime, timezone
from bson import ObjectId


def create_goal(db, user_id, data):
    """Insert a new financial goal."""
    goal = {
        "user_id": ObjectId(user_id),
        "description": data["description"],
        "target_amount": float(data["target_amount"]),
        "current_progress": float(data.get("current_progress", 0)),
        "deadline": data.get("deadline", ""),
        "status": data.get("status", "active"),  # active, completed, abandoned
        "created_at": datetime.now(timezone.utc),
    }
    result = db.financial_goals.insert_one(goal)
    goal["_id"] = result.inserted_id
    return goal


def list_goals(db, user_id):
    """List all financial goals for a user."""
    return list(db.financial_goals.find({"user_id": ObjectId(user_id)}))


def get_goal(db, goal_id, user_id):
    """Get a single financial goal."""
    return db.financial_goals.find_one({"_id": ObjectId(goal_id), "user_id": ObjectId(user_id)})


def update_goal(db, goal_id, user_id, data):
    """Update a financial goal (including progress)."""
    update_fields = {}
    for field in ["description", "target_amount", "current_progress", "deadline", "status"]:
        if field in data:
            if field in ("target_amount", "current_progress"):
                update_fields[field] = float(data[field])
            else:
                update_fields[field] = data[field]

    # Auto-complete if progress reaches target
    if "current_progress" in update_fields and "target_amount" not in update_fields:
        goal = db.financial_goals.find_one({"_id": ObjectId(goal_id)})
        if goal and update_fields["current_progress"] >= goal["target_amount"]:
            update_fields["status"] = "completed"

    if not update_fields:
        return None

    return db.financial_goals.find_one_and_update(
        {"_id": ObjectId(goal_id), "user_id": ObjectId(user_id)},
        {"$set": update_fields},
        return_document=True,
    )


def delete_goal(db, goal_id, user_id):
    """Delete a financial goal."""
    result = db.financial_goals.delete_one({"_id": ObjectId(goal_id), "user_id": ObjectId(user_id)})
    return result.deleted_count > 0


def serialize_goal(goal):
    """Convert a goal document to JSON-safe dict."""
    if not goal:
        return None
    progress_pct = 0
    if goal["target_amount"] > 0:
        progress_pct = round((goal["current_progress"] / goal["target_amount"]) * 100, 1)

    return {
        "id": str(goal["_id"]),
        "description": goal["description"],
        "targetAmount": goal["target_amount"],
        "currentProgress": goal["current_progress"],
        "progressPercentage": min(progress_pct, 100),
        "deadline": goal.get("deadline", ""),
        "status": goal["status"],
        "createdAt": goal["created_at"].isoformat(),
    }
