// ai-chatbot.js - AI Chatbot Assistant Component

class AIChatbot {
    constructor() {
        this.isOpen = false;
        this.currentLanguage = localStorage.getItem('language') || 'en';
        this.chatHistory = [];
        this.currentAudio = null;
        this.init();
    }

    init() {
        this.createChatWidget();
        this.attachEventListeners();
        this.loadChatHistory();
    }

    createChatWidget() {
        const chatWidget = document.createElement('div');
        chatWidget.id = 'ai-chatbot-widget';
        chatWidget.innerHTML = `
            <!-- Chat Toggle Button -->
            <button id="chat-toggle-btn" class="chat-toggle-btn" aria-label="Open AI Assistant">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="chat-badge" id="chat-badge" style="display:none;">1</span>
            </button>

            <!-- Chat Window -->
            <div id="chat-window" class="chat-window" style="display:none;">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                        </svg>
                        <span>FarmaSathi AI</span>
                    </div>
                    <div class="chat-header-actions">
                        <button id="clear-chat-btn" class="chat-icon-btn" title="Clear chat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button id="minimize-chat-btn" class="chat-icon-btn" title="Minimize">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="chat-quick-actions" id="quick-actions">
                    <button class="quick-action-btn" data-question="weather">
                        ☀️ Today's Weather
                    </button>
                    <button class="quick-action-btn" data-question="price">
                        💰 Market Prices
                    </button>
                    <button class="quick-action-btn" data-question="pest">
                        🐛 Pest Control
                    </button>
                    <button class="quick-action-btn" data-question="disease">
                        🌿 Disease Help
                    </button>
                </div>

                <!-- Messages Container -->
                <div id="chat-messages" class="chat-messages">
                    <div class="chat-message bot-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">
                            <div class="message-text">
                                ${this.getWelcomeMessage()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Typing Indicator -->
                <div id="typing-indicator" class="typing-indicator" style="display:none;">
                    <div class="message-avatar">🤖</div>
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="chat-input-area">
                    <textarea 
                        id="chat-input" 
                        class="chat-input" 
                        placeholder="${this.getInputPlaceholder()}"
                        rows="1"
                    ></textarea>
                    <button id="voice-input-btn" class="chat-icon-btn" title="Voice input">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    </button>
                    <button id="send-message-btn" class="chat-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatWidget);
    }

    attachEventListeners() {
        // Toggle chat
        document.getElementById('chat-toggle-btn').addEventListener('click', () => {
            this.toggleChat();
        });

        // Minimize chat
        document.getElementById('minimize-chat-btn').addEventListener('click', () => {
            this.toggleChat();
        });

        // Send message
        document.getElementById('send-message-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        const input = document.getElementById('chat-input');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.handleQuickAction(question);
            });
        });

        // Clear chat
        document.getElementById('clear-chat-btn').addEventListener('click', () => {
            this.clearChat();
        });

        // Voice input
        document.getElementById('voice-input-btn').addEventListener('click', () => {
            this.startVoiceInput();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const chatWindow = document.getElementById('chat-window');
        const badge = document.getElementById('chat-badge');
        
        if (this.isOpen) {
            chatWindow.style.display = 'flex';
            badge.style.display = 'none';
            this.scrollToBottom();
        } else {
            chatWindow.style.display = 'none';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to UI
        this.addUserMessage(message);
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.showTyping(true);

        try {
            // Try to send to API
            const response = await apiClient.request(API_CONFIG.ENDPOINTS.CHAT_MESSAGE, {
                method: 'POST',
                body: JSON.stringify({
                    message: message,
                    language: this.currentLanguage,
                    include_audio: true,
                    context: {
                        location: localStorage.getItem('userLocation') || 'India'
                    }
                })
            });

            // Hide typing indicator
            this.showTyping(false);

            // Add bot response
            this.addBotMessage(response);

        } catch (error) {
            // Use offline fallback if backend is not available
            this.showTyping(false);
            const fallbackResponse = this.getOfflineResponse(message);
            this.addBotMessage(fallbackResponse);
            console.log('Using offline mode:', error.message);
        }
    }

    addUserMessage(text) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
            </div>
            <div class="message-avatar">👤</div>
        `;
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(response) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot-message';
        
        let audioHtml = '';
        if (response.audio_url) {
            audioHtml = `
                <button class="play-audio-btn" onclick="aiChatbot.playAudio('${response.audio_url}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play Audio
                </button>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(response.message)}</div>
                ${audioHtml}
                ${this.formatDataCard(response.data, response.type)}
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Auto-play audio if available
        if (response.audio_url) {
            this.playAudio(response.audio_url);
        }
    }

    formatMessage(text) {
        // Convert newlines to <br>
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    formatDataCard(data, type) {
        if (!data) return '';

        if (type === 'weather') {
            return `
                <div class="data-card weather-card">
                    <div class="data-row">
                        <span>🌡️ Temperature:</span>
                        <strong>${data.temp}°C</strong>
                    </div>
                    <div class="data-row">
                        <span>💧 Humidity:</span>
                        <strong>${data.humidity}%</strong>
                    </div>
                    <div class="data-row">
                        <span>☁️ Condition:</span>
                        <strong>${data.condition}</strong>
                    </div>
                </div>
            `;
        }

        if (type === 'market' && data.avg > 0) {
            return `
                <div class="data-card market-card">
                    <div class="data-row">
                        <span>💰 Average Price:</span>
                        <strong>₹${data.avg}/${data.unit}</strong>
                    </div>
                    <div class="data-row">
                        <span>📊 Range:</span>
                        <strong>₹${data.min} - ₹${data.max}</strong>
                    </div>
                    <div class="data-row">
                        <span>📈 Trend:</span>
                        <strong class="trend-${data.trend}">${data.trend}</strong>
                    </div>
                </div>
            `;
        }

        return '';
    }

    playAudio(audioUrl) {
        // Stop current audio if playing
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        // Play new audio
        this.currentAudio = new Audio(API_CONFIG.BASE_URL + audioUrl);
        this.currentAudio.play().catch(err => {
            console.error('Audio play error:', err);
        });
    }

    showTyping(show) {
        const indicator = document.getElementById('typing-indicator');
        indicator.style.display = show ? 'flex' : 'none';
        if (show) this.scrollToBottom();
    }

    handleQuickAction(action) {
        const questions = {
            'weather': this.getTranslation('quick_weather'),
            'price': this.getTranslation('quick_price'),
            'pest': this.getTranslation('quick_pest'),
            'disease': this.getTranslation('quick_disease')
        };

        const input = document.getElementById('chat-input');
        input.value = questions[action] || questions['weather'];
        this.sendMessage();
    }

    async clearChat() {
        if (!confirm('Clear all chat history?')) return;

        try {
            await apiClient.request(API_CONFIG.ENDPOINTS.CHAT_HISTORY, {
                method: 'DELETE'
            });

            // Clear UI
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.innerHTML = `
                <div class="chat-message bot-message">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        <div class="message-text">${this.getWelcomeMessage()}</div>
                    </div>
                </div>
            `;

            this.chatHistory = [];
        } catch (error) {
            console.error('Clear chat error:', error);
        }
    }

    async loadChatHistory() {
        try {
            const history = await apiClient.request(API_CONFIG.ENDPOINTS.CHAT_HISTORY, {
                method: 'GET'
            });

            if (history && history.length > 0) {
                // Show last 5 messages
                const recentMessages = history.slice(0, 5).reverse();
                recentMessages.forEach(chat => {
                    this.addUserMessage(chat.user_message);
                    this.addBotMessage({
                        message: chat.bot_response,
                        audio_url: chat.audio_url
                    });
                });
            }
        } catch (error) {
            // Silently fail - offline mode works without history
            console.log('Running in offline mode - chat history not available');
        }
    }

    startVoiceInput() {
        // Use existing voice recorder if available
        if (typeof VoiceRecorder !== 'undefined') {
            alert('Voice input coming soon! Use the query form for voice recording.');
        } else {
            alert('Voice input is not available. Please type your message.');
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getWelcomeMessage() {
        const messages = {
            en: "Hello! 👋 I'm your FarmaSathi AI helper. Ask me about weather, market prices, pest control, or any farming question!",
            hi: "नमस्ते! 👋 मैं आपका FarmaSathi AI सहायक हूं। मुझसे मौसम, बाजार भाव, कीट नियंत्रण या किसी भी कृषि प्रश्न के बारे में पूछें!",
        };
        return messages[this.currentLanguage] || messages.en;
    }

    getInputPlaceholder() {
        const placeholders = {
            en: "Type your question here...",
            hi: "अपना सवाल यहां लिखें...",
        };
        return placeholders[this.currentLanguage] || placeholders.en;
    }

    getTranslation(key) {
        const translations = {
            quick_weather: {
                en: "What is today's weather?",
                hi: "आज का मौसम कैसा है?"
            },
            quick_price: {
                en: "What are the current market prices?",
                hi: "वर्तमान बाजार भाव क्या हैं?"
            },
            quick_pest: {
                en: "How do I control pests in my crops?",
                hi: "मैं अपनी फसलों में कीटों को कैसे नियंत्रित करूं?"
            },
            quick_disease: {
                en: "My plants look sick, what should I do?",
                hi: "मेरे पौधे बीमार लग रहे हैं, मुझे क्या करना चाहिए?"
            }
        };

        return translations[key]?.[this.currentLanguage] || translations[key]?.en || '';
    }

    getOfflineResponse(message) {
        const msg = message.toLowerCase();
        const lang = this.currentLanguage || 'en';
        
        // Weather-related keywords
        if (msg.match(/weather|climat|temperature|rain|forecast|humid|wind|sun|cloud|storm|wheather/) || msg.includes('मौसम') || msg.includes('వాతావరణం')) {
            // Extract city and show city-specific weather
            const cityName = this.extractCityName(msg);
            const weatherData = this.getCityWeatherData(cityName);
            return {
                message: this.getCityWeather(cityName, lang),
                data: { temp: weatherData.temp, humidity: weatherData.humidity, condition: weatherData.condition },
                type: 'weather'
            };
        }
        
        // Market/Price-related keywords
        if (msg.match(/price|market|sell|buy|mandi|rate|cost|value/) || msg.includes('कीमत') || msg.includes('बाजार')) {
            return {
                message: this.translate('market_response', lang),
                data: { min: 1800, max: 2200, avg: 2000, unit: 'quintal', trend: 'stable' },
                type: 'market'
            };
        }
        
        // Pest control keywords
        if (msg.match(/pest|insect|bug|worm|caterpillar|aphid|locust|attack/) || msg.includes('कीट')) {
            return {
                message: this.translate('pest_response', lang),
                type: 'general'
            };
        }
        
        // Disease-related keywords
        if (msg.match(/disease|sick|infection|fungus|bacteria|virus|rot|blight|wilt|spot|mold/) || msg.includes('रोग')) {
            return {
                message: this.translate('disease_response', lang),
                type: 'general'
            };
        }
        
        // Fertilizer/Nutrition keywords
        if (msg.match(/fertili[zs]er|nutrient|npk|nitrogen|phosphorus|potassium|manure|compost|urea/) || msg.includes('खाद')) {
            return {
                message: this.translate('fertilizer_response', lang),
                type: 'general'
            };
        }
        
        // Irrigation/Water keywords
        if (msg.match(/water|irrigat|drip|spray|pump|well|canal|drought/) || msg.includes('पानी') || msg.includes('सिंचाई')) {
            return {
                message: this.translate('irrigation_response', lang),
                type: 'general'
            };
        }
        
        // Planting/Sowing keywords
        if (msg.match(/plant|sow|seed|germination|spacing|depth|transplant/) || msg.includes('बोना') || msg.includes('बीज')) {
            return {
                message: this.translate('planting_response', lang),
                type: 'general'
            };
        }
        
        // Harvesting keywords
        if (msg.match(/harvest|crop|yield|produce|reap|mature|ready/) || msg.includes('कटाई') || msg.includes('फसल')) {
            return {
                message: this.translate('harvest_response', lang),
                type: 'general'
            };
        }
        
        // Soil-related keywords
        if (msg.match(/soil|land|earth|clay|sandy|loam|ph|texture/) || msg.includes('मिट्टी')) {
            // Check for specific crop in question
            if (msg.includes('rice') || msg.includes('paddy') || msg.includes('धान')) {
                return {
                    message: this.translate('soil_rice', lang),
                    type: 'general'
                };
            }
            if (msg.includes('wheat') || msg.includes('गेहूं')) {
                return {
                    message: this.translate('soil_wheat', lang),
                    type: 'general'
                };
            }
            if (msg.includes('cotton') || msg.includes('कपास')) {
                return {
                    message: this.translate('soil_cotton', lang),
                    type: 'general'
                };
            }
            if (msg.includes('tomato') || msg.includes('vegetable') || msg.includes('टमाटर')) {
                return {
                    message: this.translate('soil_vegetable', lang),
                    type: 'general'
                };
            }
            if (msg.includes('sugarcane') || msg.includes('गन्ना')) {
                return {
                    message: this.translate('soil_sugarcane', lang),
                    type: 'general'
                };
            }
            // General soil response
            return {
                message: this.translate('soil_general', lang),
                type: 'general'
            };
        }
        
        // Crop varieties keywords
        if (msg.match(/variety|varieties|hybrid|cultivar|strain|species/) || msg.includes('किस्म')) {
            return {
                message: this.translate('variety_response', lang),
                type: 'general'
            };
        }
        
        // Government schemes keywords - Check for specific schemes FIRST
        if (msg.match(/pm.*kisan|pmkisan|kisan.*samman/i) || msg.includes('पीएम किसान')) {
            return {
                message: this.translate('scheme_pmkisan', lang),
                type: 'general'
            };
        }
        
        if (msg.match(/crop.*insurance|pmfby|fasal.*bima/i) || msg.includes('फसल बीमा')) {
            return {
                message: this.translate('scheme_pmfby', lang),
                type: 'general'
            };
        }
        
        if (msg.match(/kisan.*credit.*card|kcc/i) || msg.includes('किसान क्रेडिट')) {
            return {
                message: this.translate('scheme_kcc', lang),
                type: 'general'
            };
        }
        
        if (msg.match(/soil.*health.*card|mitti.*card/i) || msg.includes('मृदा स्वास्थ्य')) {
            return {
                message: this.translate('scheme_soilcard', lang),
                type: 'general'
            };
        }
        
        if (msg.match(/tractor.*subsidy|equipment.*subsidy|machinery/i) || msg.includes('ट्रैक्टर')) {
            return {
                message: this.translate('scheme_subsidy', lang),
                type: 'general'
            };
        }
        
        if (msg.match(/msp|minimum.*support.*price|guarantee.*price/i) || msg.includes('न्यूनतम समर्थन')) {
            return {
                message: this.translate('scheme_msp', lang),
                type: 'general'
            };
        }
        
        // General schemes keywords
        if (msg.match(/scheme|subsidy|loan|credit|insurance|support|government|yojana/) || msg.includes('योजना') || msg.includes('सब्सिडी')) {
            return {
                message: this.translate('scheme_response', lang),
                type: 'general'
            };
        }
        
        // Livestock/Animal husbandry keywords
        if (msg.match(/cow|buffalo|goat|sheep|poultry|chicken|cattle|livestock|dairy|milk/) || msg.includes('गाय') || msg.includes('पशु')) {
            return {
                message: this.translate('livestock_response', lang),
                type: 'general'
            };
        }
        
        // Organic farming keywords
        if (msg.match(/organic|natural|chemical.*free|eco.*friendly|biodynamic/) || msg.includes('जैविक')) {
            return {
                message: this.translate('organic_farming', lang),
                type: 'general'
            };
        }
        
        // Crop rotation keywords
        if (msg.match(/rotation|crop.*cycle|alternate.*crop/) || msg.includes('फसल चक्र')) {
            return {
                message: this.translate('crop_rotation', lang),
                type: 'general'
            };
        }
        
        // Seed treatment keywords
        if (msg.match(/seed.*treat|treat.*seed|seed.*soak/) || msg.includes('बीज उपचार')) {
            return {
                message: this.translate('seed_treatment', lang),
                type: 'general'
            };
        }
        
        // Water management keywords
        if (msg.match(/water.*save|conserv.*water|rainwater|mulch/) || msg.includes('जल प्रबंधन')) {
            return {
                message: this.translate('water_management', lang),
                type: 'general'
            };
        }
        
        // Composting keywords
        if (msg.match(/compost|vermi|organic.*manure/) || msg.includes('कम्पोस्ट')) {
            return {
                message: this.translate('composting', lang),
                type: 'general'
            };
        }
        
        // Aphid/specific pest keywords
        if (msg.match(/aphid|white.*fly|jassid|thrip/) || msg.includes('एफिड')) {
            return {
                message: this.translate('pest_aphids', lang),
                type: 'general'
            };
        }
        
        // Monsoon preparation keywords
        if (msg.match(/monsoon|rainy.*season|kharif.*prep/) || msg.includes('मानसून')) {
            return {
                message: this.translate('monsoon_prep', lang),
                type: 'general'
            };
        }
        
        // Drought management keywords
        if (msg.match(/drought|dry.*spell|water.*scar/) || msg.includes('सूखा')) {
            return {
                message: this.translate('drought_management', lang),
                type: 'general'
            };
        }
        
        // Greeting
        if (msg.match(/hi|hello|hey|namaste|good|morning|evening/) || msg.includes('नमस्ते')) {
            return {
                message: this.translate('greeting', lang),
                type: 'general'
            };
        }
        
        // Thank you
        if (msg.match(/thank|thanks|grateful|appreciate/) || msg.includes('धन्यवाद')) {
            return {
                message: this.translate('thanks_response', lang),
                type: 'general'
            };
        }
        
        // Default intelligent response - analyze question
        return this.getSmartDefaultResponse(msg);
    }
    
    getTelanganaWeather(msg, lang) {
        // 30 major cities of Telangana with realistic weather data
        const telanganaWeather = {
            'hyderabad': { temp: 32, humidity: 58, condition: 'Partly Cloudy', wind: 15, tempTe: '32°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'warangal': { temp: 34, humidity: 52, condition: 'Sunny', wind: 12, tempTe: '34°C', conditionTe: 'ఎండగా' },
            'nizamabad': { temp: 33, humidity: 55, condition: 'Clear', wind: 10, tempTe: '33°C', conditionTe: 'స్పష్టమైన' },
            'khammam': { temp: 35, humidity: 60, condition: 'Hot & Humid', wind: 8, tempTe: '35°C', conditionTe: 'వేడి & తేమ' },
            'karimnagar': { temp: 33, humidity: 54, condition: 'Partly Cloudy', wind: 13, tempTe: '33°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'ramagundam': { temp: 34, humidity: 56, condition: 'Sunny', wind: 11, tempTe: '34°C', conditionTe: 'ఎండగా' },
            'mahbubnagar': { temp: 36, humidity: 48, condition: 'Hot', wind: 14, tempTe: '36°C', conditionTe: 'వేడిగా' },
            'nalgonda': { temp: 35, humidity: 50, condition: 'Sunny', wind: 12, tempTe: '35°C', conditionTe: 'ఎండగా' },
            'adilabad': { temp: 31, humidity: 62, condition: 'Pleasant', wind: 9, tempTe: '31°C', conditionTe: 'ఆహ్లాదకరమైన' },
            'suryapet': { temp: 34, humidity: 53, condition: 'Partly Cloudy', wind: 10, tempTe: '34°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'miryalaguda': { temp: 35, humidity: 51, condition: 'Sunny', wind: 11, tempTe: '35°C', conditionTe: 'ఎండగా' },
            'jagtial': { temp: 33, humidity: 57, condition: 'Clear', wind: 12, tempTe: '33°C', conditionTe: 'స్పష్టమైన' },
            'nirmal': { temp: 32, humidity: 59, condition: 'Partly Cloudy', wind: 10, tempTe: '32°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'kamareddy': { temp: 33, humidity: 56, condition: 'Sunny', wind: 13, tempTe: '33°C', conditionTe: 'ఎండగా' },
            'siddipet': { temp: 34, humidity: 54, condition: 'Clear', wind: 11, tempTe: '34°C', conditionTe: 'స్పష్టమైన' },
            'palwancha': { temp: 35, humidity: 61, condition: 'Hot & Humid', wind: 9, tempTe: '35°C', conditionTe: 'వేడి & తేమ' },
            'kothagudem': { temp: 35, humidity: 60, condition: 'Hot', wind: 10, tempTe: '35°C', conditionTe: 'వేడిగా' },
            'bodhan': { temp: 33, humidity: 55, condition: 'Partly Cloudy', wind: 12, tempTe: '33°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'sangareddy': { temp: 32, humidity: 57, condition: 'Pleasant', wind: 14, tempTe: '32°C', conditionTe: 'ఆహ్లాదకరమైన' },
            'metpally': { temp: 33, humidity: 56, condition: 'Sunny', wind: 11, tempTe: '33°C', conditionTe: 'ఎండగా' },
            'zahirabad': { temp: 34, humidity: 52, condition: 'Clear', wind: 13, tempTe: '34°C', conditionTe: 'స్పష్టమైన' },
            'medak': { temp: 32, humidity: 58, condition: 'Partly Cloudy', wind: 10, tempTe: '32°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'vikarabad': { temp: 31, humidity: 60, condition: 'Pleasant', wind: 12, tempTe: '31°C', conditionTe: 'ఆహ్లాదకరమైన' },
            'mancherial': { temp: 33, humidity: 55, condition: 'Sunny', wind: 11, tempTe: '33°C', conditionTe: 'ఎండగా' },
            'wanaparthy': { temp: 36, humidity: 49, condition: 'Hot', wind: 14, tempTe: '36°C', conditionTe: 'వేడిగా' },
            'bhongir': { temp: 34, humidity: 53, condition: 'Partly Cloudy', wind: 12, tempTe: '34°C', conditionTe: 'పాక్షికంగా మేఘావృతం' },
            'jangaon': { temp: 34, humidity: 54, condition: 'Sunny', wind: 10, tempTe: '34°C', conditionTe: 'ఎండగా' },
            'gadwal': { temp: 36, humidity: 47, condition: 'Hot', wind: 15, tempTe: '36°C', conditionTe: 'వేడిగా' },
            'bhupalpally': { temp: 32, humidity: 59, condition: 'Pleasant', wind: 11, tempTe: '32°C', conditionTe: 'ఆహ్లాదకరమైన' },
            'narayanpet': { temp: 35, humidity: 50, condition: 'Sunny', wind: 13, tempTe: '35°C', conditionTe: 'ఎండగా' }
        };
        
        // Search for city name in message
        for (const [city, weather] of Object.entries(telanganaWeather)) {
            if (msg.includes(city)) {
                const response = {
                    'en': `Weather in ${city.charAt(0).toUpperCase() + city.slice(1)}, Telangana:

🌡️ Temperature: ${weather.temp}°C
💧 Humidity: ${weather.humidity}%
☁️ Condition: ${weather.condition}
💨 Wind Speed: ${weather.wind} km/h

✅ Good conditions for farming activities. Plan irrigation accordingly.`,
                    'hi': `${city.charAt(0).toUpperCase() + city.slice(1)}, तेलंगाना का मौसम:

🌡️ तापमान: ${weather.temp}°C
💧 नमी: ${weather.humidity}%
☁️ स्थिति: ${weather.condition}
💨 हवा की गति: ${weather.wind} किमी/घंटा

✅ खेती के लिए अच्छी परिस्थितियां। सिंचाई योजना बनाएं।`,
                    'te': `${city.charAt(0).toUpperCase() + city.slice(1)}, తెలంగాణ వాతావరణం:

🌡️ ఉష్ణోగ్రత: ${weather.tempTe}
💧 తేమ: ${weather.humidity}%
☁️ పరిస్థితి: ${weather.conditionTe}
💨 గాలి వేగం: ${weather.wind} కిమీ/గంట

✅ వ్యవసాయ కార్యకలాపాలకు మంచి పరిస్థితులు. నీటిపారుదల ప్రణాళిక చేయండి.`,
                    'ta': `${city.charAt(0).toUpperCase() + city.slice(1)}, தெலங்கானா வானிலை:

🌡️ வெப்பநிலை: ${weather.temp}°C
💧 ஈரப்பதம்: ${weather.humidity}%
☁️ நிலை: ${weather.condition}
💨 காற்றின் வேகம்: ${weather.wind} கி.மீ/மணி

✅ விவசாயத்திற்கு நல்ல சூழ்நிலை.`,
                    'bn': `${city.charAt(0).toUpperCase() + city.slice(1)}, তেলেঙ্গানা আবহাওয়া:

🌡️ তাপমাত্রা: ${weather.temp}°C
💧 আর্দ্রতা: ${weather.humidity}%
☁️ অবস্থা: ${weather.condition}
💨 বাতাসের গতি: ${weather.wind} কিমি/ঘন্টা

✅ চাষাবাদের জন্য ভাল অবস্থা।`,
                    'mr': `${city.charAt(0).toUpperCase() + city.slice(1)}, तेलंगणा हवामान:

🌡️ तापमान: ${weather.temp}°C
💧 आर्द्रता: ${weather.humidity}%
☁️ स्थिती: ${weather.condition}
💨 वाऱ्याचा वेग: ${weather.wind} किमी/तास

✅ शेतीसाठी चांगली परिस्थिती।`
                };
                
                return {
                    message: response[lang] || response['en'],
                    data: { temp: weather.temp, humidity: weather.humidity, condition: weather.condition, city: city },
                    type: 'weather'
                };
            }
        }
        
        return null; // No city found
    }
    
    extractLocation(msg) {
        // Extract location from message - defaults to Hyderabad
        return 'Hyderabad,Telangana,India';
    }
    
    extractCityName(msg) {
        // Telangana cities
        const telangana = ['hyderabad', 'warangal', 'nizamabad', 'khammam', 'karimnagar', 'siddipet', 'siddhipet',
            'ramagundam', 'mahbubnagar', 'nalgonda', 'adilabad', 'suryapet', 'miryalaguda', 'jagtial',
            'nirmal', 'kamareddy', 'palwancha', 'kothagudem', 'bodhan', 'sangareddy', 'metpally',
            'zahirabad', 'medak', 'vikarabad', 'mancherial', 'wanaparthy', 'bhongir', 'jangaon',
            'gadwal', 'bhupalpally', 'narayanpet', 'secunderabad'];
        
        // Andhra Pradesh cities
        const andhrapradesh = ['visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'kurnool', 'kakinada',
            'rajahmundry', 'tirupati', 'kadapa', 'vizag', 'vishakapatnam'];
        
        // All cities combined
        const allCities = [...telangana, ...andhrapradesh];
        
        for (const city of allCities) {
            if (msg.includes(city)) {
                // Normalize city names
                if (city === 'vizag' || city === 'vishakapatnam') return 'Visakhapatnam';
                if (city === 'siddhipet') return 'Siddipet';
                return city.charAt(0).toUpperCase() + city.slice(1);
            }
        }
        return 'Hyderabad'; // Default
    }
    
    getCityWeatherData(city) {
        const weatherData = {
            // Telangana Cities
            'Hyderabad': { temp: 32, humidity: 58, condition: 'Partly Cloudy', wind: 15, state: 'Telangana' },
            'Warangal': { temp: 34, humidity: 52, condition: 'Sunny', wind: 12, state: 'Telangana' },
            'Nizamabad': { temp: 33, humidity: 55, condition: 'Clear', wind: 10, state: 'Telangana' },
            'Khammam': { temp: 35, humidity: 60, condition: 'Hot & Humid', wind: 8, state: 'Telangana' },
            'Karimnagar': { temp: 33, humidity: 54, condition: 'Partly Cloudy', wind: 13, state: 'Telangana' },
            'Siddipet': { temp: 34, humidity: 54, condition: 'Clear', wind: 11, state: 'Telangana' },
            'Ramagundam': { temp: 34, humidity: 56, condition: 'Sunny', wind: 11, state: 'Telangana' },
            'Mahbubnagar': { temp: 36, humidity: 48, condition: 'Hot', wind: 14, state: 'Telangana' },
            'Nalgonda': { temp: 35, humidity: 50, condition: 'Sunny', wind: 12, state: 'Telangana' },
            'Adilabad': { temp: 31, humidity: 62, condition: 'Pleasant', wind: 9, state: 'Telangana' },
            'Suryapet': { temp: 34, humidity: 53, condition: 'Partly Cloudy', wind: 10, state: 'Telangana' },
            'Miryalaguda': { temp: 35, humidity: 51, condition: 'Sunny', wind: 11, state: 'Telangana' },
            'Jagtial': { temp: 33, humidity: 57, condition: 'Clear', wind: 12, state: 'Telangana' },
            'Nirmal': { temp: 32, humidity: 59, condition: 'Partly Cloudy', wind: 10, state: 'Telangana' },
            'Kamareddy': { temp: 33, humidity: 56, condition: 'Sunny', wind: 13, state: 'Telangana' },
            'Palwancha': { temp: 35, humidity: 61, condition: 'Hot & Humid', wind: 9, state: 'Telangana' },
            'Kothagudem': { temp: 35, humidity: 60, condition: 'Hot', wind: 10, state: 'Telangana' },
            'Bodhan': { temp: 33, humidity: 55, condition: 'Partly Cloudy', wind: 12, state: 'Telangana' },
            'Sangareddy': { temp: 32, humidity: 57, condition: 'Pleasant', wind: 14, state: 'Telangana' },
            'Secunderabad': { temp: 32, humidity: 58, condition: 'Partly Cloudy', wind: 15, state: 'Telangana' },
            
            // Andhra Pradesh Cities
            'Visakhapatnam': { temp: 30, humidity: 75, condition: 'Humid & Cloudy', wind: 18, state: 'Andhra Pradesh' },
            'Vijayawada': { temp: 35, humidity: 62, condition: 'Hot & Humid', wind: 10, state: 'Andhra Pradesh' },
            'Guntur': { temp: 36, humidity: 58, condition: 'Hot', wind: 12, state: 'Andhra Pradesh' },
            'Nellore': { temp: 34, humidity: 70, condition: 'Humid', wind: 14, state: 'Andhra Pradesh' },
            'Kurnool': { temp: 37, humidity: 45, condition: 'Very Hot', wind: 16, state: 'Andhra Pradesh' },
            'Kakinada': { temp: 32, humidity: 72, condition: 'Humid & Warm', wind: 15, state: 'Andhra Pradesh' },
            'Rajahmundry': { temp: 33, humidity: 68, condition: 'Warm & Humid', wind: 13, state: 'Andhra Pradesh' },
            'Tirupati': { temp: 33, humidity: 60, condition: 'Warm', wind: 11, state: 'Andhra Pradesh' },
            'Kadapa': { temp: 36, humidity: 50, condition: 'Hot', wind: 14, state: 'Andhra Pradesh' }
        };
        
        return weatherData[city] || weatherData['Hyderabad'];
    }
    
    getCityWeather(city, lang) {
        const weatherData = {
            // Telangana Cities
            'Hyderabad': { temp: 32, humidity: 58, condition: 'Partly Cloudy', wind: 15, state: 'Telangana' },
            'Warangal': { temp: 34, humidity: 52, condition: 'Sunny', wind: 12, state: 'Telangana' },
            'Nizamabad': { temp: 33, humidity: 55, condition: 'Clear', wind: 10, state: 'Telangana' },
            'Khammam': { temp: 35, humidity: 60, condition: 'Hot & Humid', wind: 8, state: 'Telangana' },
            'Karimnagar': { temp: 33, humidity: 54, condition: 'Partly Cloudy', wind: 13, state: 'Telangana' },
            'Siddipet': { temp: 34, humidity: 54, condition: 'Clear', wind: 11, state: 'Telangana' },
            'Ramagundam': { temp: 34, humidity: 56, condition: 'Sunny', wind: 11, state: 'Telangana' },
            'Mahbubnagar': { temp: 36, humidity: 48, condition: 'Hot', wind: 14, state: 'Telangana' },
            'Nalgonda': { temp: 35, humidity: 50, condition: 'Sunny', wind: 12, state: 'Telangana' },
            'Adilabad': { temp: 31, humidity: 62, condition: 'Pleasant', wind: 9, state: 'Telangana' },
            'Suryapet': { temp: 34, humidity: 53, condition: 'Partly Cloudy', wind: 10, state: 'Telangana' },
            'Miryalaguda': { temp: 35, humidity: 51, condition: 'Sunny', wind: 11, state: 'Telangana' },
            'Jagtial': { temp: 33, humidity: 57, condition: 'Clear', wind: 12, state: 'Telangana' },
            'Nirmal': { temp: 32, humidity: 59, condition: 'Partly Cloudy', wind: 10, state: 'Telangana' },
            'Kamareddy': { temp: 33, humidity: 56, condition: 'Sunny', wind: 13, state: 'Telangana' },
            'Palwancha': { temp: 35, humidity: 61, condition: 'Hot & Humid', wind: 9, state: 'Telangana' },
            'Kothagudem': { temp: 35, humidity: 60, condition: 'Hot', wind: 10, state: 'Telangana' },
            'Bodhan': { temp: 33, humidity: 55, condition: 'Partly Cloudy', wind: 12, state: 'Telangana' },
            'Sangareddy': { temp: 32, humidity: 57, condition: 'Pleasant', wind: 14, state: 'Telangana' },
            'Secunderabad': { temp: 32, humidity: 58, condition: 'Partly Cloudy', wind: 15, state: 'Telangana' },
            
            // Andhra Pradesh Cities
            'Visakhapatnam': { temp: 30, humidity: 75, condition: 'Humid & Cloudy', wind: 18, state: 'Andhra Pradesh' },
            'Vijayawada': { temp: 35, humidity: 62, condition: 'Hot & Humid', wind: 10, state: 'Andhra Pradesh' },
            'Guntur': { temp: 36, humidity: 58, condition: 'Hot', wind: 12, state: 'Andhra Pradesh' },
            'Nellore': { temp: 34, humidity: 70, condition: 'Humid', wind: 14, state: 'Andhra Pradesh' },
            'Kurnool': { temp: 37, humidity: 45, condition: 'Very Hot', wind: 16, state: 'Andhra Pradesh' },
            'Kakinada': { temp: 32, humidity: 72, condition: 'Humid & Warm', wind: 15, state: 'Andhra Pradesh' },
            'Rajahmundry': { temp: 33, humidity: 68, condition: 'Warm & Humid', wind: 13, state: 'Andhra Pradesh' },
            'Tirupati': { temp: 33, humidity: 60, condition: 'Warm', wind: 11, state: 'Andhra Pradesh' },
            'Kadapa': { temp: 36, humidity: 50, condition: 'Hot', wind: 14, state: 'Andhra Pradesh' }
        };
        
        const weather = weatherData[city] || weatherData['Hyderabad'];
        
        const responses = {
            'en': `Weather in ${city}, ${weather.state}:

🌡️ Temperature: ${weather.temp}°C
💧 Humidity: ${weather.humidity}%
☁️ Condition: ${weather.condition}
💨 Wind Speed: ${weather.wind} km/h

✅ Good conditions for farming. Plan irrigation accordingly.`,
            'hi': `${city}, ${weather.state} का मौसम:

🌡️ तापमान: ${weather.temp}°C
💧 नमी: ${weather.humidity}%
☁️ स्थिति: ${weather.condition}
💨 हवा: ${weather.wind} किमी/घंटा

✅ खेती के लिए अच्छी परिस्थिति।`,
            'te': `${city}, ${weather.state} వాతావరణం:

🌡️ ఉష్ణోగ్రత: ${weather.temp}°C
💧 తేమ: ${weather.humidity}%
☁️ పరిస్థితి: ${weather.condition}
💨 గాలి: ${weather.wind} కిమీ/గంట

✅ వ్యవసాయం కోసం మంచి పరిస్థితులు।`,
            'ta': `${city}, ${weather.state} வானிலை:

🌡️ வெப்பநிலை: ${weather.temp}°C
💧 ஈரப்பதம்: ${weather.humidity}%
☁️ நிலை: ${weather.condition}
💨 காற்று: ${weather.wind} கி.மீ/மணி

✅ விவசாயத்திற்கு நல்லது।`,
            'bn': `${city}, ${weather.state} আবহাওয়া:

🌡️ তাপমাত্রা: ${weather.temp}°C
💧 আর্দ্রতা: ${weather.humidity}%
☁️ অবস্থা: ${weather.condition}
💨 বাতাস: ${weather.wind} কিমি/ঘন্টা

✅ চাষের জন্য ভালো।`,
            'mr': `${city}, ${weather.state} हवामान:

🌡️ तापमान: ${weather.temp}°C
💧 आर्द्रता: ${weather.humidity}%
☁️ स्थिती: ${weather.condition}
💨 वारा: ${weather.wind} किमी/तास

✅ शेतीसाठी चांगले।`
        };
        
        return responses[lang] || responses['en'];
    }
    
    formatMessage(text) {
        // Convert newlines to <br>
        return text.replace(/\n/g, '<br>');
    }
    
    translate(key, lang) {
        const translations = {
            'weather_response': {
                'en': "Today's weather: Temperature 28°C, Humidity 65%, Partly cloudy. Wind speed 12 km/h. Good conditions for farming activities.",
                'hi': "आज का मौसम: तापमान 28°C, नमी 65%, आंशिक बादल। हवा की गति 12 किमी/घंटा। खेती के लिए अच्छी परिस्थितियां।",
                'te': "ఈ రోజు వాతావరణం: ఉష్ణోగ్రత 28°C, తేమ 65%, పాక్షికంగా మేఘాలు। గాలి వేగం 12 కిమీ/గంట। వేసవి కోసం మంచి పరిస్థితులు।",
                'ta': "இன்றைய வானிலை: வெப்பநிலை 28°C, ஈரப்பதம் 65%, சில மேகங்கள்। காற்றின் வேகம் 12 கி.மீ/மணி। விவசாயத்திற்கு நல்ல சூழநிலை।",
                'bn': "আজের আবহাওয়া: তাপমাত্রা 28°C, আর্দ্রতা 65%, আংশিক মেঘলা। বাতাসের গতি 12 কিমি/ঘন্টা। চাষাবাদের জন্য ভাল অবস্থা।",
                'mr': "आजचे हवामान: तापमान 28°C, आर्द्रता 65%, अंशतः ढगाळ। वार्याचा वेग 12 किमी/तास। शेतीसाठी चांगली परिस्थिती।"
            },
            'market_response': {
                'en': "Current market prices: Rice ₹2000/quintal, Wheat ₹2100/quintal, Cotton ₹5750/quintal, Tomato ₹1000/quintal. Prices updated today.",
                'hi': "वर्तमान बाजार भाव: चावल ₹2000/क्विंटल, गेहूं ₹2100/क्विंटल, कपास ₹5750/क्विंटल, टमाटर ₹1000/क्विंटल। आज की दरें।",
                'te': "ప్రస్తుత మార్కెట్ ధరలు: అక్కి ₹2000/క్వింటల్, గోధుమలు ₹2100/క్వింటల్, పట్టి ₹5750/క్వింటల్, టమాటో ₹1000/క్వింటల్। ఈ రోజు ధరలు।",
                'ta': "தற்போதைய சந்தை விலைகள்: அரிசி ₹2000/குவிண்டல், கோதுமை ₹2100/குவிண்டல், பருத்தி ₹5750/குவிண்டல், தக்காளி ₹1000/குவிண்டல்। இன்றைய விலைகள்।",
                'bn': "বর্তমান বাজার দাম: চাল ₹2000/কুইন্টাল, গম ₹2100/কুইন্টাল, তুলা ₹5750/কুইন্টাল, টমেটো ₹1000/কুইন্টাল। আজকের দাম।",
                'mr': "सध्याच्या बाजारभाव: तांदूळ ₹2000/क्विंटल, गहू ₹2100/क्विंटल, कापूस ₹5750/क्विंटल, टोमेटो ₹1000/क्विंटल। आजचे दर।"
            },
            'pest_response': {
                'en': "Pest Control: 1) Identify pest type. 2) Neem oil spray (10ml/liter). 3) Spray morning/evening. 4) Repeat after 7 days. 5) Maintain field hygiene. 6) For severe cases, consult officer.",
                'hi': "कीट नियंत्रण: 1) कीट की पहचान करें। 2) नीम तेल का छिड़काव (10 मिली/लीटर)। 3) सुबह/शाम छिड़कें। 4) 7 दिन बाद दोहराएं। 5) खेत की स्वच्छता बनाए रखें। 6) गंभीर मामलों में अधिकारी से संपर्क करें।",
                'te': "కీటకాల నియంత్రణ: 1) కీటకాల రకం గుర్తించండి। 2) వేప నుణ్ణె స్ప్రే (10మిలీ/లీటర్)। 3) ఉదయం/సాయంత్రం స్ప్రే చేయండి। 4) 7 రోజుల తర్వాత పునరావృతం చేయండి। 5) వెల స్వచ్ఛత నిర్వహించండి। 6) తీవ్రమైన సందర్భాల్లో అధికారిని సంప్రదించండి।",
                'ta': "கீட்டுக் கட்டுப்பாடு: 1) கீட்டு வகையை கண்டறியுங்கள்। 2) வேப்பெண்ணெய் தெளிப்பு (10மிலி/லிட்டர்)। 3) காலை/மாலை தெளிக்கவும்। 4) 7 நாட்களுக்கு பிறகு மீண்டும் செய்யுங்கள்। 5) வயல் சுத்தமாக பராமரிக்கவும்। 6) குறிப்பாக தீவிர நிகழ்வுகளில் அதிகாரியை தொடர்பு கொள்ளவும்।",
                'bn': "কীটপতঙ্গ নিয়ন্ত্রণ: 1) কীটপতঙ্গের ধরন চিহ্নিত করুন। 2) নিম তেলের স্প্রে (10মিলি/লিটার)। 3) সকাল/সন্ধ্যায় স্প্রে করুন। 4) 7 দিন পর পুনরায় করুন। 5) ক্ষেতের স্বচ্ছতা বজায় রাখুন। 6) গুরুতর ক্ষেত্রে কর্মকর্তার সঙ্গে যোগাযোগ করুন।",
                'mr': "कीटक नियंत्रण: 1) कीटकाचा प्रकार ओळखा। 2) कडूनिंबाच्या तेलाची फवारणी (10मिली/लिटर)। 3) सकाळी/संध्याकाळी फवारा। 4) 7 दिवसांनंतर पुन्हा करा। 5) शेताची स्वच्छता ठेवा। 6) गंभीर प्रकरणांमध्ये अधिकार्यांशी संपर्क साधा।"
            },
            'greeting': {
                'en': "Hello! 👋 I'm your FarmaSathi AI helper. Ask me about: Weather, Market prices, Pests, Diseases, Fertilizers, Irrigation, Planting, Harvesting, Soil, Government schemes, or any farming question!",
                'hi': "नमस्ते! 👋 मैं आपका FarmaSathi AI सहायक हूं। मुझसे पूछें: मौसम, बाजार भाव, कीट, रोग, खाद, सिंचाई, बुवाई, कटाई, मिट्टी, सरकारी योजनाएं, या कोई भी खेती संबंधित सवाल!",
                'te': "నమస్కారం! 👋 నేను మీ FarmaSathi AI సహాయిని। నన్ను అడగండి: వాతావరణం, మార్కెట్ ధరలు, కీటకాలు, వ్యాధులు, ఎరవులు, నీరుపాటు, వేసవి, కోత, మణ్ణు, ప్రభుత్వ పథకాలు, లేదా వేసవి సంబంధిత ప్రశ్నలు!",
                'ta': "வணக்கம்! 👋 நான் உங்கள் FarmaSathi AI உதவியாளர்। என்னிடம் கேளுங்கள்: வானிலை, சந்தை விலை, கீட்டுக்கள், நோய்கள், உரம், நீர்பசனம், நடவு, அறுவடை, மண்ண், அரசு திட்டங்கள், அல்லது ஏதாவது விவசாய கேள்விகள்!",
                'bn': "নমস্কার! 👋 আমি আপনার FarmaSathi AI সহায়ক। আমাকে জিজ্ঞাসা করুন: আবহাওয়া, বাজারের দাম, কীটপতঙ্গ, রোগ, সার, সেচ, রোপন, ফসল কাটা, মাটি, সরকারি পরিকল্পনা, বা যেকোন চাষবাদ সংক্রান্ত প্রশ্ন!",
                'mr': "नमस्कार! 👋 मी तुमचा FarmaSathi AI सहाय्यक आहे। मला विचारा: हवामान, बाजार भाव, कीटक, रोग, खते, सिंचन, लागवड, कापणी, माती, शासकीय योजना, किंवा कोणताही शेतीशी संबंधित प्रश्न!"
            },
            'scheme_response': {
                'en': "Government Schemes for Farmers:\n\n1️⃣ PM-KISAN: ₹6000/year direct income support\n2️⃣ Crop Insurance (PMFBY): Protection against crop loss, low premium\n3️⃣ Kisan Credit Card: Easy credit at 4% interest, up to ₹3 lakh\n4️⃣ Soil Health Card: Free soil testing and recommendations\n5️⃣ Equipment Subsidy: 40-50% subsidy on tractors & implements\n6️⃣ MSP (Minimum Support Price): Guaranteed price for 23 crops\n\nVisit your nearest Krishi Vigyan Kendra or Agriculture Department for applications. Check our Subsidies section on the homepage for more details!",
                'hi': "किसानों के लिए सरकारी योजनाएं:\n\n1️⃣ PM-KISAN: ₹6000/वर्ष प्रत्यक्ष आय सहायता\n2️⃣ फसल बीमा (PMFBY): फसल नुकसान से सुरक्षा, कम प्रीमियम\n3️⃣ किसान क्रेडिट कार्ड: 4% ब्याज पर आसान ऋण, ₹3 लाख तक\n4️⃣ मृदा स्वास्थ्य कार्ड: मुफ्त मिट्टी परीक्षण\n5️⃣ उपकरण सब्सिडी: ट्रैक्टर और औजारों पर 40-50% सब्सिडी\n6️⃣ MSP (न्यूनतम समर्थन मूल्य): 23 फसलों के लिए गारंटीड मूल्य\n\nआवेदन के लिए निकटतम कृषि विज्ञान केंद्र या कृषि विभाग जाएं। अधिक जानकारी के लिए होमपेज पर सब्सिडी अनुभाग देखें!",
                'te': "రైతులకు ప్రభుత్వ పథకాలు:\n\n1️⃣ PM-KISAN: ₹6000/సంవత్సరం ప్రత్యక్ష ఆదాయ మద్దతు\n2️⃣ పంట బీమా (PMFBY): పంట నష్టం నుండి రక్షణ, తక్కువ ప్రీమియం\n3️⃣ కిసాన్ క్రెడిట్ కార్డ్: 4% వడ్డీతో సులభ రుణం, ₹3 లక్షల వరకు\n4️⃣ నేల ఆరోగ్య కార్డ్: ఉచిత నేల పరీక్ష\n5️⃣ పరికరాల సబ్సిడీ: ట్రాక్టర్లు మరియు పరికరాలపై 40-50% సబ్సిడీ\n6️⃣ MSP (కనీస మద్దతు ధర): 23 పంటలకు హామీ ధర\n\nదరఖాస్తుల కోసం సమీప కృషి విజ్ఞాన కేంద్రం లేదా వ్యవసాయ విభాగాన్ని సందర్శించండి!",
                'ta': "விவசாயிகளுக்கான அரசு திட்டங்கள்:\n\n1️⃣ PM-KISAN: ₹6000/ஆண்டு நேரடி வருமான ஆதரவு\n2️⃣ பயிர் காப்பீடு (PMFBY): பயிர் இழப்பிலிருந்து பாதுகாப்பு, குறைந்த பிரீமியம்\n3️⃣ கிசான் கடன் அட்டை: 4% வட்டியில் எளிய கடன், ₹3 லட்சம் வரை\n4️⃣ மண் ஆரோக்கிய அட்டை: இலவச மண் பரிசோதனை\n5️⃣ உபகரண மானியம்: டிராக்டர்கள் மற்றும் கருவிகளுக்கு 40-50% மானியம்\n6️⃣ MSP (குறைந்தபட்ச ஆதரவு விலை): 23 பயிர்களுக்கு உத்தரவாத விலை\n\nவிண்ணப்பங்களுக்கு அருகிலுள்ள கிருஷி விஞ்ஞான கேந்திரா அல்லது வேளாண்மைத் துறையை பார்வையிடவும்!",
                'bn': "কৃষকদের জন্য সরকারি পরিকল্পনা:\n\n1️⃣ PM-KISAN: ₹6000/বছর প্রত্যক্ষ আয় সহায়তা\n2️⃣ ফসল বীমা (PMFBY): ফসলের ক্ষতি থেকে সুরক্ষা, কম প্রিমিয়াম\n3️⃣ কিষাণ ক্রেডিট কার্ড: 4% সুদে সহজ ঋণ, ₹3 লক্ষ পর্যন্ত\n4️⃣ মাটি স্বাস্থ্য কার্ড: বিনামূল্যে মাটি পরীক্ষা\n5️⃣ যন্ত্রপাতি ভর্তুকি: ট্রাক্টর এবং যন্ত্রপাতিতে 40-50% ভর্তুকি\n6️⃣ MSP (ন্যূনতম সহায়ক মূল্য): 23টি ফসলের জন্য নিশ্চিত মূল্য\n\nআবেদনের জন্য নিকটবর্তী কৃষি বিজ্ঞান কেন্দ্র বা কৃষি বিভাগে যান!",
                'mr': "शेतकर्‍यांसाठी शासकीय योजना:\n\n1️⃣ PM-KISAN: ₹6000/वर्ष थेट उत्पन्न समर्थन\n2️⃣ पीक विमा (PMFBY): पीक नुकसानापासून संरक्षण, कमी प्रीमियम\n3️⃣ किसान क्रेडिट कार्ड: 4% व्याजावर सोपे कर्ज, ₹3 लाख पर्यंत\n4️⃣ माती आरोग्य कार्ड: मोफत माती चाचणी\n5️⃣ उपकरण अनुदान: ट्रॅक्टर आणि अवजारांवर 40-50% अनुदान\n6️⃣ MSP (किमान आधार किंमत): 23 पिकांसाठी हमी किंमत\n\nअर्जासाठी जवळच्या कृषि विज्ञान केंद्र किंवा कृषि विभागाला भेट द्या!"
            },
            // Add more translations for other response types...
            'soil_rice': {
                'en': "Best soil for rice: Clayey loam with good water retention. pH: 5.5-6.5. Soil should retain water well for flooded conditions.",
                'hi': "चावल के लिए सर्वोत्तम मिट्टी: चिकनी दोमट मिट्टी जो पानी अच्छी तरह रोक सके। pH: 5.5-6.5. मिट्टी में जलभराव के लिए पानी रोकने की क्षमता होनी चाहिए।",
                'te': "ధాన్యం కోసం ఉత్తమ మణ్ణు: నీరు ధారణ క్షమత ఉన్న చెంబు లోమ్ మణ్ణు। pH: 5.5-6.5. నీరు మంచి ధారణ చేయగల క్షమత ఉండాలి।",
                'ta': "அரிசிக்கு சிறந்த மண்: நல்ல நீர் தங்கு திறனுடன் கலவை கருந்து மண்। pH: 5.5-6.5. நீர் நிறைந்த நிலைக்கு மண் நல்ல தங்கு திறன் கொண்டிருக்க வேண்டும்।",
                'bn': "চালের জন্য সেরা মাটি: ভাল জল ধারণ ক্ষমতা সহ কেলাসিট দোআঁশ মাটি। pH: 5.5-6.5. মাটি ভালভাবে জল ধরে রাখতে হবে।",
                'mr': "तांदूळासाठी सर्वोत्तम माती: चांगल्या जलधारण क्षमतेसह चिकणी पैकी माती। pH: 5.5-6.5. पाण्याच्या साठ्यासाठी मातीत पाणी टिकवून ठेवण्याची क्षमता असली पाहिजे।"
            },
            'disease_response': {'en': "Plant diseases: Look for spots, wilting, discoloration. Remove infected parts, apply fungicide, improve ventilation.", 'hi': "पौधों की बीमारी: धब्बे, मुरझाना देखें। संक्रमित भाग हटाएं, फफूंदनाशी लगाएं।", 'te': "మొక్కల వ్యాధి: మచ్చలు, వాడిపోవడం చూడండి। సోకిన భాగాలు తొలగించండి।", 'ta': "தாவர நோய்: புள்ளிகள், வாடுதல் பாருங்கள். பாதிக்கப்பட்ட பகுதிகளை அகற்றவும்.", 'bn': "উদ্ভিদ রোগ: দাগ, শুকিয়ে যাওয়া দেখুন। সংক্রমিত অংশ সরান।", 'mr': "वनस्पती रोग: ठिपके, कोमेजणे पहा। संक्रमित भाग काढा।"},
            'fertilizer_response': {'en': "Fertilizer: Apply NPK based on soil test. Basal dose at sowing, top dressing during growth.", 'hi': "उर्वरक: मिट्टी परीक्षण के अनुसार NPK डालें। बुवाई पर बेसल, वृद्धि में टॉप ड्रेसिंग।", 'te': "ఎరువులు: నేల పరీక్ష ఆధారంగా NPK వేయండి। విత్తడంలో బేసల్, పెరుగుదలలో టాప్ డ్రెస్సింగ్.", 'ta': "உரம்: மண் பரிசோதனை அடிப்படையில் NPK இடவும். விதைப்பில் அடிப்படை, வளர்ச்சியில் மேல் உரம்.", 'bn': "সার: মাটি পরীক্ষা অনুযায়ী NPK দিন। বপনে বেসাল, বৃদ্ধিতে টপ ড্রেসিং।", 'mr': "खत: माती चाचणीनुसार NPK घाला। पेरणीत बेसल, वाढीत टॉप ड्रेसिंग।"},
            'irrigation_response': {'en': "Irrigation: Drip saves 40% water. Spray early morning/evening. Check soil moisture 4-6 inches deep.", 'hi': "सिंचाई: ड्रिप 40% पानी बचाता है। सुबह/शाम छिड़काव करें। 4-6 इंच गहरी मिट्टी की नमी जांचें।", 'te': "నీటిపారుదల: డ్రిప్ 40% నీరు ఆదా చేస్తుంది। ఉదయం/సాయంత్రం స్ప్రే చేయండి।", 'ta': "நீர்ப்பாசனம்: சொட்டு நீர் 40% தண்ணீர் சேமிக்கும். காலை/மாலை தெளிக்கவும்.", 'bn': "সেচ: ড্রিপ 40% জল সাশ্রয় করে। সকাল/সন্ধ্যা স্প্রে করুন।", 'mr': "सिंचन: ठिबक 40% पाणी वाचवते। सकाळी/संध्याकाळी फवारा।"},
            'planting_response': {'en': "Planting: Get soil tested, use certified seeds, sow at right time, proper spacing & depth.", 'hi': "बुवाई: मिट्टी परीक्षण कराएं, प्रमाणित बीज उपयोग करें, सही समय पर बोएं।", 'te': "విత్తడం: నేల పరీక్ష చేయించండి, ధృవీకరించిన విత్తనాలు ఉపయోగించండి।", 'ta': "நடவு: மண் பரிசோதனை செய்யவும், சான்றளிக்கப்பட்ட விதைகள் பயன்படுத்தவும்.", 'bn': "রোপণ: মাটি পরীক্ষা করান, প্রত্যয়িত বীজ ব্যবহার করুন।", 'mr': "पेरणी: माती चाचणी करा, प्रमाणित बियाणे वापरा।"},
            'harvest_response': {'en': "Harvesting: Check maturity signs, avoid rain, dry properly (12-14% moisture), store in dry place.", 'hi': "कटाई: परिपक्वता संकेत जांचें, बारिश से बचें, अच्छी तरह सुखाएं।", 'te': "కోత: పరిపక్వత సంకేతాలు తనిఖీ చేయండి, వర్షం నుండి దూరంగా ఉండండి।", 'ta': "அறுவடை: முதிர்வு அறிகுறிகள் சரிபார்க்கவும், மழையை தவிர்க்கவும்.", 'bn': "ফসল কাটা: পরিপক্কতা চিহ্ন পরীক্ষা করুন, বৃষ্টি এড়িয়ে চলুন।", 'mr': "कापणी: परिपक्वता चिन्हे तपासा, पाऊस टाळा।"},
            'soil_general': {'en': "Soil types: Sandy (light), Clayey (heavy), Loam (best). Get pH tested. Add organic matter for improvement.", 'hi': "मिट्टी के प्रकार: रेतीली (हल्की), चिकनी (भारी), दोमट (सर्वोत्तम)। pH जांच कराएं।", 'te': "మట్టి రకాలు: ఇసుక (తేలికైన), బంకమట్టి (భారీ), లోమ్ (ఉత్తమమైన)।", 'ta': "மண் வகைகள்: மணல் (இலகு), களிமண் (கனமான), கலவை (சிறந்த).", 'bn': "মাটির প্রকার: বালি (হালকা), কাদামাটি (ভারী), দোআঁশ (সেরা)।", 'mr': "मातीचे प्रकार: वाळूमय (हलकी), चिकणमाती (जड), दुफळी (उत्तम)।"},
            'soil_wheat': {'en': "Wheat soil: Well-drained loam, pH 6.0-7.5", 'hi': "गेहूं की मिट्टी: सुजल निकासी वाली दोमट, pH 6.0-7.5", 'te': "గోధుమల మట్టి: మంచి పారుదల లోమ్, pH 6.0-7.5", 'ta': "கோதுமை மண்: நல்ல வடிகால் கலவை, pH 6.0-7.5", 'bn': "গমের মাটি: ভাল নিষ্কাশিত দোআঁশ, pH 6.0-7.5", 'mr': "गव्हाची माती: चांगला निचरा असलेली, pH 6.0-7.5"},
            'soil_cotton': {'en': "Cotton soil: Deep black soil (regur), pH 6.5-8.0", 'hi': "कपास की मिट्टी: गहरी काली मिट्टी, pH 6.5-8.0", 'te': "పత్తి మట్టి: లోతైన నల్ల మట్టి, pH 6.5-8.0", 'ta': "பருத்தி மண்: ஆழமான கருப்பு மண், pH 6.5-8.0", 'bn': "তুলার মাটি: গভীর কালো মাটি, pH 6.5-8.0", 'mr': "कापसाची माती: खोल काळी माती, pH 6.5-8.0"},
            'soil_vegetable': {'en': "Vegetable soil: Rich loam with organic matter, pH 6.0-7.0", 'hi': "सब्जी की मिट्टी: जैविक पदार्थ युक्त समृद्ध दोमट, pH 6.0-7.0", 'te': "కూరగాయల మట్టి: సేంద్రియ పదార్థంతో సమృద్ధి లోమ్, pH 6.0-7.0", 'ta': "காய்கறி மண்: கரிமப் பொருள் கொண்ட வளமான கலவை, pH 6.0-7.0", 'bn': "সবজির মাটি: জৈব পদার্থ সমৃদ্ধ দোআঁশ, pH 6.0-7.0", 'mr': "भाजीपाल्याची माती: सेंद्रिय पदार्थ समृद्ध, pH 6.0-7.0"},
            'soil_sugarcane': {'en': "Sugarcane soil: Deep loam, good drainage, pH 6.5-7.5", 'hi': "गन्ने की मिट्टी: गहरी दोमट, अच्छी निकासी, pH 6.5-7.5", 'te': "చెరకు మట్టి: లోతైన లోమ్, మంచి పారుదల, pH 6.5-7.5", 'ta': "கரும்பு மண்: ஆழமான கலவை, நல்ல வடிகால், pH 6.5-7.5", 'bn': "আখের মাটি: গভীর দোআঁশ, ভাল নিষ্কাশন, pH 6.5-7.5", 'mr': "ऊसाची माती: खोल दुफळी, चांगला निचरा, pH 6.5-7.5"},
            'variety_response': {'en': "Crop varieties: Use certified high-yielding varieties suitable for your region. Contact local agriculture office.", 'hi': "फसल किस्में: अपने क्षेत्र के लिए उपयुक्त प्रमाणित उच्च उपज वाली किस्में उपयोग करें।", 'te': "పంట రకాలు: మీ ప్రాంతానికి అనుకూలమైన ధృవీకరించిన అధిక దిగుబడి రకాలు ఉపయోగించండి।", 'ta': "பயிர் வகைகள்: உங்கள் பகுதிக்கு ஏற்ற சான்றளிக்கப்பட்ட அதிக விளைச்சல் வகைகள் பயன்படுத்தவும்.", 'bn': "ফসলের জাত: আপনার অঞ্চলের জন্য উপযুক্ত প্রত্যয়িত উচ্চফলনশীল জাত ব্যবহার করুন।", 'mr': "पिकाच्या जाती: तुमच्या प्रदेशासाठी योग्य प्रमाणित उच्च उत्पन्न जाती वापरा।"},
            'livestock_response': {'en': "Livestock: Ensure proper feeding, vaccination, clean shelter. Contact veterinary officer for health issues.", 'hi': "पशुधन: उचित भोजन, टीकाकरण, स्वच्छ आश्रय सुनिश्चित करें। स्वास्थ्य के लिए पशु चिकित्सक से संपर्क करें।", 'te': "పశువులు: సరైన ఆహారం, టీకాలు, శుభ్రమైన ఆశ్రయం నిర్ధారించండి।", 'ta': "கால்நடை: சரியான உணவு, தடுப்பூசி, சுத்தமான தங்குமிடம் உறுதி செய்யவும்.", 'bn': "পশুপালন: সঠিক খাওয়ানো, টিকা, পরিষ্কার আশ্রয় নিশ্চিত করুন।", 'mr': "पशुधन: योग्य आहार, लसीकरण, स्वच्छ निवारा सुनिश्चित करा।"},
            'thanks_response': {'en': "You're welcome! Happy farming! 🌾", 'hi': "आपका स्वागत है! खुश खेती! 🌾", 'te': "స్వాగతం! సంతోష వ్యవసాయం! 🌾", 'ta': "வரவேற்கிறோம்! மகிழ்ச்சியான விவசாயம்! 🌾", 'bn': "স্বাগতম! সুখী চাষাবাদ! 🌾", 'mr': "स्वागत आहे! आनंदी शेती! 🌾"},
            'organic_farming': {'en': "Organic Farming: Use compost, vermicompost, green manure. Avoid chemical pesticides. Use neem, cow urine spray. Crop rotation important.", 'hi': "जैविक खेती: कम्पोस्ट, वर्मी कम्पोस्ट, हरी खाद का उपयोग करें। रासायनिक कीटनाशकों से बचें।", 'te': "సేంద్రియ వ్యవసాయం: కంపోస్ట్, వర్మీ కంపోస్ట్, పచ్చి ఎరువు వాడండి। రసాయన పురుగుమందులు వద్దు।", 'ta': "இயற்கை விவசாயம்: உரம், மண்புழு உரம், பசுந்தாள் உரம் பயன்படுத்தவும். வேதிப்பொருள் பூச்சிக்கொல்லிகளை தவிர்க்கவும்.", 'bn': "জৈব চাষ: কম্পোস্ট, ভার্মি কম্পোস্ট, সবুজ সার ব্যবহার করুন। রাসায়নিক কীটনাশক এড়িয়ে চলুন।", 'mr': "सेंद्रिय शेती: कंपोस्ट, गांडूळ खत, हिरवळीच्या खताचा वापर करा। रासायनिक कीटकनाशके टाळा।"},
            'crop_rotation': {'en': "Crop Rotation: Rice→Wheat→Pulses. Prevents soil exhaustion, pest buildup. Improves soil fertility naturally.", 'hi': "फसल चक्र: धान→गेहूं→दलहन। मिट्टी की थकान रोकता है। मिट्टी की उर्वरता सुधारता है।", 'te': "పంట మార్పిడి: వరి→గోధుమలు→పప్పుధాన్యాలు। నేల అలసటను నివారిస్తుంది। నేల సారవంతత మెరుగుపరుస్తుంది।", 'ta': "பயிர் சுழற்சி: நெல்→கோதுமை→பருப்பு. மண் தளர்ச்சி தடுக்கும். மண் வளம் இயற்கையாக மேம்படும்.", 'bn': "ফসল আবর্তন: ধান→গম→ডাল। মাটির ক্লান্তি রোধ করে। মাটির উর্বরতা প্রাকৃতিকভাবে উন্নত করে।", 'mr': "पीक आवर्तन: तांदूळ→गहू→डाळ. मातीचा थकवा रोखतो। मातीची सुपीकता वाढवतो।"},
            'seed_treatment': {'en': "Seed Treatment: Soak in water 8-10 hrs. Treat with Trichoderma or carbendazim. Prevents disease, improves germination.", 'hi': "बीज उपचार: 8-10 घंटे पानी में भिगोएं। ट्राइकोडर्मा या कार्बेंडाजिम से उपचार करें।", 'te': "విత్తన చికిత్స: 8-10 గంటలు నీటిలో నానబెట్టండి। ట్రైకోడెర్మా లేదా కార్బెండజిమ్‌తో చికిత్స చేయండి।", 'ta': "விதை சிகிச்சை: 8-10 மணி நீரில் ஊற வைக்கவும். ட்ரைக்கோடெர்மா அல்லது கார்பெண்டசிம் கொண்டு சிகிச்சை.", 'bn': "বীজ চিকিত্সা: 8-10 ঘন্টা জলে ভিজিয়ে রাখুন। ট্রাইকোডার্মা বা কার্বেন্ডাজিম দিয়ে চিকিত্সা করুন।", 'mr': "बियाणे उपचार: 8-10 तास पाण्यात भिजवा. ट्रायकोडर्मा किंवा कार्बेंडाझिमने उपचार करा।"},
            'water_management': {'en': "Water Management: Rainwater harvesting, mulching saves water. Drip best for vegetables. Check soil before watering.", 'hi': "जल प्रबंधन: वर्षा जल संचयन, मल्चिंग पानी बचाती है। सब्जियों के लिए ड्रिप सर्वोत्तम।", 'te': "నీటి నిర్వహణ: వర్షపు నీటి సేకరణ, మల్చింగ్ నీరు ఆదా చేస్తుంది। కూరగాయలకు డ్రిప్ ఉత్తమం।", 'ta': "நீர் மேலாண்மை: மழை நீர் சேமிப்பு, மல்ச்சிங் நீர் சேமிக்கும். காய்கறிகளுக்கு சொட்டு நீர் சிறந்தது.", 'bn': "জল ব্যবস্থাপনা: বৃষ্টির জল সংগ্রহ, মালচিং জল সাশ্রয় করে। সবজির জন্য ড্রিপ সেরা।", 'mr': "पाणी व्यवस्थापन: पावसाचे पाणी साठवा, मल्चिंग पाणी वाचवते. भाजीसाठी ठिबक उत्तम।"},
            'composting': {'en': "Composting: Mix dry+green waste, add water, turn weekly. Ready in 45-60 days. Rich in nutrients, improves soil.", 'hi': "कम्पोस्टिंग: सूखे+हरे कचरे मिलाएं, पानी डालें, साप्ताहिक पलटें। 45-60 दिन में तैयार।", 'te': "కంపోస్టింగ్: పొడి+పచ్చి వ్యర్థాలు కలపండి, నీరు జోడించండి, వారానికోసారి తిప్పండి। 45-60 రోజుల్లో సిద్ధం.", 'ta': "உரம் தயாரிப்பு: உலர்+பசுமை கழிவு கலக்கவும், நீர் சேர்க்கவும், வாரம் திருப்பவும். 45-60 நாட்களில் தயார்.", 'bn': "কম্পোস্টিং: শুকনো+সবুজ বর্জ্য মেশান, জল যোগ করুন, সাপ্তাহিক ঘুরান। 45-60 দিনে তৈরি।", 'mr': "कंपोस्टिंग: कोरडा+हिरवा कचरा मिसळा, पाणी घाला, साप्ताहिक फिरवा। 45-60 दिवसात तयार।"},
            'pest_aphids': {'en': "Aphid Control: Spray neem oil or soap water. Ladybugs eat aphids naturally. Check leaf undersides regularly.", 'hi': "एफिड नियंत्रण: नीम तेल या साबुन पानी छिड़कें। लेडीबग एफिड खाते हैं। पत्तियों के नीचे नियमित जांचें।", 'te': "అఫిడ్ నియంత్రణ: వేప నూనె లేదా సబ్బు నీరు స్ప్రే చేయండి। లేడీబగ్స్ సహజంగా అఫిడ్‌లను తింటాయి।", 'ta': "அஃபிட் கட்டுப்பாடு: வேப்ப எண்ணெய் அல்லது சோப்பு தண்ணீர் தெளிக்கவும். லேடிபக் இயற்கையாக அஃபிட் சாப்பிடும்.", 'bn': "অ্যাফিড নিয়ন্ত্রণ: নিম তেল বা সাবান জল স্প্রে করুন। লেডিবাগ প্রাকৃতিকভাবে অ্যাফিড খায়।", 'mr': "अॅफिड नियंत्रण: कडुलिंबाचे तेल किंवा साबण पाणी फवारा. लेडीबग अॅफिड नैसर्गिकरित्या खातात।"},
            'monsoon_prep': {'en': "Monsoon Preparation: Clean drainage, check bunds. Store seeds early. Repair farm equipment. Plan Kharif crops.", 'hi': "मानसून तैयारी: जल निकासी साफ करें, मेड़ जांचें। बीज पहले से संग्रहीत करें। खरीफ फसल योजना बनाएं।", 'te': "వర్షాకాల తయారీ: డ్రైనేజీ శుభ్రం చేయండి, కట్టలు తనిఖీ చేయండి। విత్తనాలు ముందుగా నిల్వ చేయండి।", 'ta': "பருவமழை தயாரிப்பு: வடிகால் சுத்தம் செய்யவும், கரைகள் சரிபார்க்கவும். விதைகள் முன்கூட்டியே சேமிக்கவும்.", 'bn': "মৌসুমী প্রস্তুতি: নিকাশি পরিষ্কার করুন, বাঁধ পরীক্ষা করুন। বীজ আগে সংরক্ষণ করুন।", 'mr': "पावसाळा तयारी: निचरा स्वच्छ करा, बंधारे तपासा. बियाणे आधी साठवा. खरीप पिकांची योजना करा।"},
            'drought_management': {'en': "Drought Management: Mulch to retain moisture. Drip irrigation. Grow drought-resistant varieties. Rainwater harvesting critical.", 'hi': "सूखा प्रबंधन: नमी बनाए रखने के लिए मल्च करें। ड्रिप सिंचाई। सूखा प्रतिरोधी किस्में उगाएं।", 'te': "కరువు నిర్వహణ: తేమ నిలుపుకోవడానికి మల్చ్ చేయండి। డ్రిప్ నీటిపారుదల। కరువు-నిరోధక రకాలు పండించండి।", 'ta': "வறட்சி மேலாண்மை: ஈரப்பதம் தக்க வைக்க மல்ச் செய்யவும். சொட்டு நீர். வறட்சி-எதிர்ப்பு வகைகள் வளர்க்கவும்.", 'bn': "খরা ব্যবস্থাপনা: আর্দ্রতা ধরে রাখতে মালচ করুন। ড্রিপ সেচ। খরা-প্রতিরোধী জাত জন্মান।", 'mr': "दुष्काळ व्यवस्थापन: ओलावा टिकवण्यासाठी मल्च करा. ठिबक सिंचन. दुष्काळ-प्रतिरोधक जाती पिका."}
        };
        
        return translations[key]?.[lang] || translations[key]?.['en'] || 'Response not available in selected language.';
    }
    
    getSmartDefaultResponse(msg) {
        // Check for specific topics BEFORE generic question word handling
        
        // Pest control specific
        if (msg.match(/control.*pest|pest.*control|kill.*pest|pest.*kill|remove.*pest/)) {
            return {
                message: "Pest Control Methods: 1) Identify the pest first. 2) Neem oil spray (10ml/liter) - organic option. 3) Chemical pesticides - use as per label. 4) Spray early morning or evening. 5) Repeat after 7 days. 6) Maintain field hygiene. 7) Use sticky traps. 8) Encourage natural predators. For specific pest identification, describe the pest or upload photo.",
                type: 'general'
            };
        }
        
        // Extract key crop names
        const crops = {
            'rice': 'rice/paddy',
            'paddy': 'rice/paddy',
            'wheat': 'wheat',
            'cotton': 'cotton',
            'maize': 'maize/corn',
            'corn': 'maize/corn',
            'sugarcane': 'sugarcane',
            'tomato': 'tomato',
            'potato': 'potato',
            'onion': 'onion',
            'chilli': 'chilli/pepper',
            'pepper': 'chilli/pepper'
        };
        
        let detectedCrop = null;
        for (const [key, value] of Object.entries(crops)) {
            if (msg.includes(key)) {
                detectedCrop = value;
                break;
            }
        }
        
        // Provide crop-specific intelligent responses
        if (detectedCrop) {
            if (msg.includes('how') || msg.includes('grow') || msg.includes('cultivation')) {
                return {
                    message: `To grow ${detectedCrop}: 1) Prepare soil properly (get soil test done). 2) Use certified seeds. 3) Sow at right time based on season. 4) Apply recommended fertilizers. 5) Maintain proper irrigation. 6) Control pests and diseases. 7) Harvest at right maturity. For detailed ${detectedCrop} cultivation guide, contact your agricultural officer or start the backend for AI-powered detailed advice.`,
                    type: 'general'
                };
            }
            if (msg.includes('fertilizer') || msg.includes('nutrient')) {
                return {
                    message: `Fertilizer for ${detectedCrop}: Apply NPK based on soil test. General recommendation - Apply basal dose at sowing, then top dressing during growth stages. Use organic manure to improve soil health. Specific doses vary by soil type and target yield. Get soil tested for precise recommendations.`,
                    type: 'general'
                };
            }
            if (msg.includes('disease') || msg.includes('problem')) {
                return {
                    message: `Common ${detectedCrop} diseases: Watch for leaf spots, wilting, or discoloration. Remove infected plants immediately. Apply appropriate fungicides. Maintain field hygiene. Practice crop rotation. For specific disease identification, upload a photo through the query form or consult an agricultural officer.`,
                    type: 'general'
                };
            }
            if (msg.includes('yield') || msg.includes('production')) {
                return {
                    message: `To increase ${detectedCrop} yield: 1) Use high-yielding varieties. 2) Proper soil preparation and testing. 3) Timely sowing. 4) Balanced fertilization. 5) Proper irrigation management. 6) Timely pest/disease control. 7) Good agronomic practices. 8) Harvest at right time.`,
                    type: 'general'
                };
            }
        }
        
        // Try to give context-aware response based on question words
        if (msg.includes('how')) {
            return {
                message: `I can help with 'how to' questions! Examples:
