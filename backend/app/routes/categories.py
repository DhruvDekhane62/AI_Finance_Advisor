"""
Categories Route
GET /categories — List all expense/income categories
"""

from flask import Blueprint, jsonify

categories_bp = Blueprint("categories", __name__)

# Predefined categories with icons and colors
CATEGORIES = [
    {"id": 1, "name": "Food & Dining", "icon": "utensils", "color": "#f97316"},
    {"id": 2, "name": "Transportation", "icon": "car", "color": "#3b82f6"},
    {"id": 3, "name": "Shopping", "icon": "shopping-bag", "color": "#8b5cf6"},
    {"id": 4, "name": "Entertainment", "icon": "film", "color": "#ec4899"},
    {"id": 5, "name": "Health & Fitness", "icon": "heart", "color": "#ef4444"},
    {"id": 6, "name": "Housing", "icon": "home", "color": "#06b6d4"},
    {"id": 7, "name": "Utilities", "icon": "zap", "color": "#eab308"},
    {"id": 8, "name": "Education", "icon": "book", "color": "#14b8a6"},
    {"id": 9, "name": "Savings", "icon": "piggy-bank", "color": "#22c55e"},
    {"id": 10, "name": "Salary", "icon": "briefcase", "color": "#84cc16"},
    {"id": 11, "name": "Freelance", "icon": "laptop", "color": "#a855f7"},
    {"id": 12, "name": "Investment", "icon": "trending-up", "color": "#10b981"},
    {"id": 13, "name": "Other Income", "icon": "plus-circle", "color": "#6366f1"},
    {"id": 14, "name": "Other Expense", "icon": "minus-circle", "color": "#6b7280"},
]


@categories_bp.route("/categories", methods=["GET"])
def list_categories():
    """Return the predefined list of transaction categories."""
    return jsonify(CATEGORIES)
