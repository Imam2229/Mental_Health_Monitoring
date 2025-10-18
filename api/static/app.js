class MindWellApp {
    constructor() {
        this.moodChart = null;
        this.timerInterval = null;
        this.remainingTime = 0;
        this.journalEntries = [];
        this.communityPosts = [];
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    /* ---------------- Initialization ---------------- */
    init() {
        const path = window.location.pathname;
        if (path.includes('/dashboard')) this.setupMoodTracking();
        if (path.includes('/login')) { this.setupLogin(); this.setupPasswordToggle(); }
        if (path.includes('/signup')) { this.setupSignup(); this.setupPasswordToggle(); }
        if (path.includes('/journal')) this.setupJournal();
        if (path.includes('/community')) this.setupCommunity();
        if (path.includes('/meditation')) this.setupMeditation();
        if (path.includes('/export')) this.setupExport();
    }

    /* ---------------- Signup ---------------- */
    setupSignup() {
        const form = document.getElementById('signupForm');
        if (!form) return;

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;

            if (!agreeTerms) return alert('Please agree to the Terms & Privacy Policy.');
            if (password !== confirmPassword) return alert('Passwords do not match.');

            try {
                const res = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (data.success) {
                    alert('✅ Account created successfully! Redirecting to login...');
                    window.location.href = '/login';
                } else {
                    alert(`⚠️ ${data.message || 'Signup failed.'}`);
                }
            } catch (err) {
                console.error('Signup Error:', err);
                alert('❌ Server error. Please try again later.');
            }
        });
    }

    /* ---------------- Login ---------------- */
    setupLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                    alert('✅ Login successful! Redirecting to dashboard...');
                    window.location.href = '/dashboard';
                } else {
                    alert(`⚠️ ${data.message || 'Invalid email or password.'}`);
                }
            } catch (err) {
                console.error('Login Error:', err);
                alert('❌ Server error during login.');
            }
        });
    }

    /* ---------------- Password Toggle ---------------- */
    setupPasswordToggle() {
        const toggles = document.querySelectorAll('.password-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.previousElementSibling;
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    }

    /* ---------------- Mood Tracking (Dashboard) ---------------- */
    setupMoodTracking() {
        const selector = document.getElementById('moodSelector');
        const desc = document.getElementById('moodDescription');
        const saveBtn = document.getElementById('saveMoodBtn');
        const recommendationEl = document.getElementById('recommendation');
        const ctx = document.getElementById('weeklyChart')?.getContext('2d');
        if (!selector || !saveBtn) return;

        const updateChart = async () => {
            try {
                const res = await fetch('/api/mood');
                const data = await res.json();
                const last7 = data.slice(-7);
                const labels = last7.map((_, i) => `Day ${i + 1}`);
                const values = last7.map(e => ({
                    Happy: 4, Neutral: 3, Stressed: 2, Sad: 1
                }[e.mood] || 3));

                if (this.moodChart) this.moodChart.destroy();
                this.moodChart = new Chart(ctx, {
                    type: 'line',
                    data: { labels, datasets: [{ label: 'Mood Level (1:Sad → 4:Happy)', data: values, borderColor: '#4a9c82', backgroundColor: 'rgba(74,156,130,0.2)', fill: true, tension: 0.3 }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 4, ticks: { stepSize: 1 } } } }
                });
            } catch (err) { console.error('Error updating chart:', err); }
        };

        const showRecommendation = mood => {
            const tips = {
                Happy: "Keep it up! Listen to your favorite music.",
                Sad: "Try meditation for 10 min.",
                Stressed: "Take a short walk or talk to a friend.",
                Neutral: "Read a book or do light exercise."
            };
            recommendationEl.textContent = tips[mood] || "Track your mood daily for better insights.";
        };

        saveBtn.addEventListener('click', async () => {
            const mood = selector.value;
            const description = desc.value.trim();
            if (!mood) return alert('Please select a mood.');

            try {
                const res = await fetch('/api/mood', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mood, description })
                });
                const data = await res.json();
                if (data.success) {
                    selector.value = '';
                    desc.value = '';
                    showRecommendation(mood);
                    updateChart();
                    alert('✅ Mood saved successfully!');
                } else {
                    alert(`⚠️ ${data.message || 'Failed to save mood.'}`);
                }
            } catch (err) {
                console.error('Mood Save Error:', err);
                alert('❌ Server error while saving mood.');
            }
        });

        updateChart();
    }

    /* ---------------- Journal ---------------- */
    setupJournal() {
        const textarea = document.getElementById('journalEntry');
        const saveBtn = document.getElementById('saveEntry');
        const list = document.getElementById('entriesList');
        const emptyState = document.getElementById('emptyState');

        const render = async () => {
            try {
                const res = await fetch('/api/journal');
                const data = await res.json();
                list.innerHTML = '';
                if (!data.length) emptyState.style.display = 'block';
                else {
                    emptyState.style.display = 'none';
                    data.slice().reverse().forEach(entry => {
                        const li = document.createElement('li');
                        li.textContent = entry.entry;
                        list.appendChild(li);
                    });
                }
            } catch (err) { console.error('Journal Fetch Error:', err); }
        };

        saveBtn.addEventListener('click', async () => {
            const text = textarea.value.trim();
            if (!text) return alert('Please write something!');
            try {
                const res = await fetch('/api/journal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entry: text })
                });
                const data = await res.json();
                if (data.success) {
                    textarea.value = '';
                    render();
                }
            } catch (err) { console.error('Journal Save Error:', err); }
        });

        render();
    }

    /* ---------------- Community ---------------- */
    setupCommunity() {
        const postInput = document.getElementById('postInput');
        const postBtn = document.getElementById('postBtn');
        const postsList = document.getElementById('postsList');
        const emptyCommunity = document.getElementById('emptyCommunity');

        const renderPosts = async () => {
            try {
                const res = await fetch('/api/community');
                const data = await res.json();
                postsList.innerHTML = '';
                if (!data.length) emptyCommunity.style.display = 'block';
                else {
                    emptyCommunity.style.display = 'none';
                    data.slice().reverse().forEach(post => {
                        const li = document.createElement('li');
                        li.textContent = post.message;
                        postsList.appendChild(li);
                    });
                }
            } catch (err) { console.error('Community Fetch Error:', err); }
        };

        postBtn.addEventListener('click', async () => {
            const val = postInput.value.trim();
            if (!val) return alert('Please enter a message!');
            try {
                const res = await fetch('/api/community', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: val })
                });
                const data = await res.json();
                if (data.success) {
                    postInput.value = '';
                    renderPosts();
                }
            } catch (err) { console.error('Community Save Error:', err); }
        });

        renderPosts();
    }

    /* ---------------- Meditation ---------------- */
    setupMeditation() {
        // Timer or meditation features if needed
    }

    /* ---------------- Export ---------------- */
    setupExport() {
        const exportTxt = document.getElementById('exportTxt');
        const exportCsv = document.getElementById('exportCsv');
        const exportPdf = document.getElementById('exportPdf');

        const downloadFile = (filename, content) => {
            const blob = new Blob([content], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        };

        const fetchExportData = async () => {
            const res = await fetch('/api/export');
            return await res.json();
        };

        exportTxt.addEventListener('click', async () => {
            const data = await fetchExportData();
            downloadFile('mindwell_data.txt', JSON.stringify(data, null, 2));
        });

        exportCsv.addEventListener('click', async () => {
            const data = await fetchExportData();
            let csv = 'Type,Content,Timestamp\n';
            data.moods.forEach(m => csv += `Mood,${m.mood} - ${m.description},${m.timestamp}\n`);
            data.journals.forEach(j => csv += `Journal,${j.entry},${j.timestamp}\n`);
            downloadFile('mindwell_data.csv', csv);
        });

        exportPdf.addEventListener('click', async () => {
            alert('PDF export coming soon!');
        });
    }
}

/* ---------------- Initialize ---------------- */
window.mindWellApp = new MindWellApp();
