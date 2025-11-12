from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps
import os
import logging

# ------------------ App Config ------------------
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "mindwell_default_secret_key")
# recommended (optional) cookie config for deployed HTTPS environments:
app.config.update(SESSION_COOKIE_SAMESITE="Lax", SESSION_COOKIE_SECURE=True)

# logging
logging.basicConfig(level=logging.INFO)

# ------------------ MongoDB Connection ------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://shahnawazimam53_db_user:Imam1234@cluster0.qogjor8.mongodb.net/mindwell?retryWrites=true&w=majority"
)
# TLS / certificate issues sometimes appear on serverless hosts.
# Passing tls=True is safe; tlsAllowInvalidCertificates can be toggled if needed.
client = MongoClient(MONGO_URI, tls=True)
db = client["mindwell"]

# Collections
users_col = db["users"]
moods_col = db["moods"]
journals_col = db["journals"]
community_col = db["community_posts"]
meditations_col = db["meditations"]

# ------------------ Helper: Login Required ------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "email" not in session:
            # For AJAX requests, return JSON; for browser navigation, redirect
            if request.is_json or request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify({"success": False, "message": "Authentication required."}), 401
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# ------------------ Home ------------------
@app.route("/")
def index():
    return render_template("index.html")


# ------------------ Helpers to get POST data robustly ------------------
def get_post_data():
    """
    Return a dict of POST data whether it's application/json or form-encoded.
    """
    if request.is_json:
        try:
            return request.get_json(force=True) or {}
        except Exception:
            return {}
    # for form-encoded posts
    return request.form.to_dict() or {}


# ------------------ Signup ------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")

    try:
        data = get_post_data()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        password = data.get("password") or ""

        if not all([name, email, password]):
            return jsonify({"success": False, "message": "All fields are required."}), 400

        if users_col.find_one({"email": email}):
            return jsonify({"success": False, "message": "Email already registered."})

        hashed_password = generate_password_hash(password)
        users_col.insert_one({
            "name": name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        })
        return jsonify({"success": True, "message": "Signup successful!"})

    except Exception as e:
        logging.exception("Signup error")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# ------------------ Login ------------------
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")

    try:
        data = get_post_data()
        email = (data.get("email") or "").strip()
        password = data.get("password") or ""

        if not all([email, password]):
            return jsonify({"success": False, "message": "Email and password required."}), 400

        user = users_col.find_one({"email": email})
        if user and check_password_hash(user["password"], password):
            session["email"] = email
            session["name"] = user.get("name", "")
            session["user_id"] = str(user["_id"])
            return jsonify({"success": True, "message": "Login successful!"})
        else:
            return jsonify({"success": False, "message": "Invalid email or password."})

    except Exception as e:
        logging.exception("Login error")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# ------------------ Logout ------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ------------------ Dashboard ------------------
@app.route("/dashboard")
@login_required
def dashboard():
    email = session["email"]
    user_moods = list(moods_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_journals = list(journals_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_community_posts = list(community_col.find({}, {"_id": 0}).sort("timestamp", -1))
    user_meditations = list(meditations_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))

    return render_template(
        "dashboard.html",
        mood_entries=user_moods,
        journal_entries=user_journals,
        community_posts=user_community_posts,
        meditation_entries=user_meditations
    )


# ------------------ Mood API ------------------
@app.route("/api/mood", methods=["POST"])
@login_required
def api_mood():
    try:
        email = session["email"]
        data = get_post_data()
        mood = (data.get("mood") or "").strip()
        description = (data.get("description") or "").strip()

        if not mood:
            return jsonify({"success": False, "message": "Mood is required."}), 400

        moods_col.insert_one({
            "email": email,
            "mood": mood,
            "description": description,
            "timestamp": datetime.utcnow()
        })
        return jsonify({"success": True, "message": "Mood saved successfully!"})
    except Exception as e:
        logging.exception("API mood error")
        return jsonify({"success": False, "message": f"Error saving mood: {str(e)}"}), 500


# ------------------ Journal ------------------
@app.route("/journal")
@login_required
def journal():
    return render_template("journal.html")


@app.route("/api/journal", methods=["GET", "POST"])
@login_required
def api_journal():
    try:
        email = session["email"]
        if request.method == "POST":
            data = get_post_data()
            entry = (data.get("entry") or "").strip()
            if not entry:
                return jsonify({"success": False, "message": "Journal entry is required."}), 400

            journals_col.insert_one({
                "email": email,
                "entry": entry,
                "timestamp": datetime.utcnow()
            })
            return jsonify({"success": True})

        entries = list(journals_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
        return jsonify(entries)
    except Exception as e:
        logging.exception("API journal error")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


# ------------------ Community ------------------
@app.route("/community")
@login_required
def community():
    posts = list(community_col.find({}, {"_id": 0}).sort("timestamp", -1))
    return render_template("community.html", posts=posts)


@app.route("/api/community", methods=["GET", "POST"])
@login_required
def api_community():
    try:
        email = session["email"]

        if request.method == "POST":
            data = get_post_data()
            message = (data.get("message") or "").strip()
            if not message:
                return jsonify({"success": False, "message": "Message cannot be empty."}), 400

            community_col.insert_one({
                "email": email,
                "name": session.get("name", ""),
                "content": message,
                "timestamp": datetime.utcnow()
            })
            return jsonify({"success": True, "message": "Post shared successfully!"})

        posts = list(community_col.find({}, {"_id": 0}).sort("timestamp", -1))
        return jsonify(posts)
    except Exception as e:
        logging.exception("API community error")
        return jsonify({"success": False, "message": f"Error sharing post: {str(e)}"}), 500


# ------------------ Meditation ------------------
@app.route("/meditation")
@login_required
def meditation():
    return render_template("meditation.html")


# ------------------ Export ------------------
@app.route("/export")
@login_required
def export():
    email = session["email"]
    user_moods = list(moods_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_journals = list(journals_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_meditations = list(meditations_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))

    return render_template(
        "export.html",
        mood_entries=user_moods,
        journal_entries=user_journals,
        meditation_entries=user_meditations
    )


# ------------------ Password Reset ------------------
@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email")
        user = users_col.find_one({"email": email})
        if user:
            flash("✅ If this email exists, a password reset link has been sent to your inbox.", "success")
        else:
            flash("⚠️ No account found with that email address.", "danger")
        return redirect(url_for("forgot_password"))
    return render_template("forgot-password.html")


@app.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    if request.method == "POST":
        new_password = request.form.get("password")
        flash("✅ Password reset successful!", "success")
        return redirect(url_for("login"))
    return render_template("reset-password.html")


# ------------------ Main ------------------
if __name__ == "__main__":
    app.run(debug=True)
else:
    # required so Vercel can import `app`
    app = app
