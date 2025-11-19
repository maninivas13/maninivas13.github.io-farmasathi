// notifications.js - Real-time notification system

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.enabled = true;
        this.soundEnabled = false;
        this.lastCheck = Date.now();
        
        this.init();
    }
    
    init() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Load preferences
        this.loadPreferences();
        
        // Start monitoring for new queries (for officers)
        if (this.isOfficer()) {
            this.startMonitoring();
        }
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    loadPreferences() {
        this.enabled = localStorage.getItem('agri_notifications') !== 'false';
        this.soundEnabled = localStorage.getItem('agri_sound_notifications') === 'true';
    }
    
    isOfficer() {
        const user = JSON.parse(localStorage.getItem('agri_user') || 'null');
        return user && user.role === 'officer';
    }
    
    startMonitoring() {
        // Check for new queries every 30 seconds
        setInterval(() => {
            this.checkForNewQueries();
        }, 30000);
    }
    
    checkForNewQueries() {
        try {
            const queries = JSON.parse(localStorage.getItem('agri_queries') || '[]');
            const newQueries = queries.filter(q => 
                new Date(q.createdAt).getTime() > this.lastCheck &&
                q.status === 'open'
            );
            
            if (newQueries.length > 0) {
                this.showNewQueriesNotification(newQueries);
                this.lastCheck = Date.now();
            }
        } catch (error) {
            console.error('Error checking for new queries:', error);
        }
    }
    
    showNewQueriesNotification(queries) {
        const count = queries.length;
        const title = `${count} New Query${count > 1 ? 'ies' : ''}`;
        const message = `${count} farmer ${count > 1 ? 'queries' : 'query'} need${count === 1 ? 's' : ''} your attention`;
        
        // Desktop notification
        if (this.enabled && 'Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'agri-query-notification',
                requireInteraction: false
            });
            
            notification.onclick = () => {
                window.focus();
                if (typeof refreshDashboard === 'function') {
                    refreshDashboard();
                }
                notification.close();
            };
        }
        
        // In-app notification
        this.showInAppNotification(title, message, 'info');
        
        // Sound notification
        if (this.soundEnabled) {
            this.playNotificationSound();
        }
    }
    
    showInAppNotification(title, message, type = 'info') {
        const existingNotif = document.querySelector('.app-notification');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notifEl = document.createElement('div');
        notifEl.className = `alert alert-${type} alert-dismissible app-notification`;
        notifEl.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notifEl.innerHTML = `
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
            <h6 class="mb-1"><i class="fas fa-bell"></i> ${title}</h6>
            <p class="mb-0">${message}</p>
        `;
        
        document.body.appendChild(notifEl);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notifEl && notifEl.parentElement) {
                notifEl.remove();
            }
        }, 10000);
    }
    
    playNotificationSound() {
        try {
            // Simple notification beep
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
    
    notify(title, message, type = 'info') {
        this.showInAppNotification(title, message, type);
    }
    
    success(message) {
        this.notify('Success', message, 'success');
    }
    
    error(message) {
        this.notify('Error', message, 'danger');
    }
    
    warning(message) {
        this.notify('Warning', message, 'warning');
    }
    
    info(message) {
        this.notify('Information', message, 'info');
    }
    
    setupEventListeners() {
        // Listen for query updates
        window.addEventListener('queriesUpdated', () => {
            if (this.isOfficer()) {
                this.checkForNewQueries();
            }
        });
        
        // Listen for auth changes
        document.addEventListener('authChange', (e) => {
            const { user } = e.detail;
            if (user && user.role === 'officer') {
                this.startMonitoring();
            }
        });
    }
    
    toggleNotifications(enabled) {
        this.enabled = enabled;
        localStorage.setItem('agri_notifications', enabled.toString());
    }
    
    toggleSound(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('agri_sound_notifications', enabled.toString());
    }
}

// CSS for notifications
const notificationCSS = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.app-notification {
    animation: slideInRight 0.3s ease;
}

.notification-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #dc3545;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.notification-indicator {
    position: relative;
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationCSS;
document.head.appendChild(styleSheet);

// Initialize notification system
let notificationSystem;
document.addEventListener('DOMContentLoaded', () => {
    notificationSystem = new NotificationSystem();
    window.notifications = notificationSystem;
});