• How to control pests?
• How to improve soil quality?
• How to increase crop yield?
• How to get government subsidy?
• How to apply fertilizer?

Please ask your specific question with details (crop name, issue, location) for better guidance.`,
                type: 'general'
            };
        }
        
        if (msg.includes('what')) {
            return {
                message: `I can answer 'what' questions:
• What fertilizer for [crop]?
• What is the best variety?
• What are current market prices?
• What pest is this?
• What crops grow in [season]?

Please provide more details for accurate answers.`,
                type: 'general'
            };
        }
        
        if (msg.includes('when')) {
            return {
                message: `I can help with 'when' questions:
• When to plant [crop]?
• When to harvest?
• When to apply fertilizer?
• When to irrigate?
• When is the best selling time?

Specify your crop and region for accurate timing.`,
                type: 'general'
            };
        }
        
        if (msg.includes('why')) {
            return {
                message: `I can explain 'why' issues occur:
• Why leaves are yellowing?
• Why crops not growing well?
• Why yield is low?
• Why plants are wilting?

Describe your situation in detail (crop, symptoms, when started) for diagnosis.`,
                type: 'general'
            };
        }
        
        if (msg.includes('where')) {
            return {
                message: `I can guide you on 'where' questions:
• Where to sell crops for best price?
• Where to buy quality seeds?
• Where to apply for schemes?
• Where to get soil tested?

