class MindWellApp {
    constructor() {
        this.moodChart = null;
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    /* ---------------- Initialization ---------------- */
    init() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        if(page==='dashboard.html'){ this.setupMoodTracking(); }
        if(page==='login.html'){ this.setupLogin(); }
        if(page==='signup.html'){ this.setupSignup(); }
    }

    /* ---------------- Mood Tracking ---------------- */
    setupMoodTracking() {
        const moodSelector = document.getElementById('moodSelector');
        const moodDescription = document.getElementById('moodDescription');
        const saveBtn = document.getElementById('saveMoodBtn');
        const recommendationEl = document.getElementById('recommendation');
        const ctx = document.getElementById('weeklyChart')?.getContext('2d');

        if(!moodSelector || !saveBtn) return;

        const updateChart = async () => {
            const res = await fetch('/api/mood');
            const data = await res.json();
            const last7 = data.slice(-7);
            const labels = last7.map((e,i)=>`Day ${i+1}`);
            const values = last7.map(e=>{
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
                type:'line',
                data:{
                    labels,
                    datasets:[{
                        label:'Mood Level (1:Sad → 4:Happy)',
                        data: values,
                        borderColor:'#4a9c82',
                        backgroundColor:'rgba(74,156,130,0.2)',
                        fill:true,
                        tension:0.3
                    }]
                },
                options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{min:1,max:4,ticks:{stepSize:1}}}}
            });
        };

        const showRecommendation = (mood) => {
            let tip='';
            switch(mood){
                case 'Happy': tip="Keep it up! Listen to your favorite music."; break;
                case 'Sad': tip="Try meditation for 10 min."; break;
                case 'Stressed': tip="Take a short walk."; break;
                case 'Neutral': tip="Read a book or do light exercise."; break;
                default: tip="Track your mood daily for better insights.";
            }
            if(recommendationEl) recommendationEl.textContent = tip;
        };

        saveBtn.addEventListener('click', async () => {
            const mood = moodSelector.value;
            const description = moodDescription.value.trim();
            if(!mood) return alert('Please select a mood');
            const res = await fetch('/api/mood', {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({mood, description})
            });
            const data = await res.json();
            if(data.success){
                moodSelector.value = '';
                moodDescription.value = '';
                showRecommendation(mood);
                updateChart();
                alert('Mood saved successfully!');
            }
        });

        updateChart(); // initial load
    }

    /* ---------------- Login ---------------- */
    setupLogin() {
        const loginForm = document.getElementById('loginForm');
        if(!loginForm) return;
        loginForm.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const res = await fetch('/api/login',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({email,password})
            });
            const data = await res.json();
            if(data.success) window.location.href = '/dashboard.html';
            else alert(data.message);
        });
    }

    /* ---------------- Signup ---------------- */
    setupSignup() {
        const signupForm = document.getElementById('signupForm');
        if(!signupForm) return;
        signupForm.addEventListener('submit', async (e)=>{
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            if(password !== confirmPassword) return alert('Passwords do not match');
            const res = await fetch('/api/signup',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body: JSON.stringify({name,email,password})
            });
            const data = await res.json();
            if(data.success) window.location.href = '/login.html';
            else alert(data.message);
        });
    }
}

/* ---------------- Initialize App ---------------- */
window.mindWellApp = new MindWellApp();
