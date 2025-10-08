// ==================== app.js - MindWell Application (Merged & Fully Functional) ====================
class MindWellApp {
    constructor() {
        this.userData = { moodEntries: [], journalEntries: [], communityPosts: [] };
        this.timerInterval = null;
        this.remainingTime = 0;
        this.moodChart = null;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    /* ---------------- Initialization ---------------- */
    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.addNotificationStyles();
    }

    /* ---------------- User Data Management ---------------- */
    getLoggedInUser() {
        return localStorage.getItem('loggedInUser') || null;
    }

    loadUserData() {
        const user = this.getLoggedInUser();
        if (user) {
            this.userData = JSON.parse(localStorage.getItem(`mindwell_user_${user}`)) || { moodEntries: [], journalEntries: [], communityPosts: [] };
        } else {
            this.userData = { moodEntries: [], journalEntries: [], communityPosts: [] };
        }
    }

    saveUserData() {
        const user = this.getLoggedInUser();
        if (user) localStorage.setItem(`mindwell_user_${user}`, JSON.stringify(this.userData));
    }

    /* ---------------- Dashboard / Mood Tracking ---------------- */
    setupMoodTracking() {
        const moodSelector = document.getElementById('moodSelector');
        const saveBtn = document.getElementById('saveMoodBtn');
        const moodDescription = document.getElementById('moodDescription');
        const recommendationEl = document.getElementById('recommendation');
        const moodCountEl = document.getElementById('moodCount');
        const calendarEl = document.getElementById('monthlyCalendar');
        const moodSquares = document.querySelectorAll('.mood-square'); // new mood squares

        if (!moodSelector || !saveBtn || !moodDescription) return;

        /* -------- New Mood Squares Highlight -------- */
        moodSquares.forEach(square => {
            square.addEventListener('click', () => {
                const mood = square.dataset.mood;
                moodSelector.value = mood;
                moodSquares.forEach(sq => sq.classList.remove('selected'));
                square.classList.add('selected');
            });
        });

        /* -------- Chart Update Function -------- */
        const updateChart = () => {
            const ctx = document.getElementById('weeklyChart')?.getContext('2d');
            if (!ctx) return;

            const last7 = this.userData.moodEntries.slice(-7);
            const labels = last7.map((e, i) => `Day ${i + 1}`);
            const data = last7.map(e => { switch (e.mood) { case 'Happy': return 4; case 'Neutral': return 3; case 'Stressed': return 2; case 'Sad': return 1; default: return 3; } });

            if (this.moodChart) this.moodChart.destroy();

            this.moodChart = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets: [{ label: 'Mood Level (1:Sad → 4:Happy)', data, borderColor: '#4a9c82', backgroundColor: 'rgba(74,156,130,0.2)', borderWidth: 3, fill: true, tension: 0.3 }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 4, ticks: { stepSize: 1 } } } }
            });
        };

        /* -------- Recommendation Function -------- */
        const updateRecommendation = (mood) => {
            let tip = '';
            switch (mood) {
                case 'Happy': tip = "Keep it up! Listen to your favorite music."; break;
                case 'Sad': tip = "Try meditation for 10 min."; break;
                case 'Stressed': tip = "Take a short walk."; break;
                case 'Neutral': tip = "Read a book or do light exercise."; break;
                default: tip = "Track your mood daily for better insights.";
            }
            if (recommendationEl) recommendationEl.textContent = tip;
        };

        const updateMoodCount = () => { if (moodCountEl) moodCountEl.textContent = this.userData.moodEntries.length; };

        /* -------- Monthly Calendar -------- */
        const updateMonthlyCalendar = () => {
            if (!calendarEl) return;
            calendarEl.innerHTML = '';
            const now = new Date(), year = now.getFullYear(), month = now.getMonth();
            const lastDay = new Date(year, month + 1, 0);
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const entryDate = new Date(year, month, day).toLocaleDateString();
                const moodEntry = this.userData.moodEntries.find(e => e.date === entryDate);
                const dayEl = document.createElement('div');
                dayEl.classList.add('calendar-day');
                if (moodEntry) {
                    switch (moodEntry.mood) {
                        case 'Happy': dayEl.style.backgroundColor = '#4caf50'; break;
                        case 'Neutral': dayEl.style.backgroundColor = '#2196f3'; break;
                        case 'Stressed': dayEl.style.backgroundColor = '#ff9800'; break;
                        case 'Sad': dayEl.style.backgroundColor = '#f44336'; break;
                        default: dayEl.style.backgroundColor = '#e0e0e0';
                    }
                } else { dayEl.style.backgroundColor = '#e0e0e0'; }
                dayEl.textContent = day;
                dayEl.title = moodEntry ? `${moodEntry.mood}: ${moodEntry.description}` : 'No mood submitted';
                dayEl.classList.add('calendar-day-style');
                calendarEl.appendChild(dayEl);
            }
        };

        saveBtn.addEventListener('click', () => {
            const mood = moodSelector.value, description = moodDescription.value.trim();
            if (!mood) return this.showNotification('Please select your mood.', 'error');
            const entry = { mood, description, date: new Date().toLocaleDateString(), timestamp: Date.now() };
            this.userData.moodEntries.push(entry);
            this.saveUserData();
            this.showNotification('Mood saved successfully!', 'success');
            moodDescription.value = ''; moodSelector.value = '';
            moodSquares.forEach(sq => sq.classList.remove('selected'));
            updateRecommendation(mood); updateChart(); updateMoodCount(); updateMonthlyCalendar();
        });

        if (this.userData.moodEntries.length) {
            const lastMood = this.userData.moodEntries[this.userData.moodEntries.length - 1].mood;
            updateRecommendation(lastMood); updateChart(); updateMoodCount(); updateMonthlyCalendar();
        }
    }

    /* ---------------- Journal ---------------- */
    setupJournal() {
        const journalEntry = document.getElementById('journalEntry');
        const saveBtn = document.getElementById('saveEntry');
        const clearBtn = document.getElementById('clearEntry');
        if (!journalEntry || !saveBtn) return;
        this.loadJournalEntries();
        saveBtn.addEventListener('click', () => {
            const content = journalEntry.value.trim();
            if (!content) return this.showNotification('Please write something before saving.', 'error');
            const entry = { id: Date.now(), content, date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() };
            this.userData.journalEntries.unshift(entry);
            this.saveUserData();
            journalEntry.value = '';
            this.loadJournalEntries();
            this.showNotification('Journal entry saved!', 'success');
        });
        if (clearBtn) clearBtn.addEventListener('click', () => journalEntry.value = '');
    }

    loadJournalEntries() {
        const entriesList = document.getElementById('entriesList');
        const entriesCount = document.getElementById('entriesCount');
        if (!entriesList || !entriesCount) return;
        entriesList.innerHTML = '';
        if (this.userData.journalEntries.length === 0) { } 
        else {
            this.userData.journalEntries.forEach(entry => {
                const li = document.createElement('li');
                li.className = 'entry-item';
                li.innerHTML = `<div class="entry-date">${entry.date}</div><p class="entry-content">${entry.content}</p>`;
                entriesList.appendChild(li);
            });
        }
        entriesCount.textContent = this.userData.journalEntries.length;
    }

    /* ---------------- Meditation Timer ---------------- */
    setupMeditationTimer() {
        const startButtons = document.querySelectorAll('.start-meditation');
        const timerDisplay = document.getElementById('timerDisplay');
        const timerContainer = document.getElementById('meditationTimer');
        const pauseBtn = document.getElementById('pauseMeditation');
        const resumeBtn = document.getElementById('resumeMeditation');
        const restartBtn = document.getElementById('restartMeditation');
        const stopBtn = document.getElementById('stopMeditation');
        if (!startButtons.length || !timerDisplay || !timerContainer) return;
        let interval = null, remainingTime = 0, originalTime = 0, currentAudio = null;
        const updateTimerDisplay = () => { const min = Math.floor(remainingTime / 60).toString().padStart(2, '0'); const sec = (remainingTime % 60).toString().padStart(2, '0'); timerDisplay.textContent = `${min}:${sec}`; };
        const stopSession = () => {
            clearInterval(interval); interval = null; timerContainer.classList.add('hidden');
            if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
            remainingTime = 0; originalTime = 0; updateTimerDisplay();
            pauseBtn.classList.remove('hidden'); resumeBtn.classList.add('hidden');
        };
        startButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                originalTime = remainingTime = parseInt(btn.getAttribute('data-time'));
                const audioId = btn.getAttribute('data-audio');
                currentAudio = document.getElementById(audioId);
                if (!currentAudio) return;
                document.querySelectorAll('audio').forEach(a => { if (a !== currentAudio) { a.pause(); a.currentTime = 0; } });
                timerContainer.classList.remove('hidden'); currentAudio.play(); updateTimerDisplay();
                clearInterval(interval);
                interval = setInterval(() => {
                    remainingTime--; updateTimerDisplay();
                    if (remainingTime <= 0) { stopSession(); this.showNotification('Meditation completed! 🎉', 'success'); }
                }, 1000);
                pauseBtn.classList.remove('hidden'); resumeBtn.classList.add('hidden');
            });
        });
        pauseBtn.addEventListener('click', () => { if (!interval) return; clearInterval(interval); interval = null; if (currentAudio) currentAudio.pause(); pauseBtn.classList.add('hidden'); resumeBtn.classList.remove('hidden'); });
        resumeBtn.addEventListener('click', () => { if (interval) return; if (currentAudio) currentAudio.play(); pauseBtn.classList.remove('hidden'); resumeBtn.classList.add('hidden'); interval = setInterval(() => { remainingTime--; updateTimerDisplay(); if (remainingTime <= 0) { stopSession(); this.showNotification('Meditation completed! 🎉', 'success'); } }, 1000); });
        restartBtn.addEventListener('click', () => { clearInterval(interval); interval = null; remainingTime = originalTime; updateTimerDisplay(); if (currentAudio) { currentAudio.currentTime = 0; currentAudio.play(); } pauseBtn.classList.remove('hidden'); resumeBtn.classList.add('hidden'); interval = setInterval(() => { remainingTime--; updateTimerDisplay(); if (remainingTime <= 0) { stopSession(); this.showNotification('Meditation completed! 🎉', 'success'); } }, 1000); });
        stopBtn.addEventListener('click', stopSession);
    }

    /* ---------------- Community Forum ---------------- */
    setupCommunity() {
        const postInput = document.getElementById('postInput');
        const postBtn = document.getElementById('postBtn');
        const postsList = document.getElementById('postsList');
        if (!postInput || !postBtn || !postsList) return;
        this.loadCommunityPosts();
        postBtn.addEventListener('click', () => {
            const content = postInput.value.trim();
            if (!content) return this.showNotification('Please write something to post.', 'error');
            const post = { id: Date.now(), content, date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() };
            this.userData.communityPosts.unshift(post);
            this.saveUserData();
            postInput.value = '';
            this.loadCommunityPosts();
            this.showNotification('Post added!', 'success');
        });
    }

    loadCommunityPosts() {
        const postsList = document.getElementById('postsList');
        if (!postsList) return;
        postsList.innerHTML = '';
        if (this.userData.communityPosts.length === 0) { postsList.innerHTML = '<p>No posts yet.</p>'; }
        else {
            this.userData.communityPosts.forEach(post => {
                const li = document.createElement('li');
                li.className = 'post-item';
                li.innerHTML = `<div class="post-date">${post.date}</div><p class="post-content">${post.content}</p>`;
                postsList.appendChild(li);
            });
        }
    }

    /* ---------------- Export Journal ---------------- */
    setupExport() {
        const txtBtn = document.getElementById('exportTxt');
        const csvBtn = document.getElementById('exportCsv');
        if (txtBtn) txtBtn.addEventListener('click', () => this.exportJournal('txt'));
        if (csvBtn) csvBtn.addEventListener('click', () => this.exportJournal('csv'));
    }

    exportJournal(format) {
        if (format === 'txt') this.downloadFile(this.generateTxtExport(), 'journal.txt', 'text/plain');
        else if (format === 'csv') this.downloadFile(this.generateCsvExport(), 'journal.csv', 'text/csv');
    }

    generateTxtExport() { return this.userData.journalEntries.map(e => `${e.date}: ${e.content}`).join('\n'); }

    generateCsvExport() {
        const rows = [['Date', 'Content']];
        this.userData.journalEntries.forEach(e => rows.push([e.date, e.content.replace(/,/g, ';')]));
        return rows.map(r => r.join(',')).join('\n');
    }

    downloadFile(content, filename, type) {
        const a = document.createElement('a');
        const blob = new Blob([content], { type });
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    /* ---------------- Authentication ---------------- */
    setupAuth() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const forgotForm = document.getElementById('forgotForm');
        const passwordToggles = document.querySelectorAll('.password-toggle');

        passwordToggles.forEach(toggle => {
            const input = toggle.previousElementSibling;
            toggle.addEventListener('click', () => { if (input.type === 'password') { input.type = 'text'; toggle.textContent = '🙈'; } else { input.type = 'password'; toggle.textContent = '👁️'; } });
        });

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.email === email && u.password === password);
                if (user) { localStorage.setItem('loggedInUser', email); this.showNotification('Login successful! Redirecting...', 'success'); setTimeout(() => window.location.href = 'dashboard.html', 1000); }
                else this.showNotification('Invalid email or password', 'error');
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                if (password !== confirmPassword) { this.showNotification('Passwords do not match', 'error'); return; }
                let users = JSON.parse(localStorage.getItem('users')) || [];
                if (users.find(u => u.email === email)) { this.showNotification('User already exists', 'error'); return; }
                users.push({ name, email, password });
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem(`mindwell_user_${email}`, JSON.stringify({ moodEntries: [], journalEntries: [], communityPosts: [] }));
                this.showNotification('Signup successful! Redirecting to login...', 'success');
                setTimeout(() => window.location.href = 'login.html', 1000);
            });
        }

        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail').value.trim();
                const users = JSON.parse(localStorage.getItem('users')) || [];
                const user = users.find(u => u.email === email);
                if (user) this.showNotification(`Your password is: ${user.password}`, 'success');
                else this.showNotification('Email not found', 'error');
            });
        }
    }

    /* ---------------- Utility ---------------- */
    showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.className = type === 'success' ? 'success-message' : type === 'error' ? 'error-message' : 'info-message';
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    addNotificationStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
        .success-message{position:fixed;top:20px;right:20px;background:#4caf50;color:white;padding:10px 20px;border-radius:5px;z-index:9999;box-shadow:0 2px 5px rgba(0,0,0,0.3);}
        .error-message{position:fixed;top:20px;right:20px;background:#f44336;color:white;padding:10px 20px;border-radius:5px;z-index:9999;box-shadow:0 2px 5px rgba(0,0,0,0.3);}
        .info-message{position:fixed;top:20px;right:20px;background:#2196f3;color:white;padding:10px 20px;border-radius:5px;z-index:9999;box-shadow:0 2px 5px rgba(0,0,0,0.3);}
        .mood-square.selected{border:3px solid #4caf50;}
        `;
        document.head.appendChild(style);
    }

    /* ---------------- Event Dispatcher ---------------- */
    setupEventListeners() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        if (page === 'dashboard.html') { this.setupMoodTracking(); }
        if (page === 'journal.html') { this.setupJournal(); }
        if (page === 'meditation.html') { this.setupMeditationTimer(); }
        if (page === 'community.html') { this.setupCommunity(); }
        if (page === 'export.html') { this.setupExport(); }
        if (page === 'login.html' || page === 'signup.html') { this.setupAuth(); }
    }
}

/* ---------------- Initialize App ---------------- */
window.mindWellApp = new MindWellApp();

/* ---------------- Sample Data for Demo ---------------- */
if (!localStorage.getItem('mindwell_user_demo')) {
    const sampleData = {
        moodEntries: [
            { mood: 'Neutral', date: new Date().toLocaleDateString(), timestamp: Date.now() - 86400000 },
            { mood: 'Happy', date: new Date().toLocaleDateString(), timestamp: Date.now() - 172800000 }
        ],
        journalEntries: [
            { id: 1, content: "Today was a productive day.", date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() },
            { id: 2, content: "Feeling a little stressed today. Meditation helped.", date: new Date().toLocaleDateString(), timestamp: new Date().toISOString() }
        ],
        communityPosts: []
    };
    localStorage.setItem('mindwell_user_demo', JSON.stringify(sampleData));
}
