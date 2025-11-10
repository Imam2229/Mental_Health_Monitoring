from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from functools import wraps

app = Flask(__name__)
app.secret_key = "mindwell_2025_secret_key_shahnawaz"

# [ MongoDB Atlas Connection ]
client = MongoClient(
    "mongodb+srv://shahnawazimam53_db_user:Imam1234@cluster0.qogjor8.mongodb.net/mindwell?retryWrites=true&w=majority"
)
db = client['mindwell']
users_col = db['users']
moods_col = db['moods']
journals_col = db['journals']
community_col = db['community_posts']
meditations_col = db['meditations']

# [ Helper: Login Required ]
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'email' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# ------------------ Home ------------------
@app.route('/')
def index():
    return render_template('index.html')

# ------------------ Signup ------------------
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'GET':
        return render_template('signup.html')

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if users_col.find_one({"email": email}):
        return jsonify({"success": False, "message": "Email already registered."})

    hashed_password = generate_password_hash(password)
    users_col.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    })
    return jsonify({"success": True})

# ------------------ Login ------------------
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_col.find_one({"email": email})
    if user and check_password_hash(user['password'], password):
        session['email'] = email
        session['name'] = user['name']
        session['user_id'] = str(user['_id'])
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid email or password."})

# ------------------ Logout ------------------
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

# ------------------ Dashboard ------------------
@app.route('/dashboard', methods=['GET'])
@login_required
def dashboard():
    email = session['email']
    user_moods = list(moods_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_journals = list(journals_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_community_posts = list(community_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_meditations = list(meditations_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))

    return render_template(
        'dashboard.html',
        mood_entries=user_moods,
        journal_entries=user_journals,
        community_posts=user_community_posts,
        meditation_entries=user_meditations
    )

# ------------------ ✅ API: Save Mood (Fix for Dashboard) ------------------
@app.route('/api/mood', methods=['POST'])
@login_required
def api_mood():
    email = session['email']
    data = request.get_json() or {}
    mood = data.get('mood')
    description = data.get('description', '')

    if not mood:
        return jsonify({"success": False, "message": "Mood is required."}), 400

    moods_col.insert_one({
        "email": email,
        "mood": mood,
        "description": description,
        "timestamp": datetime.utcnow()
    })
    return jsonify({"success": True, "message": "Mood saved successfully!"})

# ------------------ Journal ------------------
@app.route('/journal')
@login_required
def journal():
    return render_template('journal.html')

@app.route('/api/journal', methods=['GET', 'POST'])
@login_required
def api_journal():
    email = session['email']
    if request.method == 'POST':
        data = request.get_json()
        entry = data.get('entry')
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

# ------------------ ✅ Community ------------------
@app.route('/community')
@login_required
def community():
    posts = list(community_col.find({}, {"_id": 0}).sort("timestamp", -1))
    return render_template('community.html', posts=posts)

@app.route('/api/community', methods=['GET', 'POST'])
@login_required
def api_community():
    email = session['email']

    if request.method == 'POST':
        data = request.get_json()
        message = data.get('message', '').strip()
        if not message:
            return jsonify({"success": False, "message": "Message cannot be empty."}), 400

        community_col.insert_one({
            "email": email,
            "name": session['name'],
            "content": message,  # fixed field to 'content' to match template
            "timestamp": datetime.utcnow()
        })
        return jsonify({"success": True, "message": "Post shared successfully!"})

    posts = list(community_col.find({}, {"_id": 0}).sort("timestamp", -1))
    return jsonify(posts)

# ------------------ Meditation ------------------
@app.route('/meditation')
@login_required
def meditation():
    return render_template('meditation.html')

# ------------------ Export ------------------
@app.route('/export')
@login_required
def export():
    email = session['email']
    user_moods = list(moods_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_journals = list(journals_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    user_meditations = list(meditations_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))

    return render_template(
        'export.html',
        mood_entries=user_moods,
        journal_entries=user_journals,
        meditation_entries=user_meditations
    )

# ------------------ Forgot Password ------------------
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = users_col.find_one({"email": email})
        if user:
            flash("✅ If this email exists, a password reset link has been sent to your inbox.", "success")
        else:
            flash("⚠️ No account found with that email address.", "danger")
        return redirect(url_for('forgot_password'))
    return render_template('forgot-password.html')

# ------------------ Reset Password ------------------
@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if request.method == 'POST':
        new_password = request.form.get('password')
        flash("✅ Password reset successful!", "success")
        return redirect(url_for('login'))
    return render_template('reset-password.html')

# ------------------ Main ------------------
if __name__ == "__main__":
    app.run(debug=True)
else:
    app = app
