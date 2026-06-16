"""
User Model — MongoDB Collection Schema
Handles user accounts and profiles.
"""

from datetime import datetime, timezone


def create_user(db, email, password_hash, full_name):
    """Insert a new user and return the created document."""
    user = {
        "email": email,
        "password_hash": password_hash,
        "full_name": full_name,
        "created_at": datetime.now(timezone.utc),
    }
    result = db.users.insert_one(user)
    user["_id"] = result.inserted_id
    return user


def find_user_by_email(db, email):
    """Find a user by email address."""
    return db.users.find_one({"email": email})


def find_user_by_id(db, user_id):
    """Find a user by ObjectId."""
    from bson import ObjectId
    return db.users.find_one({"_id": ObjectId(user_id)})


def serialize_user(user):
    """Convert a user document to a JSON-safe dict."""
    if not user:
        return None
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "fullName": user["full_name"],
        "createdAt": user["created_at"].isoformat(),
        "profileCompleted": user.get("profile_completed", False),
    }


# ── User Profile ────────────────────────────────────────────────

def upsert_profile(db, user_id, profile_data):
    """Create or update a user profile."""
    from bson import ObjectId

    profile_data["user_id"] = ObjectId(user_id)
    profile_data["updated_at"] = datetime.now(timezone.utc)

    result = db.user_profiles.find_one_and_update(
        {"user_id": ObjectId(user_id)},
        {"$set": profile_data},
        upsert=True,
        return_document=True,
    )

    # Mark profile as completed in users collection
    if profile_data.get("profile_completed"):
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile_completed": True}},
        )

    return result


def get_profile(db, user_id):
    """Get the user profile by user_id."""
    from bson import ObjectId
    return db.user_profiles.find_one({"user_id": ObjectId(user_id)})


def serialize_profile(profile):
    """Convert a profile document to JSON-safe dict."""
    if not profile:
        return None
    return {
        "id": str(profile["_id"]),
        "userId": str(profile["user_id"]),
        "phone": profile.get("phone"),
        "occupation": profile.get("occupation"),
        "employerName": profile.get("employer_name"),
        "monthlyIncome": profile.get("monthly_income"),
        "estimatedMonthlyExpenses": profile.get("estimated_monthly_expenses"),
        "bankName": profile.get("bank_name"),
        "accountNumber": profile.get("account_number"),
        "accountType": profile.get("account_type"),
        "ifscCode": profile.get("ifsc_code"),
        "branchName": profile.get("branch_name"),
        "monthlyRent": profile.get("monthly_rent"),
        "emiAmount": profile.get("emi_amount"),
        "insurancePremium": profile.get("insurance_premium"),
        "financialGoal": profile.get("financial_goal"),
        "profileCompleted": profile.get("profile_completed", False),
    }
