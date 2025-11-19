// weather.js - Weather component for FarmaSathi
class WeatherWidget {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.apiKey = ''; // Will be set by user
        this.currentCity = '';
        this.init();
    }
    
    init() {
        if (!this.container) return;
        
        this.render();
        this.bindEvents();
        this.detectLocation();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="weather-card">
                <div class="weather-header">
                    <h3>🌤️ Weather Forecast</h3>
                    <div class="weather-search">
                        <input type="text" id="cityInput" placeholder="Enter city name" />
                        <button id="searchWeatherBtn">Search</button>
                    </div>
                </div>
                <div id="weatherContent">
                    <div class="weather-loading">Detecting your location...</div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const searchBtn = document.getElementById('searchWeatherBtn');
        const cityInput = document.getElementById('cityInput');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const city = cityInput.value.trim();
                if (city) {
                    this.fetchWeather(city);
                }
            });
        }
        
        if (cityInput) {
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const city = cityInput.value.trim();
                    if (city) {
                        this.fetchWeather(city);
                    }
                }
            });
        }
    }
    
    detectLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.fetchWeatherByCoords(latitude, longitude);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Default to a major city if location detection fails
                    this.fetchWeather('Hyderabad');
                }
            );
        } else {
            // Fallback if geolocation is not supported
            this.fetchWeather('Hyderabad');
        }
    }
    
    async fetchWeatherByCoords(lat, lon) {
        if (!this.apiKey) {
            this.showError('Please enter your OpenWeatherMap API key');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            
            const data = await response.json();
            this.displayWeather(data);
        } catch (error) {
            console.error('Weather API error:', error);
            this.showError('Failed to fetch weather data');
        }
    }
    
    async fetchWeather(city) {
        if (!this.apiKey) {
            this.showError('Please enter your OpenWeatherMap API key');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('City not found');
                } else {
                    throw new Error('Weather data not available');
                }
            }
            
            const data = await response.json();
            this.displayWeather(data);
        } catch (error) {
            console.error('Weather API error:', error);
            this.showError(error.message || 'Failed to fetch weather data');
        }
    }
    
    displayWeather(data) {
        const weatherContent = document.getElementById('weatherContent');
        if (!weatherContent) return;
        
        this.currentCity = data.name;
        
        weatherContent.innerHTML = `
            <div class="weather-info">
                <div class="weather-main">
                    <div class="weather-city">${data.name}, ${data.sys.country}</div>
                    <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
                    <div class="weather-desc">${data.weather[0].description}</div>
                </div>
                <div class="weather-details">
                    <div class="weather-humidity">💧 Humidity: ${data.main.humidity}%</div>
                    <div class="weather-pressure">🌡️ Pressure: ${data.main.pressure} hPa</div>
                    <div class="weather-wind">💨 Wind: ${data.wind.speed} m/s</div>
                </div>
                <div class="weather-advice">
                    ${this.getAgriculturalAdvice(data.weather[0].main, data.main.temp)}
                </div>
            </div>
        `;
    }
    
    showLoading() {
        const weatherContent = document.getElementById('weatherContent');
        if (weatherContent) {
            weatherContent.innerHTML = '<div class="weather-loading">Fetching weather data...</div>';
        }
    }
    
    showError(message) {
        const weatherContent = document.getElementById('weatherContent');
        if (weatherContent) {
            weatherContent.innerHTML = `
                <div class="weather-error">
                    <div>❌ ${message}</div>
                    <div class="api-key-prompt">
                        <input type="text" id="apiKeyInput" placeholder="Enter OpenWeatherMap API Key" />
                        <button id="setApiKeyBtn">Set Key</button>
                    </div>
                </div>
            `;
            
            // Bind events for API key input
            const setApiKeyBtn = document.getElementById('setApiKeyBtn');
            const apiKeyInput = document.getElementById('apiKeyInput');
            
            if (setApiKeyBtn && apiKeyInput) {
                setApiKeyBtn.addEventListener('click', () => {
                    this.apiKey = apiKeyInput.value.trim();
                    if (this.apiKey && this.currentCity) {
                        this.fetchWeather(this.currentCity);
                    }
                });
            }
        }
    }
    
    getAgriculturalAdvice(weatherMain, temperature) {
        let advice = '';
        
        if (temperature < 10) {
            advice = '🥶 Cold weather: Protect sensitive crops from frost.';
        } else if (temperature > 35) {
            advice = '🔥 Hot weather: Increase irrigation and protect crops from heat stress.';
        } else {
            advice = '✅ Weather is favorable for most agricultural activities.';
        }
        
        if (weatherMain.includes('Rain')) {
            advice += ' 🌧️ Rain expected: Ensure proper drainage to prevent waterlogging.';
        } else if (weatherMain.includes('Clear')) {
            advice += ' ☀️ Clear skies: Good conditions for spraying pesticides/herbicides.';
        } else if (weatherMain.includes('Cloud')) {
            advice += ' ☁️ Cloudy: Moderate conditions, monitor crops for moisture-related issues.';
        }
        
        return advice;
    }
    
    setApiKey(key) {
        this.apiKey = key;
        if (this.currentCity) {
            this.fetchWeather(this.currentCity);
        }
    }
}

// Initialize weather widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Weather widget will be initialized in the page where it's needed
});

// Export for global use
window.WeatherWidget = WeatherWidget;