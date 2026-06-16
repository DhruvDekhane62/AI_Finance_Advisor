"""
Chat History Model — MongoDB Collection Schema
Stores conversation history between user and AI agents.
"""

from datetime import datetime, timezone
from bson import ObjectId


def create_message(db, user_id, role, content, agent_name=None):
    """Insert a new chat message."""
    message = {
        "user_id": ObjectId(user_id),
        "role": role,  # "user" or "assistant"
        "content": content,
        "agent_name": agent_name,  # Which agent responded (for agentic tracking)
        "created_at": datetime.now(timezone.utc),
    }
    result = db.chat_history.insert_one(message)
    message["_id"] = result.inserted_id
    return message


def list_messages(db, user_id, limit=50):
    """List chat messages for a user, ordered by time."""
    cursor = db.chat_history.find({"user_id": ObjectId(user_id)}).sort("created_at", 1).limit(limit)
    return list(cursor)


def clear_chat(db, user_id):
    """Delete all chat messages for a user."""
    db.chat_history.delete_many({"user_id": ObjectId(user_id)})


def serialize_message(msg):
    """Convert a message document to JSON-safe dict."""
    if not msg:
        return None
    return {
        "id": str(msg["_id"]),
        "role": msg["role"],
        "content": msg["content"],
        "agentName": msg.get("agent_name"),
        "createdAt": msg["created_at"].isoformat(),
    }
