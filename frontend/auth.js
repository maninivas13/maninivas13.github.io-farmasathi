// auth.js - Enhanced authentication system with backend integration
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.officerCodes = ['OFFICER123', 'AGRI2024', 'SUPPORT567'];
        this.init();
    }

    async init() {
        // Check if user has token and verify with backend
        const token = localStorage.getItem('agri_token');
        if (token) {
            try {
                await this.verifyToken();
            } catch (error) {
                console.error('Token verification failed:', error);
                this.logout();
            }
        }
        this.updateUI();
    }

    // Verify token with backend
    async verifyToken() {
        try {
            const response = await apiClient.get(API_CONFIG.ENDPOINTS.ME);
            this.currentUser = response.user;
            localStorage.setItem('agri_user', JSON.stringify(response.user));
            return response.user;
        } catch (error) {
            throw error;
        }
    }

    // Farmer registration with backend
    async registerFarmer(name, phone, location) {
        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, {
                name: name.trim(),
                phone: phone.trim(),
                password: phone.trim(), // Using phone as default password
                location: location.trim(),
                role: 'farmer',
                email: null,
                department: null
            }, { auth: false });

            // Store token and user data
            apiClient.setToken(response.access_token);
            this.currentUser = response.user;
            localStorage.setItem('agri_user', JSON.stringify(response.user));
            this.updateUI();
            
            // Connect WebSocket after successful registration
            wsManager.connect();
            
            return response.user;
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }

    // Officer login with verification code and backend
    async loginOfficer(name, code, department) {
        if (!this.verifyOfficerCode(code)) {
            throw new Error('Invalid officer verification code');
        }

        try {
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
                phone: code.trim(),
                password: code.trim(),
                role: 'officer'
            }, { auth: false });

            // Store token and user data
            apiClient.setToken(response.access_token);
            this.currentUser = response.user;
            localStorage.setItem('agri_user', JSON.stringify(response.user));
            localStorage.setItem('agri_officer_code', code);
            this.updateUI();
            
            // Connect WebSocket after successful login
            wsManager.connect();
            
            return response.user;
        } catch (error) {
            console.error('Officer login failed:', error);
            throw new Error(error.message || 'Login failed. Please try again.');
        }
    }

    verifyOfficerCode(code) {
        return this.officerCodes.includes(code.trim().toUpperCase());
    }

    detectSpecialization(name) {
        const specializations = {
            'plant': 'Plant Pathology',
            'soil': 'Soil Science',
            'water': 'Irrigation',
            'market': 'Market Analysis',
            'pest': 'Pest Management',
            'weather': 'Meteorology'
        };

        const nameLower = name.toLowerCase();
        for (const [key, value] of Object.entries(specializations)) {
            if (nameLower.includes(key)) {
                return value;
            }
        }
        return 'General Agriculture';
    }

    logout() {
        this.currentUser = null;
        apiClient.removeToken();
        localStorage.removeItem('agri_user');
        localStorage.removeItem('agri_officer_code');
        wsManager.disconnect();
        this.updateUI();
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }

    updateUI() {
        // Update UI based on user role and authentication status
        if (this.currentUser) {
            document.dispatchEvent(new CustomEvent('authChange', {
                detail: { user: this.currentUser, authenticated: true }
            }));
        } else {
            document.dispatchEvent(new CustomEvent('authChange', {
                detail: { user: null, authenticated: false }
            }));
        }
    }

    isOfficer() {
        return this.currentUser && this.currentUser.role === 'officer';
    }

    isFarmer() {
        return this.currentUser && this.currentUser.role === 'farmer';
    }

    getUser() {
        return this.currentUser;
    }
}

// Initialize auth system
const auth = new AuthSystem();