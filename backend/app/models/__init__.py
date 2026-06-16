"""
Database Initialization & Connection
Provides PyMongo client and collection references.
"""

from pymongo import MongoClient

# Global database reference
db = None
client = None


def init_db(app):
    """Initialize MongoDB connection from Flask app config."""
    global db, client
    uri = app.config["MONGODB_URI"]
    client = MongoClient(uri)
    db = client.get_default_database()

    # Create indexes for performance
    db.users.create_index("email", unique=True)
    db.transactions.create_index("user_id")
    db.transactions.create_index("date")
    db.budgets.create_index("user_id")
    db.investments.create_index("user_id")
    db.financial_goals.create_index("user_id")
    db.chat_history.create_index([("user_id", 1), ("created_at", 1)])

    print(f"✅ Connected to MongoDB: {uri}")


def get_db():
    """Return the database reference."""
    return db
