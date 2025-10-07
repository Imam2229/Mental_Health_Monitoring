// app.js - MindWell Application JavaScript (Fully Updated with Phase 1 Dashboard & Monthly Calendar)

class MindWellApp {
    constructor() {
        this.userData = { moodEntries: [], journalEntries: [], communityPosts: [] };
        this.timerInterval = null;
        this.remainingTime = 0;
        this.moodChart = null;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.addNotificationStyles();
    }

    /* ---------------- User Data Management ---------------- */
    loadUserData() {
        this.userData = JSON.parse(localStorage.getItem('mindwell_user')) || {
            moodEntries: [], journalEntries: [], communityPosts: []
        };
    }

    saveUserData() {
        localStorage.setItem('mindwell_user', JSON.stringify(this.userData));
    }

    /* ---------------- Dashboard / Mood Tracking ---------------- */
    setupMoodTracking() {
        const moodSelector = document.getElementById('moodSelector');
        const saveBtn = document.getElementById('saveMoodBtn');
        const moodDescription = document.getElementById('moodDescription');
        const recommendationEl = document.getElementById('recommendation');
        const moodCountEl = document.getElementById('moodCount');
        const calendarEl = document.getElementById('monthlyCalendar');

        if (!moodSelector || !saveBtn || !moodDescription) return;

        const updateChart = () => {
            const ctx = document.getElementById('weeklyChart')?.getContext('2d');
            if (!ctx) return;

            const last7 = this.userData.moodEntries.slice(-7);
            const labels = last7.map((e,i) => `Day ${i+1}`);
            const data = last7.map(e => {
                switch(e.mood){
                    case 'Happy': return 4;
                    case 'Neutral': return 3;
                    case 'Stressed': return 2;
                    case 'Sad': return 1;
                    default: return 3;
                }
            });

            if(this.moodChart) this.moodChart.destroy();

            this.moodChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Mood Level (1:Sad, 2:Stressed, 3:Neutral, 4:Happy)',
                        data: data,
                        borderColor: '#4a9c82',
                        backgroundColor: 'rgba(74,156,130,0.2)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive:true,
                    maintainAspectRatio:false,
                    scales: {
                        y: { min:1, max:4, ticks:{stepSize:1} },
                    }
                }
            });
        };

        const updateRecommendation = (mood) => {
            let tip = '';
            switch(mood){
                case 'Happy': tip = "Keep it up! Listen to your favorite music."; break;
                case 'Sad': tip = "Try meditation for 10 min."; break;
                case 'Stressed': tip = "Take a short walk."; break;
                case 'Neutral': tip = "Read a book or do light exercise."; break;
                default: tip = "Track your mood daily for better insights.";
            }
            if(recommendationEl) recommendationEl.textContent = tip;
        };

        const updateMoodCount = () => {
            if(moodCountEl) moodCountEl.textContent = this.userData.moodEntries.length;
        };

        const updateMonthlyCalendar = () => {
            if(!calendarEl) return;
            calendarEl.innerHTML = '';

            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Create a square for each day
            for(let day=1; day<=lastDay.getDate(); day++){
                const entryDate = new Date(year, month, day).toLocaleDateString();
                const moodEntry = this.userData.moodEntries.find(e => e.date === entryDate);

                const dayEl = document.createElement('div');
                dayEl.classList.add('calendar-day');

                // Color based on mood
                if(moodEntry){
                    switch(moodEntry.mood){
                        case 'Happy': dayEl.style.backgroundColor = '#4caf50'; break; // green
                        case 'Neutral': dayEl.style.backgroundColor = '#2196f3'; break; // blue
                        case 'Stressed': dayEl.style.backgroundColor = '#ff9800'; break; // orange
                        case 'Sad': dayEl.style.backgroundColor = '#f44336'; break; // red
                        default: dayEl.style.backgroundColor = '#e0e0e0';
                    }
                } else {
                    dayEl.style.backgroundColor = '#e0e0e0';
                }

                dayEl.textContent = day;
                dayEl.title = moodEntry ? `${moodEntry.mood}: ${moodEntry.description}` : 'No mood submitted';
                dayEl.style.width = '30px';
                dayEl.style.height = '30px';
                dayEl.style.display = 'inline-flex';
                dayEl.style.alignItems = 'center';
                dayEl.style.justifyContent = 'center';
                dayEl.style.margin = '2px';
                dayEl.style.borderRadius = '4px';
                dayEl.style.fontSize = '0.8rem';
                dayEl.style.color = '#fff';

                calendarEl.appendChild(dayEl);
            }
        };

        saveBtn.addEventListener('click', () => {
            const mood = moodSelector.value;
            const description = moodDescription.value.trim();

            if (!mood) return this.showNotification('Please select your mood.', 'error');

            const entry = {
                mood,
                description,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now()
            };

            this.userData.moodEntries.push(entry);
            this.saveUserData();

            this.showNotification('Mood saved successfully!', 'success');
            moodDescription.value = '';
            moodSelector.value = '';

            updateRecommendation(mood);
            updateChart();
            updateMoodCount();
            updateMonthlyCalendar();
        });

        // Initial load
        if(this.userData.moodEntries.length){
            const lastMood = this.userData.moodEntries[this.userData.moodEntries.length-1].mood;
            updateRecommendation(lastMood);
            updateChart();
            updateMoodCount();
            updateMonthlyCalendar();
        }
    }

    /* ---------------- Journal Functionality ---------------- */
    setupJournal() { /* unchanged */ }
    saveJournalEntry() { /* unchanged */ }
    loadJournalEntries() { /* unchanged */ }

    /* ---------------- Meditation Timer ---------------- */
    setupMeditationTimer() { /* unchanged */ }
    startMeditation(duration) { /* unchanged */ }
    stopMeditation(completed=false) { /* unchanged */ }
    playMeditationAudio() { /* unchanged */ }
    stopMeditationAudio() { /* unchanged */ }
    playCompletionSound() { /* unchanged */ }

    /* ---------------- Community Forum ---------------- */
    setupCommunity() { /* unchanged */ }
    postCommunityMessage() { /* unchanged */ }
    loadCommunityPosts() { /* unchanged */ }

    /* ---------------- Export Journal ---------------- */
    setupExport() { /* unchanged */ }
    exportJournal(format) { /* unchanged */ }
    generateTxtExport() { /* unchanged */ }
    generateCsvExport() { /* unchanged */ }
    downloadFile(content, filename, type) { /* unchanged */ }

    /* ---------------- Authentication ---------------- */
    setupAuth() { /* unchanged */ }
    handleLogin(e) { /* unchanged */ }
    handleSignup(e) { /* unchanged */ }
    setupPasswordToggles() { /* unchanged */ }

    /* ---------------- Utility Functions ---------------- */
    showNotification(message,type='info'){
        const notif = document.createElement('div');
        notif.className = type==='success'?'success-message':type==='error'?'error-message':'';
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(()=> notif.remove(),3000);
    }

    addNotificationStyles(){ /* unchanged */ }

    /* ---------------- Event Dispatcher ---------------- */
    setupEventListeners(){
        const page = window.location.pathname.split('/').pop() || 'index.html';
        if(page==='dashboard.html'){ this.setupMoodTracking(); }
        if(page==='journal.html') this.setupJournal();
        if(page==='meditation.html') this.setupMeditationTimer();
        if(page==='community.html') this.setupCommunity();
        if(page==='export.html') this.setupExport();
        if(page==='login.html'||page==='signup.html') this.setupAuth();
    }
}

/* ---------------- Initialize App ---------------- */
window.mindWellApp = new MindWellApp();

/* ---------------- Sample Data ---------------- */
if(!localStorage.getItem('mindwell_user')){
    const sampleData = {
        moodEntries:[
            {mood:'Neutral',date:new Date().toLocaleDateString(),timestamp:Date.now()-86400000},
            {mood:'Happy',date:new Date().toLocaleDateString(),timestamp:Date.now()-172800000}
        ],
        journalEntries:[
            {id:1,content:"Today was a productive day. I managed to complete all tasks and took a walk.",date:new Date().toLocaleDateString(),timestamp:new Date().toISOString()},
            {id:2,content:"Struggled with anxiety today, but breathing exercises helped.",date:new Date(Date.now()-86400000).toLocaleDateString(),timestamp:new Date(Date.now()-86400000).toISOString()}
        ],
        communityPosts:[
            {id:1,content:"Welcome to MindWell Community! Share your thoughts here 💬",author:"Admin",date:new Date().toLocaleString(),timestamp:new Date().toISOString()}
        ]
    };
    localStorage.setItem('mindwell_user',JSON.stringify(sampleData));
}
