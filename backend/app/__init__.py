"""
Flask Application Factory
Creates and configures the Flask app with all extensions and blueprints.
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.config import Config
from app.models import init_db


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── Extensions ──────────────────────────────────────────────
    CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://localhost:5000"])
    JWTManager(app)
    Limiter(app=app, key_func=get_remote_address, default_limits=["200 per minute"])

    # ── Database ────────────────────────────────────────────────
    init_db(app)

    # ── Register Blueprints ─────────────────────────────────────
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.transactions import transactions_bp
    from app.routes.budgets import budgets_bp
    from app.routes.categories import categories_bp
    from app.routes.chat import chat_bp
    from app.routes.analytics import analytics_bp
    from app.routes.investments import investments_bp
    from app.routes.goals import goals_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(profile_bp, url_prefix="/api")
    app.register_blueprint(transactions_bp, url_prefix="/api")
    app.register_blueprint(budgets_bp, url_prefix="/api")
    app.register_blueprint(categories_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(investments_bp, url_prefix="/api")
    app.register_blueprint(goals_bp, url_prefix="/api")

    # ── Health Check ────────────────────────────────────────────
    @app.route("/api/healthz")
    def health_check():
        return {"status": "healthy"}

    return app
