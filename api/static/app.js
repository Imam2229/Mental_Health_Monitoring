/* app.js — MindWell
   Updated: meditation sliders + timers + audio + existing features
*/

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ MindWell App Loaded Successfully');

  /* ======================
     Global Page Transitions
     ====================== */
  window.addEventListener('beforeunload', (e) => {
    const activeEl = document.activeElement;
    // Prevent fade-out on form submissions like Forgot Password
    if (activeEl && activeEl.tagName === 'BUTTON' && activeEl.type === 'submit') return;
    document.body.classList.add('fade-out');
  });

  /* ======================
     Flash Message Helper
     ====================== */
  const showFlash = (message, category = 'success') => {
    const flash = document.querySelector('.flash-messages');
    if (!flash) return;
    flash.innerHTML = `<li class="${category}">${message}</li>`;
    flash.style.display = 'block';
    setTimeout(() => (flash.style.display = 'none'), 4000);
  };

  /* ======================
     Auth Handling (Signup / Login / Forgot)
     ====================== */
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  // support both id="forgotForm" and class fallback
  const forgotForm = document.getElementById('forgotForm') || document.querySelector('.auth-form');

  // --- Signup ---
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = signupForm.querySelector('#name').value.trim();
      const email = signupForm.querySelector('#email').value.trim();
      const password = signupForm.querySelector('#password').value;
      const confirm = signupForm.querySelector('#confirmPassword')?.value;

      if (!name || !email || !password || (confirm !== undefined && !confirm))
        return showFlash('All fields are required.', 'error');
      if (confirm !== undefined && password !== confirm)
        return showFlash('Passwords do not match.', 'error');

      try {
        const res = await fetch('/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (data.success) {
          showFlash('✅ Account created! Redirecting...', 'success');
          setTimeout(() => (window.location.href = '/login'), 1500);
        } else showFlash(data.message || 'Signup failed.', 'error');
      } catch {
        showFlash('❌ Server error. Please try again later.', 'error');
      }
    });
  }

  // --- Login ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('#email').value.trim();
      const password = loginForm.querySelector('#password').value;

      if (!email || !password)
        return showFlash('Please fill in all fields.', 'error');

      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success) {
          showFlash('✅ Logged in! Redirecting...', 'success');
          setTimeout(() => (window.location.href = '/'), 1000);
        } else showFlash(data.message || 'Invalid credentials.', 'error');
      } catch {
        showFlash('Server error. Try again later.', 'error');
      }
    });
  }

  // --- Forgot Password ---
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      const emailEl = forgotForm.querySelector('#email') || forgotForm.querySelector('input[type="email"]');
      const email = emailEl ? emailEl.value.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.preventDefault();
        showFlash('Enter a valid email address.', 'error');
      }
    });
  }

  /* ======================
     Dashboard Logic (existing)
     ====================== */
  const moodForm = document.getElementById('moodForm');
  const moodSelect = document.getElementById('moodSelector');
  const moodDescription = document.getElementById('moodDescription');
  const recommendation = document.getElementById('recommendation');
  const heatmap = document.getElementById('moodHeatmap');
  const moodDataEl = document.getElementById('moodData');

  if (moodForm && moodDataEl) {
    const moodData = JSON.parse(moodDataEl.textContent || '[]');

    /* === Submit Mood === */
    moodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const mood = moodSelect.value;
      const desc = moodDescription.value.trim();
      if (!mood) return alert('Please select your mood.');

      try {
        const res = await fetch('/api/mood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mood, description: desc }),
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ Mood logged successfully!');
          location.reload();
        } else alert('❌ ' + data.message);
      } catch (err) {
        console.error('Error submitting mood:', err);
      }
    });

    /* === Mood Recommendations === */
    const tips = {
      Happy: "Keep spreading your positivity 🌞",
      Sad: "Take a deep breath — this too shall pass 💙",
      Stressed: "Try a 5-minute meditation 🧘‍♀️",
      Neutral: "Stay mindful and grounded 🌿",
      Excited: "Channel your energy into creativity 🎨",
      Anxious: "Practice slow breathing 🌬️",
      Calm: "Enjoy your peace — maybe journal 🕊️",
    };
    if (moodSelect) {
      moodSelect.addEventListener('change', () => {
        const tip = tips[moodSelect.value] || "Select a mood to receive a self-care tip 🌿";
        if (recommendation) recommendation.innerHTML = `<p>${tip}</p>`;
      });
    }

    /* === Weekly Mood Chart === */
    const ctx = document.getElementById('weeklyChart')?.getContext('2d');
    if (ctx && typeof Chart !== 'undefined' && moodData.length > 0) {
      const moodScores = { Happy: 5, Excited: 4, Calm: 4, Neutral: 3, Stressed: 2, Sad: 1, Anxious: 2 };
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(0, 123, 131, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 123, 131, 0.05)');

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: moodData
            .map((m) => new Date(m.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }))
            .reverse(),
          datasets: [{
            label: 'Mood Level',
            data: moodData.map((m) => moodScores[m.mood] || 0).reverse(),
            borderColor: '#007b83',
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: '#007b83',
            fill: true,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              min: 0,
              max: 5,
              ticks: { stepSize: 1 },
              grid: { color: 'rgba(0,0,0,0.05)' },
            },
            x: { grid: { display: false } },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#004d4f',
              titleColor: '#fff',
              bodyColor: '#fff',
              padding: 10,
              borderRadius: 8,
            },
          },
        },
      });
    }

    /* === Mental Health Pie Chart === */
    const mentalCtx = document.getElementById('mentalStatsChart')?.getContext('2d');
    if (mentalCtx && typeof Chart !== 'undefined') {
      new Chart(mentalCtx, {
        type: 'pie',
        data: {
          labels: [
            'Schizophrenia (1.1%)',
            'Major Depressive Disorder (6.7%)',
            'Anxiety Disorders (18.7%)',
            'Co-occurring Mental & Addiction Disorders (31%)',
          ],
          datasets: [{
            data: [1.1, 6.7, 18.7, 31],
            backgroundColor: ['#004d4f', '#007b83', '#4fc99d', '#8ee1c3'],
            borderColor: '#fff',
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#333',
                font: { size: 14, family: 'Inter' },
              },
            },
          },
        },
      });
    }

    /* === Mood Heatmap === */
    if (heatmap) {
      heatmap.innerHTML = '';
      const last30 = moodData.slice(0, 30);
      last30.forEach((entry) => {
        const val = { Happy: 4, Excited: 3, Calm: 3, Neutral: 2, Stressed: 1, Sad: 1, Anxious: 1 }[entry.mood] || 0;
        const div = document.createElement('div');
        div.className = 'heat-day';
        div.setAttribute('data-level', val);
        heatmap.appendChild(div);
      });
    }

    /* === Daily Stats === */
    const today = new Date().toDateString();
    const todayCount = moodData.filter((m) => new Date(m.timestamp).toDateString() === today).length;
    const todayEl = document.getElementById('todayMoods');
    const totalEl = document.getElementById('totalMoods');
    if (todayEl) todayEl.textContent = todayCount;
    if (totalEl) totalEl.textContent = moodData.length;

    let streak = 0;
    for (let i = 0; i < moodData.length - 1; i++) {
      const d1 = new Date(moodData[i].timestamp);
      const d2 = new Date(moodData[i + 1].timestamp);
      const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
      if (diff <= 1.5) streak++;
      else break;
    }
    const streakEl = document.getElementById('dailyStreak');
    if (streakEl) streakEl.textContent = streak + 1;
    const streakBar = document.getElementById('streakProgressBar');
    if (streakBar) streakBar.style.width = Math.min((streak + 1) * 10, 100) + '%';
  }

  /* ======================
     Scroll-Based Animations
     ====================== */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  });

  document.querySelectorAll('.fade-in, .fade-up, .fade-down').forEach((el) => observer.observe(el));


  /* ==================================================================
     Meditation Page — Sliders, Timers, Audio
     - Expects markup IDs/classes similar to your meditations HTML.
     ================================================================== */

  /* -------------------
     Slider helper
     ------------------- */
  function initSlider(type) {
    const track = document.getElementById(`${type}Slider`);
    if (!track) return;

    const prevBtn = document.querySelector(`.slider-btn.prev[data-type="${type}"]`);
    const nextBtn = document.querySelector(`.slider-btn.next[data-type="${type}"]`);
    const slides = Array.from(track.querySelectorAll('img'));
    if (!slides.length) return;

    let index = 0;
    let slideWidth = track.clientWidth; // we'll use container width for responsiveness

    const updateTransform = () => {
      // calculate width of visible slide (container width)
      slideWidth = track.clientWidth;
      // set each slide's width to container for consistent sliding
      slides.forEach((img) => img.style.width = `${slideWidth}px`);
      track.style.transform = `translateX(-${index * slideWidth}px)`;
    };

    // Prev / Next handlers
    const prev = () => {
      index = (index - 1 + slides.length) % slides.length;
      updateTransform();
    };
    const next = () => {
      index = (index + 1) % slides.length;
      updateTransform();
    };

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // touch support (basic)
    let startX = 0;
    let isDown = false;
    track.addEventListener('pointerdown', (e) => {
      isDown = true;
      startX = e.clientX;
      track.style.transition = 'none';
    });
    track.addEventListener('pointerup', (e) => {
      if (!isDown) return;
      isDown = false;
      track.style.transition = '';
      const delta = e.clientX - startX;
      if (Math.abs(delta) > 40) {
        if (delta < 0) next();
        else prev();
      } else updateTransform();
    });
    track.addEventListener('pointercancel', () => { isDown = false; track.style.transition = ''; });

    // recompute on resize
    window.addEventListener('resize', () => {
      // small delay to allow layout settle
      setTimeout(updateTransform, 120);
    });

    // initial layout
    updateTransform();
  }

  // initialize all three sliders if present
  ['morning', 'evening', 'focus'].forEach(initSlider);


  /* -------------------
     Timers
     ------------------- */
  // helper to parse "MM:SS" to seconds
  function parseTimeToSeconds(str) {
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(str) || 0;
  }
  // format seconds to MM:SS
  function formatSeconds(s) {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  const timers = {}; // { type: { duration, remaining, intervalId, displayEl, audioEl } }

  // initialize timer elements found on page
  ['morning', 'evening', 'focus'].forEach((type) => {
    const display = document.getElementById(`${type}Timer`);
    const audioEl = document.getElementById(`${type}Audio`);
    if (!display) return;
    const initial = display.textContent.trim() || '05:00';
    const duration = parseTimeToSeconds(initial);
    timers[type] = {
      duration,
      remaining: duration,
      intervalId: null,
      displayEl: display,
      audioEl: audioEl || null,
    };
    display.textContent = formatSeconds(duration);
  });

  // central control handler for buttons with data-action
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const type = btn.getAttribute('data-type');
    if (!type || !timers[type]) return;

    const t = timers[type];

    if (action === 'start') {
      // if already running, ignore
      if (t.intervalId) return;
      // if remaining is zero, reset to duration
      if (t.remaining <= 0) t.remaining = t.duration;
      t.intervalId = setInterval(() => {
        t.remaining--;
        t.displayEl.textContent = formatSeconds(t.remaining);
        // play audio while running (if present)
        if (t.audioEl && t.audioEl.paused) {
          try { t.audioEl.play(); } catch (_) {}
        }
        if (t.remaining <= 0) {
          clearInterval(t.intervalId);
          t.intervalId = null;
          // stop audio when finished
          if (t.audioEl && !t.audioEl.paused) {
            t.audioEl.pause();
            t.audioEl.currentTime = 0;
          }
        }
      }, 1000);
    } else if (action === 'pause') {
      if (t.intervalId) {
        clearInterval(t.intervalId);
        t.intervalId = null;
      }
      // pause audio as well
      if (t.audioEl && !t.audioEl.paused) {
        try { t.audioEl.pause(); } catch (_) {}
      }
    } else if (action === 'reset') {
      if (t.intervalId) {
        clearInterval(t.intervalId);
        t.intervalId = null;
      }
      t.remaining = t.duration;
      t.displayEl.textContent = formatSeconds(t.remaining);
      if (t.audioEl) {
        try { t.audioEl.pause(); t.audioEl.currentTime = 0; } catch (_) {}
      }
    }
  });

  /* -------------------
     Audio play/pause toggles for meditation
     Elements: .play-audio[data-type="morning|evening|focus"]
     ------------------- */
  document.addEventListener('click', (e) => {
    const pbtn = e.target.closest('.play-audio');
    if (!pbtn) return;
    const type = pbtn.getAttribute('data-type');
    if (!type) return;
    const audio = document.getElementById(`${type}Audio`);
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((err) => console.warn('Audio play blocked:', err));
      pbtn.classList.add('playing');
      pbtn.textContent = '⏸️ Pause Music';
    } else {
      audio.pause();
      pbtn.classList.remove('playing');
      pbtn.textContent = '🎵 Play Music';
    }
  });

  // Stop any meditation audio when user navigates away
  window.addEventListener('pagehide', () => {
    ['morningAudio', 'eveningAudio', 'focusAudio'].forEach((id) => {
      const a = document.getElementById(id);
      if (a && !a.paused) {
        try { a.pause(); a.currentTime = 0; } catch (_) {}
      }
    });
  });
});
