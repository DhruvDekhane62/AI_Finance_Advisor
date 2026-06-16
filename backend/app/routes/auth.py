"""
Authentication Routes
POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)
import bcrypt

from app.models import get_db
from app.models.user import create_user, find_user_by_email, find_user_by_id, serialize_user

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password") or not data.get("fullName"):
        return jsonify({"error": "email, password, and fullName are required"}), 400

    db = get_db()

    # Check if email already exists
    existing = find_user_by_email(db, data["email"])
    if existing:
        return jsonify({"error": "Email already in use"}), 409

    # Hash password with bcrypt
    password_hash = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user = create_user(db, data["email"], password_hash, data["fullName"])

    # Create JWT token
    token = create_access_token(identity=str(user["_id"]))

    response = jsonify(serialize_user(user))
    response.status_code = 201
    response.headers["Authorization"] = f"Bearer {token}"
    set_access_cookies(response, token)
    return response


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Login with email and password."""
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    db = get_db()
    user = find_user_by_email(db, data["email"])

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # Verify password
    if not bcrypt.checkpw(data["password"].encode("utf-8"), user["password_hash"].encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))

    response = jsonify(serialize_user(user))
    response.headers["Authorization"] = f"Bearer {token}"
    set_access_cookies(response, token)
    return response


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    """Logout — clears JWT cookies."""
    response = jsonify({"message": "Logged out"})
    unset_jwt_cookies(response)
    return response


@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    """Get currently authenticated user."""
    user_id = get_jwt_identity()
    db = get_db()
    user = find_user_by_id(db, user_id)

    if not user:
        return jsonify({"error": "User not found"}), 401

    return jsonify(serialize_user(user))
