from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from bson.json_util import dumps

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Replace with a secure secret key

# ------------------ MongoDB Atlas Connection ------------------
client = MongoClient(
    "mongodb+srv://shahnawazimam53_db_user:Imam1234@cluster0.qogjor8.mongodb.net/mindwell?retryWrites=true&w=majority"
)
db = client['mindwell']
users_col = db['users']
moods_col = db['moods']
journals_col = db['journals']
community_col = db['community_posts']
meditations_col = db['meditations']  # New collection for meditation sessions

# ------------------ Helper: Login Required ------------------
def login_required(f):
    from functools import wraps
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
    users_col.insert_one({"name": name, "email": email, "password": hashed_password})
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
@app.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    email = session['email']

    # Handle mood submission
    if request.method == 'POST':
        mood = request.form.get('mood')
        description = request.form.get('description')
        if mood:
            moods_col.insert_one({
                "email": email,
                "mood": mood,
                "description": description,
                "timestamp": datetime.utcnow()
            })
        return redirect(url_for('dashboard'))

    # GET method - fetch user data
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

# ------------------ API: Moods ------------------
@app.route('/api/mood', methods=['GET', 'POST'])
@login_required
def api_mood():
    email = session['email']

    if request.method == 'POST':
        data = request.get_json()
        mood = data.get('mood')
        description = data.get('description')
        moods_col.insert_one({
            "email": email,
            "mood": mood,
            "description": description,
            "timestamp": datetime.utcnow()
        })
        return jsonify({"success": True})

    moods = list(moods_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    return jsonify(moods)

# ------------------ Meditation API ------------------
@app.route('/api/meditation', methods=['POST'])
@login_required
def api_meditation():
    email = session['email']
    data = request.get_json()
    duration = data.get('duration')  # duration in minutes
    session_type = data.get('type')  # morning / evening / stress

    if duration and session_type:
        meditations_col.insert_one({
            "email": email,
            "type": session_type,
            "duration": duration,
            "timestamp": datetime.utcnow()
        })
        return jsonify({"success": True})
    return jsonify({"success": False, "message": "Invalid data"})

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
        journals_col.insert_one({
            "email": email,
            "entry": entry,
            "timestamp": datetime.utcnow()
        })
        return jsonify({"success": True})

    entries = list(journals_col.find({"email": email}, {"_id": 0}).sort("timestamp", -1))
    return jsonify(entries)

# ------------------ Community ------------------
@app.route('/community')
@login_required
def community():
    return render_template('community.html')

@app.route('/api/community', methods=['GET', 'POST'])
@login_required
def api_community():
    email = session['email']

    if request.method == 'POST':
        data = request.get_json()
        message = data.get('message')
        community_col.insert_one({
            "email": email,
            "name": session['name'],
            "message": message,
            "timestamp": datetime.utcnow()
        })
        return jsonify({"success": True})

    posts = list(community_col.find({}, {"_id": 0}).sort("timestamp", -1))
    return jsonify(posts)

# ------------------ Meditation Page ------------------
@app.route('/meditation')
@login_required
def meditation():
    return render_template('meditation.html')

# ------------------ Export ------------------
@app.route('/export')
@login_required
def export():
    return render_template('export.html')

@app.route('/api/export', methods=['GET'])
@login_required
def api_export():
    email = session['email']
    moods = list(moods_col.find({"email": email}, {"_id": 0}))
    journals = list(journals_col.find({"email": email}, {"_id": 0}))
    meditations = list(meditations_col.find({"email": email}, {"_id": 0}))
    data = {"moods": moods, "journals": journals, "meditations": meditations}
    return dumps(data)

# ------------------ Forgot Password ------------------
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        user = users_col.find_one({"email": email})
        if user:
            return jsonify({"success": True, "message": "Password reset link sent."})
        return jsonify({"success": False, "message": "Email not found."})
    return render_template('forgot-password.html')

if __name__ == "__main__":
    app.run(debug=True)
