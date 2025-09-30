// 🌱 Enhanced Mental Health Tracker Application

class MindWellApp {
    constructor() {
        this.currentUser = null;
        this.moodEntries = JSON.parse(localStorage.getItem('moodEntries')) || [];
        this.userSettings = JSON.parse(localStorage.getItem('userSettings')) || {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.updateUI();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Mood tracking
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleMoodSelection(e));
        });

        // Form submissions
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const logMoodBtn = document.getElementById('log-mood-btn');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        if (logMoodBtn) {
            logMoodBtn.addEventListener('click', () => this.logMood());
        }

        // Password toggles
        this.setupPasswordToggles();

        // Navigation active states
        this.setupNavigation();

        // Dashboard interactions
        this.setupDashboard();
    }

    setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const input = button.parentElement.querySelector('input');
                const icon = button.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // Password strength indicator
        const passwordInput = document.getElementById('signup-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }
    }

    updatePasswordStrength(password) {
        const strengthFill = document.getElementById('password-strength-fill');
        const strengthText = document.getElementById('password-strength-text');
        
        if (!strengthFill || !strengthText) return;

        let strength = 0;
        let feedback = '';

        // Check password criteria
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        // Update visual feedback
        strengthFill.style.width = `${strength}%`;

        // Update text and color
        if (strength === 0) {
            strengthText.textContent = 'Weak';
            strengthFill.style.background = '#f56565';
        } else if (strength <= 50) {
            strengthText.textContent = 'Fair';
            strengthFill.style.background = '#ed8936';
        } else if (strength <= 75) {
            strengthText.textContent = 'Good';
            strengthFill.style.background = '#ecc94b';
        } else {
            strengthText.textContent = 'Strong';
            strengthFill.style.background = '#48bb78';
        }
    }

    handleMoodSelection(e) {
        const moodOption = e.currentTarget;
        const mood = moodOption.dataset.mood;
        const label = moodOption.dataset.label;
        
        // Remove selected class from all options
        document.querySelectorAll('.mood-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        moodOption.classList.add('selected');
        
        // Store selected mood temporarily
        this.selectedMood = { mood, label };
        
        // Show confirmation for mood selection
        if (window.location.pathname.includes('index.html')) {
            this.showNotification(`You selected: ${label}`, 'success');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('#login-email').value;
        const password = form.querySelector('#login-password').value;
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        submitBtn.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For demo purposes, any login works
        this.currentUser = {
            email: email,
            name: email.split('@')[0],
            loginTime: new Date().toISOString()
        };

        // Store user data
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // Show success message
        this.showNotification('Successfully logged in!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const name = form.querySelector('#signup-name').value;
        const email = form.querySelector('#signup-email').value;
        const password = form.querySelector('#signup-password').value;
        const confirmPassword = form.querySelector('#confirm-password').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create user account
        this.currentUser = {
            name: name,
            email: email,
            signupTime: new Date().toISOString(),
            streak: 0
        };

        // Store user data
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Initialize user storage
        this.initializeUserStorage();

        // Show success message
        this.showNotification('Account created successfully!', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    initializeUserStorage() {
        const userData = {
            moodEntries: [],
            journalEntries: [],
            goals: [],
            settings: {
                theme: 'light',
                notifications: true,
                trackingReminders: true
            },
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('userData', JSON.stringify(userData));
    }

    loadUserData() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    updateUI() {
        // Update dashboard with user data
        if (window.location.pathname.includes('dashboard.html') && this.currentUser) {
            this.updateDashboard();
        }

        // Update date display
        this.updateDateDisplay();

        // Update mood statistics
        this.updateMoodStats();
    }

    updateDashboard() {
        // Welcome message
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name || 'User';
        }

        // Load mood entries
        this.loadMoodEntries();

        // Update stats
        this.updateStats();
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    loadMoodEntries() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        const entries = JSON.parse(localStorage.getItem('moodEntries')) || [];
        
        if (entries.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No mood entries yet</p>
                    <small>Log your first mood to see it here!</small>
                </div>
            `;
            return;
        }

        // Sort entries by date (newest first)
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Display recent entries (last 5)
        const recentEntries = entries.slice(0, 5);
        
        activityList.innerHTML = recentEntries.map(entry => `
            <div class="activity-item">
                <div class="activity-mood">${entry.emoji}</div>
                <div class="activity-content">
                    <div class="activity-text">${entry.label}</div>
                    <div class="activity-time">${this.formatTime(entry.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    logMood() {
        const selectedMood = document.querySelector('.mood-option.selected');
        const notesElement = document.getElementById('mood-notes');
        
        if (!selectedMood) {
            this.showNotification('Please select a mood first', 'error');
            return;
        }

        const mood = selectedMood.dataset.mood;
        const label = selectedMood.dataset.label;
        const emoji = selectedMood.querySelector('.mood-emoji').textContent;
        const notes = notesElement ? notesElement.value : '';

        const moodEntry = {
            mood: parseInt(mood),
            label: label,
            emoji: emoji,
            notes: notes,
            timestamp: new Date().toISOString()
        };

        // Add to entries
        this.moodEntries.unshift(moodEntry);
        localStorage.setItem('moodEntries', JSON.stringify(this.moodEntries));

        // Show success message
        this.showNotification(`Mood logged: ${label}`, 'success');

        // Reset form
        if (notesElement) notesElement.value = '';
        document.querySelectorAll('.mood-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // Update UI
        this.loadMoodEntries();
        this.updateStats();
        this.updateMoodStats();
    }

    updateStats() {
        const entries = this.moodEntries;
        
        // Update streak
        const streakCount = this.calculateStreak();
        const streakElement = document.getElementById('streak-count');
        if (streakElement) {
            streakElement.textContent = streakCount;
        }

        // Update mood average
        const moodAverage = this.calculateMoodAverage();
        const averageElement = document.getElementById('mood-average');
        if (averageElement) {
            averageElement.textContent = moodAverage > 0 ? moodAverage.toFixed(1) : '0';
        }

        // Update entries count
        const entriesElement = document.getElementById('entries-count');
        if (entriesElement) {
            entriesElement.textContent = entries.length;
        }

        // Update goals progress (simplified)
        const goalsElement = document.getElementById('goals-progress');
        if (goalsElement) {
            const progress = entries.length > 0 ? Math.min(100, Math.floor(entries.length / 7 * 100)) : 0;
            goalsElement.textContent = `${progress}%`;
        }
    }

    calculateStreak() {
        const entries = this.moodEntries;
        if (entries.length === 0) return 0;

        // Simple streak calculation based on consecutive days with entries
        let streak = 1;
        const today = new Date().toDateString();
        
        for (let i = 1; i < entries.length; i++) {
            const entryDate = new Date(entries[i].timestamp).toDateString();
            const prevEntryDate = new Date(entries[i-1].timestamp).toDateString();
            
            if (entryDate !== prevEntryDate) {
                const dayDiff = Math.floor((new Date(entryDate) - new Date(prevEntryDate)) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        return streak;
    }

    calculateMoodAverage() {
        const entries = this.moodEntries;
        if (entries.length === 0) return 0;

        const sum = entries.reduce((total, entry) => total + entry.mood, 0);
        return sum / entries.length;
    }

    updateMoodStats() {
        // This would typically update charts and advanced statistics
        // For now, we'll just ensure the basic stats are updated
        this.updateStats();
    }

    setupDashboard() {
        // Initialize any dashboard-specific functionality
        if (window.location.pathname.includes('dashboard.html')) {
            this.setupChartPlaceholder();
        }
    }

    setupChartPlaceholder() {
        // In a real application, this would initialize charts
        // For now, we'll just ensure the placeholder is visible
        console.log('Chart functionality would be initialized here');
    }

    setupNavigation() {
        // Set active navigation based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    setupAnimations() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .stat-item, .dashboard-section').forEach(el => {
            observer.observe(el);
        });

        // Hero animations
        window.addEventListener('load', () => {
            const heroElements = document.querySelectorAll('.fade-in');
            heroElements.forEach((el, index) => {
                el.style.animationDelay = `${index * 0.2}s`;
            });
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1000',
            animation: 'slideInRight 0.3s ease',
            maxWidth: '400px',
            fontFamily: 'Poppins, sans-serif'
        });

        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        return colors[type] || '#4299e1';
    }

    formatTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Add CSS for notifications
const notificationStyles = `
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.notification-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.mindWellApp = new MindWellApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MindWellApp;
}