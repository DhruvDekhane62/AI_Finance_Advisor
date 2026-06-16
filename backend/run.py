"""
Entry point for the Flask backend API.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    import os
    port = int(os.environ.get("API_PORT", 5000))
    # Run development server
    app.run(host="0.0.0.0", port=port, debug=True)
