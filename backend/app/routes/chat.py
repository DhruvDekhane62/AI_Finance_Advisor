"""
Chat Routes
POST /chat — Send a message to the AI Advisor
GET /chat  — Retrieve chat history
DELETE /chat - Clear chat history
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import get_db
from app.models.chat import create_message, list_messages, clear_chat, serialize_message
from app.agents.crew_setup import run_finance_crew

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["GET"])
@jwt_required()
def get_chat_history():
    """Retrieve chat history for the user."""
    user_id = get_jwt_identity()
    db = get_db()
    messages = list_messages(db, user_id)
    return jsonify([serialize_message(m) for m in messages])


@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
def send_chat_message():
    """Send a message to the Agentic AI system and get a response."""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not data.get("message"):
        return jsonify({"error": "Message is required"}), 400

    user_message = data["message"]
    db = get_db()

    # Save user message to DB
    user_msg_doc = create_message(db, user_id, "user", user_message)

    # ── Trigger CrewAI Multi-Agent System ──────────────────────────────────
    # This runs the crew hierarchically to generate a comprehensive response.
    ai_response_text = run_finance_crew(user_id, user_message)

    # Save AI response to DB
    ai_msg_doc = create_message(
        db, 
        user_id, 
        "assistant", 
        ai_response_text, 
        agent_name="Chief Financial Advisor Crew"
    )

    return jsonify({
        "userMessage": serialize_message(user_msg_doc),
        "aiResponse": serialize_message(ai_msg_doc)
    }), 201


@chat_bp.route("/chat", methods=["DELETE"])
@jwt_required()
def clear_chat_history():
    """Clear chat history for the user."""
    user_id = get_jwt_identity()
    db = get_db()
    clear_chat(db, user_id)
    return "", 204
