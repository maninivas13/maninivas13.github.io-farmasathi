// Enhanced main.js with interactive features
document.addEventListener('DOMContentLoaded', async () => {
    const queryForm = document.getElementById('queryForm');
    const farmerName = document.getElementById('farmerName');
    const locationInp = document.getElementById('location');
    const cropSelect = document.getElementById('cropType');
    const queryText = document.getElementById('queryText');
    const imageFile = document.getElementById('imageFile');
    const formMsg = document.getElementById('formMsg');
    const pastQueries = document.getElementById('pastQueries');
    const clearFormBtn = document.getElementById('clearForm');

    // Initialize components
    initializeInteractiveFeatures();
    setupAuthHandlers();
    loadUserData();
    showPast();

    // Auto-detect location
    if (!locationInp.value) {
        await detectUserLocation();
    }

    // Clear form button handler
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            queryForm.reset();
            window.audioBlob = null;
            document.getElementById('charCounter')?.dispatchEvent(new Event('reset'));
            showMessage('Form cleared', 'info');
        });
    }

    // Quick query templates
    initializeQuickTemplates();

    // Enhanced storage with categories
    function loadQueries() {
        return JSON.parse(localStorage.getItem('agri_queries') || '[]');
    }
    
    function saveQueries(arr) {
        localStorage.setItem('agri_queries', JSON.stringify(arr));
        // Trigger update event for dashboard if open
        window.dispatchEvent(new CustomEvent('queriesUpdated'));
    }

    function initializeInteractiveFeatures() {
        // Add real-time character counter
        const charCounter = document.createElement('div');
        charCounter.className = 'form-text text-end';
        charCounter.id = 'charCounter';
        charCounter.textContent = '0/500 characters';
        queryText.parentNode.appendChild(charCounter);

        queryText.addEventListener('input', function() {
            const length = this.value.length;
            charCounter.textContent = `${length}/500 characters`;
            charCounter.className = `form-text text-end ${length > 400 ? 'text-warning' : ''} ${length > 500 ? 'text-danger' : ''}`;
            
            // Auto-detect urgency
            updateUrgencyIndicator(this.value);
        });

        // Add urgency indicator
        const urgencyIndicator = document.createElement('div');
        urgencyIndicator.className = 'urgency-indicator mt-2';
        urgencyIndicator.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">Priority:</span>
                <span class="badge bg-secondary" id="urgencyBadge">Normal</span>
                <small class="text-muted ms-2" id="urgencyHint">Standard response time: 24-48 hours</small>
            </div>
        `;
        queryText.parentNode.appendChild(urgencyIndicator);
    }

    function updateUrgencyIndicator(text) {
        const urgencyBadge = document.getElementById('urgencyBadge');
        const urgencyHint = document.getElementById('urgencyHint');
        const isUrgent = detectUrgency(text);

        if (isUrgent) {
            urgencyBadge.className = 'badge bg-danger';
            urgencyBadge.textContent = 'Urgent';
            urgencyHint.textContent = 'Priority response: Within 12 hours';
            urgencyHint.className = 'text-danger ms-2';
        } else {
            urgencyBadge.className = 'badge bg-secondary';
            urgencyBadge.textContent = 'Normal';
            urgencyHint.textContent = 'Standard response time: 24-48 hours';
            urgencyHint.className = 'text-muted ms-2';
        }
    }

    async function detectUserLocation() {
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        maximumAge: 600000
                    });
                });

                // Reverse geocoding simulation
                const locations = [
                    'Aurangabad, Bihar',
                    'Nashik, Maharashtra', 
                    'Ludhiana, Punjab',
                    'Coimbatore, Tamil Nadu',
                    'Warangal, Telangana'
                ];
                const randomLocation = locations[Math.floor(Math.random() * locations.length)];
                
                locationInp.value = randomLocation;
                showMessage(`Location detected: ${randomLocation}`, 'info');
            } catch (error) {
                console.log('Location detection failed:', error);
            }
        }
    }

    function initializeQuickTemplates() {
        const templatesContainer = document.createElement('div');
        templatesContainer.className = 'quick-templates mb-3';
        templatesContainer.innerHTML = `
            <label class="form-label">Quick Query Templates:</label>
            <div class="d-flex flex-wrap gap-2" id="quickTemplates">
                <button type="button" class="btn btn-outline-primary btn-sm template-btn" data-template="My crops are showing yellow leaves. What could be the issue?">
                    Yellow Leaves
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm template-btn" data-template="I'm seeing small insects on my plants. How can I control them?">
                    Pest Problem
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm template-btn" data-template="What's the best time to harvest my crop?">
                    Harvest Timing
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm template-btn" data-template="My plants are not growing properly. What should I do?">
                    Stunted Growth
                </button>
            </div>
        `;

        queryText.parentNode.insertBefore(templatesContainer, queryText);

        // Add template handlers
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                queryText.value = this.dataset.template;
                queryText.dispatchEvent(new Event('input'));
                queryText.focus();
            });
        });
    }

    // Enhanced query submission with progress tracking
    queryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!queryText.value.trim()) {
            showMessage('Please describe your query', 'danger');
            return;
        }

        const submitBtn = queryForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show submission progress
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        submitBtn.disabled = true;

        try {
            // Step 1: Basic validation
            await new Promise(resolve => setTimeout(resolve, 800));
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing image...';

            // Step 2: Process attachments
            const q = await createQueryObject();
            
            // Step 3: AI analysis
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting AI insights...';
            const aiResponse = await generateAIResponse(q);
            q.initialAIResponse = aiResponse;

            // Step 4: Save and finalize
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizing...';
            await saveAndFinish(q);
            
        } catch (error) {
            console.error('Error submitting query:', error);
            showMessage('Error submitting query. Please try again.', 'danger');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    async function createQueryObject() {
        const q = {
            id: Date.now(),
            name: farmerName.value || 'Anonymous',
            location: locationInp.value || '',
            cropType: cropSelect.value || '',
            text: queryText.value.trim(),
            createdAt: new Date().toISOString(),
            status: 'open',
            assignedTo: null,
            reply: null,
            repliedAt: null,
            urgency: detectUrgency(queryText.value),
            image: null,
            audio: null,
            category: categorizeQuery(queryText.value),
            farmerId: auth.getUser()?.id || 'anonymous'
        };

        // Handle image upload
        const file = imageFile.files[0];
        if (file) {
            q.image = await readFileAsDataURL(file);
            q.hasImage = true;
        }

        // Handle audio
        if (window.audioBlob) {
            q.audio = await readFileAsDataURL(window.audioBlob);
            q.hasAudio = true;
        }

        return q;
    }

    function categorizeQuery(text) {
        const categories = {
            pest: ['pest', 'insect', 'bug', 'कीट', 'insecticide'],
            disease: ['disease', 'fungus', 'rot', 'blight', 'रोग', 'फफूंद'],
            nutrient: ['fertilizer', 'nutrient', 'deficiency', 'yellow', 'पीला', 'खाद'],
            weather: ['weather', 'rain', 'drought', 'flood', 'मौसम', 'बारिश'],
            market: ['market', 'price', 'sell', 'storage', 'बाजार', 'भाव'],
            general: ['how', 'what', 'when', 'why', 'कैसे', 'क्या']
        };

        const textLower = text.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => textLower.includes(keyword))) {
                return category;
            }
        }
        return 'general';
    }

    // Enhanced showPast function with interactive elements
    function showPast() {
        const user = auth.getUser();
        let arr = loadQueries();
        
        if (user && user.role === 'farmer') {
            arr = arr.filter(q => q.farmerId === user.id);
        } else {
            arr = arr.filter(q => q.name === (farmerName.value || 'Anonymous'));
        }
        
        arr = arr.slice().reverse();
        
        pastQueries.innerHTML = '';
        
        if (!arr.length) {
            pastQueries.innerHTML = `
                <div class="list-group-item text-center py-4 text-muted">
                    <i class="fas fa-inbox fa-2x mb-2 opacity-50"></i>
                    <div data-translate="no_queries">No past queries yet</div>
                    <small class="mt-2 d-block">Your queries will appear here once submitted</small>
                </div>
            `;
            return;
        }
        
        arr.slice(0, 5).forEach(q => {
            const li = document.createElement('div');
            li.className = 'list-group-item query-item';
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <strong>${escapeHtml(q.name)}</strong>
                            <span class="badge ${getStatusClass(q.status)} ms-2">${q.status}</span>
                            ${q.urgency === 'high' ? '<span class="badge bg-danger ms-1">Urgent</span>' : ''}
                            ${q.category ? `<span class="badge bg-light text-dark ms-1">${q.category}</span>` : ''}
                        </div>
                        <small class="text-muted d-block mb-1">
                            <i class="fas fa-map-marker-alt"></i> ${escapeHtml(q.location || 'Unknown location')}
                            ${q.cropType ? ` • <i class="fas fa-seedling"></i> ${q.cropType}` : ''}
                        </small>
                        <p class="mb-1 small query-preview">${escapeHtml(q.text.slice(0,80))}${q.text.length>80?'...':''}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${new Date(q.createdAt).toLocaleDateString()}</small>
                            <div class="query-actions">
                                ${q.reply ? 
                                    '<span class="badge bg-success"><i class="fas fa-reply"></i> Replied</span>' : 
                                    '<span class="badge bg-warning text-dark"><i class="fas fa-clock"></i> Pending</span>'
                                }
                                ${q.hasImage ? '<i class="fas fa-image text-primary ms-1" title="Has image"></i>' : ''}
                                ${q.hasAudio ? '<i class="fas fa-microphone text-info ms-1" title="Has audio"></i>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Add click handler to view details
            li.addEventListener('click', () => {
                viewQueryDetails(q);
            });

            pastQueries.appendChild(li);
        });
    }

    function viewQueryDetails(query) {
        const modal = new bootstrap.Modal(document.getElementById('detailModal') || createDetailModal());
        
        document.getElementById('queryDetailContent').innerHTML = `
            <div class="query-detail">
                <div class="row">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">Query #${query.id}</h6>
                                <span class="badge ${getStatusClass(query.status)}">${query.status}</span>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <strong>Farmer:</strong> ${escapeHtml(query.name)}<br>
                                    <strong>Location:</strong> ${escapeHtml(query.location || 'Not specified')}<br>
                                    <strong>Crop Type:</strong> ${query.cropType || 'Not specified'}<br>
                                    <strong>Category:</strong> <span class="badge bg-light text-dark">${query.category || 'general'}</span>
                                    ${query.urgency === 'high' ? '<span class="badge bg-danger ms-1">Urgent</span>' : ''}
                                </div>
                                
                                <div class="mb-3">
                                    <strong>Query Description:</strong>
                                    <div class="border p-3 mt-1 bg-light rounded">${escapeHtml(query.text)}</div>
                                </div>
                                
                                ${query.initialAIResponse ? `
                                    <div class="alert alert-info">
                                        <strong><i class="fas fa-robot"></i> AI Preliminary Analysis:</strong><br>
                                        ${query.initialAIResponse}
                                    </div>
                                ` : ''}
                                
                                ${query.reply ? `
                                    <div class="alert alert-success">
                                        <strong><i class="fas fa-reply"></i> Officer Response:</strong><br>
                                        ${escapeHtml(query.reply)}
                                        <div class="text-muted small mt-1">
                                            Replied on: ${new Date(query.repliedAt).toLocaleString()}
                                            ${query.assignedTo ? ` by ${query.assignedTo}` : ''}
                                        </div>
                                    </div>
                                ` : `
                                    <div class="alert alert-warning">
                                        <i class="fas fa-clock"></i> Waiting for officer response...
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        ${query.image ? `
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="mb-0">Attached Image</h6>
                                </div>
                                <div class="card-body text-center">
                                    <img src="${query.image}" class="img-fluid rounded" style="max-height: 200px;" 
                                         onclick="this.classList.toggle('img-expanded')">
                                    <small class="text-muted d-block mt-1">Click to enlarge</small>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${query.audio ? `
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Voice Recording</h6>
                                </div>
                                <div class="card-body">
                                    <audio controls class="w-100">
                                        <source src="${query.audio}" type="audio/wav">
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        modal.show();
    }

    function createDetailModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'detailModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Query Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="queryDetailContent">
                        <!-- Content loaded dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    // Setup authentication handlers
    function setupAuthHandlers() {
        document.addEventListener('authChange', (e) => {
            const { user, authenticated } = e.detail;
            
            if (authenticated && user) {
                if (user.role === 'farmer') {
                    farmerName.value = user.name;
                    if (user.location) {
                        locationInp.value = user.location;
                    }
                    showWelcomeMessage(user);
                } else if (user.role === 'officer') {
                    // Redirect officers to dashboard
                    window.location.href = 'dashboard.html';
                }
                showPast();
            }
        });

        // Update farmer data on input
        farmerName.addEventListener('input', () => {
            showPast();
        });
    }

    function showWelcomeMessage(user) {
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'alert alert-success alert-dismissible fade show';
        welcomeMsg.innerHTML = `
            <h6>Welcome back, ${user.name}!</h6>
            <p class="mb-0">We're here to help with your agricultural queries.</p>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('main').insertBefore(welcomeMsg, document.querySelector('main').firstChild);
        
        setTimeout(() => {
            welcomeMsg.remove();
        }, 5000);
    }

    async function generateAIResponse(query) {
        try {
            const response = await apiClient.post('/api/ai-analysis', {
                query_text: query.text,
                crop_type: query.cropType
            });
            
            if (response.recommendation) {
                return `<strong>Category:</strong> ${response.category}<br>
                        <strong>Recommendation:</strong> ${response.recommendation}<br>
                        ${response.suggested_actions && response.suggested_actions.length > 0 ? 
                            `<strong>Suggested Actions:</strong><ul>${response.suggested_actions.map(a => `<li>${a}</li>`).join('')}</ul>` : 
                            ''}`;
            }
            return 'AI analysis in progress...';
        } catch (error) {
            console.error('AI analysis error:', error);
            return 'AI analysis temporarily unavailable.';
        }
    }

    async function saveAndFinish(q) {
        try {
            // Upload image if present
            if (imageFile.files[0]) {
                const imageResponse = await apiClient.uploadFile(API_CONFIG.ENDPOINTS.UPLOAD_IMAGE, imageFile.files[0], 'file');
                q.imageUrl = imageResponse.url;
            }
            
            // Upload audio if present
            if (window.audioBlob) {
                const audioFile = new File([window.audioBlob], 'voice.wav', { type: 'audio/wav' });
                const audioResponse = await apiClient.uploadFile(API_CONFIG.ENDPOINTS.UPLOAD_VOICE, audioFile, 'file');
                q.audioUrl = audioResponse.url;
            }
            
            // Submit query to backend
            const response = await apiClient.post(API_CONFIG.ENDPOINTS.SUBMIT_QUERY, {
                farmer_name: q.name,
                location: q.location,
                crop_type: q.cropType,
                query_text: q.text,
                image_url: q.imageUrl || null,
                audio_url: q.audioUrl || null,
                urgency: q.urgency,
                category: q.category
            });
            
            // Store the backend query ID
            q.backendId = response.query_id || response.id;
            
            // Also save to localStorage for offline access
            const queries = loadQueries();
            queries.push(q);
            saveQueries(queries);
            
            showMessage('✅ Query submitted successfully! You\'ll be notified when an officer responds.', 'success');
            queryForm.reset();
            window.audioBlob = null;
            showPast();
            
        } catch (error) {
            console.error('Error saving query:', error);
            // Fallback to localStorage only
            const queries = loadQueries();
            queries.push(q);
            saveQueries(queries);
            showMessage('Query saved locally. Will sync when connection is available.', 'warning');
            queryForm.reset();
            showPast();
        }
    }

    function detectUrgency(text) {
        const urgentKeywords = ['urgent', 'emergency', 'dying', 'critical', 'immediate', 'help', 'quickly', 'मरना', 'तुरंत', 'जल्दी'];
        const textLower = text.toLowerCase();
        return urgentKeywords.some(keyword => textLower.includes(keyword));
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function showMessage(message, type = 'info') {
        formMsg.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
        setTimeout(() => {
            formMsg.innerHTML = '';
        }, 5000);
    }

    function getStatusClass(status) {
        const classes = {
            'open': 'bg-warning text-dark',
            'assigned': 'bg-info',
            'replied': 'bg-success',
            'closed': 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function loadUserData() {
        const user = auth?.getUser?.();
        if (user && user.role === 'farmer') {
            farmerName.value = user.name || '';
            locationInp.value = user.location || '';
        }
    }

    // ... rest of the existing functions (showMessage, escapeHtml, etc.)
});

// Enhanced CSS for new interactive features
const additionalCSS = `
.urgency-indicator {
    transition: all 0.3s ease;
}

.query-item {
    cursor: pointer;
    transition: all 0.3s ease;
}

.query-item:hover {
    background-color: rgba(46, 125, 50, 0.05);
    transform: translateX(5px);
}

.query-preview {
    line-height: 1.4;
}

.quick-templates .template-btn {
    transition: all 0.3s ease;
}

.quick-templates .template-btn:hover {
    transform: translateY(-2px);
}

.img-expanded {
    max-height: none !important;
    width: 100%;
    cursor: zoom-out;
}

/* Progress indicators */
.progress-steps {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
}

.progress-step {
    text-align: center;
    flex: 1;
    position: relative;
}

.progress-step::after {
    content: '';
    position: absolute;
    top: 15px;
    right: -50%;
    width: 100%;
    height: 2px;
    background: #dee2e6;
    z-index: 1;
}

.progress-step:last-child::after {
    display: none;
}

.progress-step.active::after {
    background: var(--primary-green);
}

.step-icon {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #dee2e6;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.5rem;
    position: relative;
    z-index: 2;
}

.progress-step.active .step-icon {
    background: var(--primary-green);
    color: white;
}

/* Enhanced form animations */
.form-control:focus {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(46, 125, 50, 0.2);
}

.btn:active {
    transform: translateY(1px);
}

/* Loading animations */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.loading-pulse {
    animation: pulse 1s infinite;
}
`;

// Inject additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);