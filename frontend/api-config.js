// api-config.js - Backend API Configuration and Integration

const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    WS_URL: 'ws://localhost:8000',
    ENDPOINTS: {
        // Authentication
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        ME: '/api/auth/me',
        
        // Queries
        SUBMIT_QUERY: '/api/queries/submit',
        GET_QUERIES: '/api/queries/history',
        GET_QUERY: '/api/queries/',
        ASSIGN_QUERY: '/api/queries/',
        REPLY_QUERY: '/api/queries/',
        STATISTICS: '/api/queries/statistics/overview',
        
        // Uploads
        UPLOAD_IMAGE: '/api/upload/image',
        UPLOAD_VOICE: '/api/upload/voice',
        
        // Other
        WEATHER: '/api/weather',
        MARKET_PRICES: '/api/market-prices',
        AI_ANALYSIS: '/api/ai-analysis',
        HEALTH: '/health',
        
        // AI Chatbot
        CHAT_MESSAGE: '/api/chat/message',
        CHAT_HISTORY: '/api/chat/history',
        QUICK_QUESTION: '/api/chat/quick-question'
    },
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
};

// Global API client
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = this.getToken();
    }
    
    getToken() {
        return localStorage.getItem('agri_token');
    }
    
    setToken(token) {
        localStorage.setItem('agri_token', token);
        this.token = token;
    }
    
    removeToken() {
        localStorage.removeItem('agri_token');
        this.token = null;
    }
    
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'GET'
        });
    }
    
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }
    
    async uploadFile(endpoint, file, fieldName = 'file') {
        const formData = new FormData();
        formData.append(fieldName, file);
        
        const url = `${this.baseURL}${endpoint}`;
        const headers = {};
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed');
            }
            
            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
}

// Initialize API client
const apiClient = new APIClient();

// WebSocket Manager
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.listeners = {};
    }
    
    connect() {
        const token = apiClient.getToken();
        if (!token) {
            console.error('No authentication token available');
            return;
        }
        
        const wsUrl = `${API_CONFIG.WS_URL}/ws/notifications?token=${token}`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                this.emit('connected');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message:', data);
                    this.emit('message', data);
                    
                    // Emit specific event types
                    if (data.type) {
                        this.emit(data.type, data);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.emit('error', error);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.emit('disconnected');
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Error creating WebSocket:', error);
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.error('WebSocket is not connected');
        }
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Initialize WebSocket manager
const wsManager = new WebSocketManager();

// Export for global use
window.apiClient = apiClient;
window.wsManager = wsManager;
window.API_CONFIG = API_CONFIG;

console.log('✅ API Configuration loaded');