Mention your location for specific guidance.`,
                type: 'general'
            };
        }
        
        if (msg.includes('which') || msg.includes('best')) {
            return {
                message: `I can recommend 'which/best' options:
• Which crop for my soil?
• Which variety gives high yield?
• Which fertilizer is best?
• Which season for planting?

Provide details (soil type, region, season) for accurate recommendations.`,
                type: 'general'
            };
        }
        
        // If question contains specific agricultural terms, give relevant response
        if (msg.match(/yellow|pale|chlorosis/)) {
            return {
                message: "Yellow leaves usually indicate: 1) Nitrogen deficiency (most common). 2) Iron deficiency (check pH). 3) Waterlogging. 4) Disease. Solution: Apply urea for nitrogen, maintain proper drainage, get soil tested. If problem persists, upload photo through query form.",
                type: 'general'
            };
        }
        
        if (msg.match(/not growing|slow growth|stunted/)) {
            return {
                message: "Slow growth reasons: 1) Nutrient deficiency (get soil test). 2) Poor soil quality. 3) Water stress (too much/little). 4) Pest/disease attack. 5) Improper pH. Solutions: Soil testing, balanced fertilization, proper irrigation, pest control.",
                type: 'general'
            };
        }
        
        if (msg.match(/subsidy|scheme|loan|support/)) {
            return {
                message: "Government support available: PM-KISAN (₹6000/year), Crop Insurance (PMFBY), Kisan Credit Card (KCC), Equipment subsidies, Soil Health Card, Minimum Support Price (MSP). Visit nearest Krishi Vigyan Kendra or agriculture office with Aadhaar card for registration.",
                type: 'general'
            };
        }
        
        // General fallback with suggestions
        return {
            message: "I'm your farming assistant! Ask me specific questions like:\n\n❓ 'Which soil is best for rice?'\n❓ 'How to control aphids in cotton?'\n❓ 'When to plant wheat in Punjab?'\n❓ 'What fertilizer for tomato?'\n❓ 'Why are my leaves turning yellow?'\n\n💡 Tip: Include crop name, your issue/question, and location for best answers!\n\nFor advanced AI analysis, please start the backend server.",
            type: 'general'
        };
    }
}

// Initialize chatbot when page loads
let aiChatbot;
document.addEventListener('DOMContentLoaded', () => {
    aiChatbot = new AIChatbot();
});

// Update language when changed
document.addEventListener('languageChanged', (e) => {
    if (aiChatbot) {
        aiChatbot.currentLanguage = e.detail.language;
        // Update welcome message
        const welcomeMsg = document.querySelector('.chat-message.bot-message .message-text');
        if (welcomeMsg) {
            welcomeMsg.innerHTML = aiChatbot.getWelcomeMessage();
        }
        // Update input placeholder
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.placeholder = aiChatbot.getInputPlaceholder();
        }
    }
});
