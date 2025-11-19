// Enhanced main.js - handles query form, voice recording, and localStorage

document.addEventListener('DOMContentLoaded', () => {
  // Logout handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        auth.logout();
      }
    });
  }
  
  const queryForm = document.getElementById('queryForm');
  const farmerName = document.getElementById('farmerName');
  const locationInp = document.getElementById('location');
  const cropSelect = document.getElementById('cropType');
  const queryText = document.getElementById('queryText');
  const imageFile = document.getElementById('imageFile');
  const formMsg = document.getElementById('formMsg');
  const pastQueries = document.getElementById('pastQueries');
  const clearFormBtn = document.getElementById('clearForm');

  // Initialize language
  initializeLanguage();

  // Simple storage helper
  function loadQueries() {
    return JSON.parse(localStorage.getItem('agri_queries') || '[]');
  }
  
  function saveQueries(arr) {
    localStorage.setItem('agri_queries', JSON.stringify(arr));
  }

  function showPast() {
    const arr = loadQueries()
      .filter(q => q.name === (farmerName.value || 'Anonymous'))
      .slice()
      .reverse();
      
    pastQueries.innerHTML = '';
    
    if (!arr.length) {
      pastQueries.innerHTML = `
        <div class="list-group-item text-center py-4 text-muted">
          <i class="fas fa-inbox fa-2x mb-2 opacity-50"></i>
          <div data-translate="no_queries">No past queries yet</div>
        </div>
      `;
      return;
    }
    
    arr.slice(0, 5).forEach(q => {
      const li = document.createElement('div');
      li.className = 'list-group-item';
      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-1">
              <strong>${escapeHtml(q.name)}</strong>
              <span class="badge ${getStatusClass(q.status)} ms-2">${q.status}</span>
              ${q.urgency === 'high' ? '<span class="badge bg-danger ms-1">Urgent</span>' : ''}
            </div>
            <small class="text-muted d-block mb-1">${escapeHtml(q.location)} • ${q.cropType || 'No crop specified'}</small>
            <p class="mb-1 small">${escapeHtml(q.text.slice(0,80))}${q.text.length>80?'...':''}</p>
            <small class="text-muted">${new Date(q.createdAt).toLocaleDateString()}</small>
          </div>
          <div class="ms-2">
            ${q.reply ? '<i class="fas fa-reply text-success" title="Replied"></i>' : '<i class="fas fa-clock text-warning" title="Pending"></i>'}
          </div>
        </div>
      `;
      pastQueries.appendChild(li);
    });
  }

  function getStatusClass(status) {
    switch(status) {
      case 'open': return 'bg-warning text-dark';
      case 'assigned': return 'bg-info text-white';
      case 'resolved': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  }

  // Enhanced query submission with AI response simulation
  queryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!queryText.value.trim()) {
      showMessage('Please describe your query', 'danger');
      return;
    }

    const submitBtn = queryForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
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
        audio: null
      };

      // Handle image upload
      const file = imageFile.files[0];
      if (file) {
        q.image = await readFileAsDataURL(file);
      }

      // Handle audio
      if (window.audioBlob) {
        q.audio = await readFileAsDataURL(window.audioBlob);
      }

      // Generate AI preliminary analysis
      try {
        const aiResponse = await generateAIResponse(q);
        q.initialAIResponse = aiResponse;
      } catch (error) {
        console.error('AI response simulation failed:', error);
      }

      await saveAndFinish(q);
      
    } catch (error) {
      console.error('Error submitting query:', error);
      showMessage('Error submitting query. Please try again.', 'danger');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(evt) {
        resolve(evt.target.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function saveAndFinish(q) {
    const arr = loadQueries();
    arr.push(q);
    saveQueries(arr);
    
    showMessage(`
      <div class="alert alert-success">
        <h6><i class="fas fa-check-circle"></i> Query Submitted Successfully!</h6>
        <p class="mb-1">Your query ID: <strong>${q.id}</strong></p>
        <small>Our agricultural officers will respond within 24 hours.</small>
        ${q.initialAIResponse ? `
          <div class="mt-2 p-2 bg-light rounded">
            <strong>Preliminary Analysis:</strong> ${q.initialAIResponse}
          </div>
        ` : ''}
      </div>
    `, 'success');
    
    // Reset form but keep user details
    queryText.value = '';
    imageFile.value = '';
    cropSelect.value = '';
    if (window.audioBlob) {
      URL.revokeObjectURL(window.audioUrl);
      window.audioBlob = null;
      window.audioUrl = null;
      updateAudioUI();
    }
    
    showPast();
    
    // Simulate notification
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('FarmaSathi Query Submitted', {
          body: `Your query #${q.id} has been received. We'll notify you when an officer responds.`,
          icon: '/favicon.ico'
        });
      }
    }, 1000);
  }

  function showMessage(content, type = 'info') {
    formMsg.innerHTML = typeof content === 'string' ? 
      `<div class="alert alert-${type}">${content}</div>` : content;
    
    setTimeout(() => {
      formMsg.innerHTML = '';
    }, 5000);
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // Save draft functionality
  document.getElementById('saveDraft').addEventListener('click', () => {
    const draft = {
      name: farmerName.value,
      location: locationInp.value,
      cropType: cropSelect.value,
      text: queryText.value,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('agri_draft', JSON.stringify(draft));
    showMessage('Draft saved locally. You can continue later.', 'info');
  });

  // Clear form
  clearFormBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the form?')) {
      farmerName.value = '';
      locationInp.value = '';
      cropSelect.value = '';
      queryText.value = '';
      imageFile.value = '';
      if (window.audioBlob) {
        URL.revokeObjectURL(window.audioUrl);
        window.audioBlob = null;
        window.audioUrl = null;
        updateAudioUI();
      }
      showMessage('Form cleared', 'info');
    }
  });

  // Load draft if exists
  const draftRaw = localStorage.getItem('agri_draft');
  if (draftRaw) {
    try {
      const d = JSON.parse(draftRaw);
      farmerName.value = d.name || '';
      locationInp.value = d.location || '';
      cropSelect.value = d.cropType || '';
      queryText.value = d.text || '';
      
      if (d.name || d.location || d.text) {
        showMessage('Draft loaded from previous session', 'info');
        setTimeout(() => {
          formMsg.innerHTML = '';
        }, 3000);
      }
    } catch(e) {
      console.error('Error loading draft:', e);
    }
  }

  // Auto-save draft every 30 seconds
  setInterval(() => {
    if (queryText.value.trim()) {
      const draft = {
        name: farmerName.value,
        location: locationInp.value,
        cropType: cropSelect.value,
        text: queryText.value,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('agri_draft', JSON.stringify(draft));
    }
  }, 30000);

  // Initialize when farmer name changes
  farmerName.addEventListener('input', showPast);
  
  // Initial load
  showPast();

  // --- Enhanced Voice Recording using MediaRecorder API ---
  let mediaRecorder;
  let audioChunks = [];
  const startBtn = document.getElementById('startRec');
  const stopBtn = document.getElementById('stopRec');
  const recStatus = document.getElementById('recStatus');
  const audioPlayback = document.getElementById('audioPlayback');

  // Check for browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    startBtn.disabled = true;
    startBtn.title = 'Voice recording not supported in this browser';
    recStatus.textContent = 'Voice recording not available';
  } else {
    startBtn.addEventListener('click', startRecording);
    stopBtn.addEventListener('click', stopRecording);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        window.audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        window.audioUrl = URL.createObjectURL(window.audioBlob);
        updateAudioUI();
        
        // Add audio transcription to query text
        if (!queryText.value.includes('[Voice recording attached]')) {
          queryText.value += '\n[Voice recording attached]';
        }
      };

      mediaRecorder.start();
      updateRecordingUI(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      showMessage('Error accessing microphone. Please check permissions.', 'danger');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      updateRecordingUI(false);
    }
  }

  function updateRecordingUI(recording) {
    if (recording) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      recStatus.innerHTML = '<span class="recording-indicator"></span> Recording...';
      recStatus.className = 'text-danger';
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      recStatus.textContent = 'Recording saved';
      recStatus.className = 'text-success';
    }
  }

  function updateAudioUI() {
    if (window.audioUrl) {
      audioPlayback.src = window.audioUrl;
      audioPlayback.style.display = 'block';
      // Add delete button
      if (!document.getElementById('deleteAudio')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'deleteAudio';
        deleteBtn.className = 'btn btn-outline-danger btn-sm ms-2';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete recording';
        deleteBtn.onclick = deleteRecording;
        recStatus.parentNode.appendChild(deleteBtn);
      }
    } else {
      audioPlayback.style.display = 'none';
      const deleteBtn = document.getElementById('deleteAudio');
      if (deleteBtn) deleteBtn.remove();
    }
  }

  function deleteRecording() {
    if (window.audioUrl) {
      URL.revokeObjectURL(window.audioUrl);
      window.audioBlob = null;
      window.audioUrl = null;
      updateAudioUI();
      updateRecordingUI(false);
      recStatus.textContent = 'Recording deleted';
      recStatus.className = 'text-muted';
      
      // Remove voice note reference from text
      queryText.value = queryText.value.replace('\n[Voice recording attached]', '');
    }
  }

  // --- Authentication ---
  const authForm = document.getElementById('authForm');
  const authName = document.getElementById('authName');
  const authPhone = document.getElementById('authPhone');
  const asOfficer = document.getElementById('asOfficer');
  const authMsg = document.getElementById('authMsg');

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const phone = authPhone.value.trim();
    if (phone && !/^\d{10}$/.test(phone)) {
      authMsg.innerHTML = '<div class="text-danger">Please enter a valid 10-digit phone number</div>';
      return;
    }

    const user = {
      name: authName.value.trim() || 'Unknown User',
      id: phone || 'user-' + Date.now(),
      role: asOfficer.checked ? 'officer' : 'farmer',
      phone: phone,
      joinedAt: new Date().toISOString()
    };
    
    localStorage.setItem('agri_user', JSON.stringify(user));
    
    // Update farmer name if logging as farmer
    if (user.role === 'farmer' && user.name !== 'Unknown User') {
      farmerName.value = user.name;
      showPast();
    }
    
    authMsg.innerHTML = `<div class="text-success">
      <i class="fas fa-check-circle"></i> Logged in as ${user.name} (${user.role})
    </div>`;
    
    setTimeout(() => {
      const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
      if (modal) modal.hide();
      
      if (user.role === 'officer') {
        window.location.href = 'dashboard.html';
      }
    }, 1000);
  });

  // Check if user is already logged in
  const currentUser = JSON.parse(localStorage.getItem('agri_user') || 'null');
  if (currentUser && currentUser.role === 'farmer' && currentUser.name !== 'Unknown User') {
    farmerName.value = currentUser.name;
    showPast();
  }

  // Helper functions
  function detectUrgency(text) {
    const urgentKeywords = ['emergency', 'urgent', 'dying', 'critical', 'immediately', 'dying plants', 'crop loss'];
    const lowerText = text.toLowerCase();
    return urgentKeywords.some(keyword => lowerText.includes(keyword)) ? 'high' : 'normal';
  }

  function initializeLanguage() {
    // Set initial language
    const savedLang = localStorage.getItem('agri_language') || 'en';
    setLanguage(savedLang);
    
    // Language selector event listeners
    document.querySelectorAll('.lang-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.dataset.lang;
        setLanguage(lang);
        localStorage.setItem('agri_language', lang);
      });
    });
  }

  function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.getElementById('currentLang').textContent = 
      getLanguageName(lang);
    
    // In a real implementation, you would load translations here
    console.log('Language set to:', lang);
  }

  function getLanguageName(code) {
    const languages = {
      'en': 'English',
      'hi': 'हिन्दी',
      'te': 'తెలుగు',
      'ta': 'தமிழ்',
      'bn': 'বাংলা',
      'mr': 'मराठी'
    };
    return languages[code] || 'English';
  }

  // Enhanced dashboard.js with interactive features
document.addEventListener('DOMContentLoaded', () => {
    // ... existing dashboard code ...

    // Add real-time notifications
    initializeNotifications();
    
    // Add interactive filters
    initializeInteractiveFilters();
    
    // Add keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Add collaborative features
    initializeCollaboration();

    function initializeNotifications() {
        // Check for new queries periodically
        setInterval(() => {
            const lastCheck = localStorage.getItem('agri_last_check') || Date.now();
            const newQueries = loadQueries().filter(q => 
                new Date(q.createdAt) > new Date(parseInt(lastCheck))
            );
            
            if (newQueries.length > 0) {
                showNewQueriesNotification(newQueries);
                localStorage.setItem('agri_last_check', Date.now());
            }
        }, 30000); // Check every 30 seconds
    }

    function showNewQueriesNotification(queries) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
            <h6><i class="fas fa-bell"></i> New Queries Received</h6>
            <p class="mb-1">${queries.length} new farmer ${queries.length === 1 ? 'query' : 'queries'} need attention.</p>
            <button class="btn btn-sm btn-primary mt-1" onclick="this.parentElement.remove(); refreshDashboard();">
                View Now
            </button>
        `;
        document.body.appendChild(notification);
        
        // Add sound notification if enabled
        if (localStorage.getItem('agri_sound_notifications') === 'true') {
            playNotificationSound();
        }
    }

    function playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ...');
        audio.volume = 0.3;
        audio.play().catch(() => {}); // Ignore errors
    }

    function initializeInteractiveFilters() {
        // Add search functionality
        const searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.className = 'form-control form-control-sm';
        searchBox.placeholder = 'Search queries...';
        searchBox.style.width = '200px';
        
        const filterContainer = document.querySelector('.card-header .d-flex');
        filterContainer.insertBefore(searchBox, filterContainer.firstChild);
        
        searchBox.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterQueriesBySearch(searchTerm);
        });

        // Add advanced filters
        const advancedFilters = document.createElement('div');
        advancedFilters.className = 'advanced-filters mt-2';
        advancedFilters.style.display = 'none';
        advancedFilters.innerHTML = `
            <div class="row g-2">
                <div class="col-md-4">
                    <label class="form-label small">Date Range</label>
                    <select class="form-select form-select-sm" id="dateFilter">
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label small">Category</label>
                    <select class="form-select form-select-sm" id="categoryFilter">
                        <option value="all">All Categories</option>
                        <option value="pest">Pest Issues</option>
                        <option value="disease">Diseases</option>
                        <option value="nutrient">Nutrient Problems</option>
                        <option value="weather">Weather Related</option>
                        <option value="market">Market Questions</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label small">Has Attachments</label>
                    <select class="form-select form-select-sm" id="attachmentFilter">
                        <option value="all">All Types</option>
                        <option value="image">With Images</option>
                        <option value="audio">With Audio</option>
                        <option value="both">With Both</option>
                    </select>
                </div>
            </div>
        `;

        document.querySelector('.card-header').appendChild(advancedFilters);

        // Toggle advanced filters
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
        toggleBtn.innerHTML = '<i class="fas fa-filter"></i> Advanced';
        toggleBtn.onclick = () => {
            advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'block' : 'none';
        };
        filterContainer.appendChild(toggleBtn);

        // Add filter event listeners
        document.getElementById('dateFilter').addEventListener('change', applyAdvancedFilters);
        document.getElementById('categoryFilter').addEventListener('change', applyAdvancedFilters);
        document.getElementById('attachmentFilter').addEventListener('change', applyAdvancedFilters);
    }

    function filterQueriesBySearch(searchTerm) {
        const rows = queriesTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    function applyAdvancedFilters() {
        refreshTable(); // This will now consider advanced filters
    }

    function initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.querySelector('input[placeholder="Search queries..."]').focus();
            }
            
            // Ctrl/Cmd + R for refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                refreshDashboard();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    bootstrap.Modal.getInstance(openModal).hide();
                }
            }
        });
    }

    function initializeCollaboration() {
        // Simulate officer availability
        updateOfficerStatus();
        
        // Add chat simulation for complex queries
        initializeQueryChat();
    }

    function updateOfficerStatus() {
        const officers = [
            { name: 'Dr. Sharma', status: 'online', specialization: 'Plant Pathology' },
            { name: 'Dr. Patel', status: 'busy', specialization: 'Soil Science' },
            { name: 'Dr. Kumar', status: 'online', specialization: 'Pest Management' }
        ];

        const statusContainer = document.createElement('div');
        statusContainer.className = 'officer-status';
        statusContainer.innerHTML = `
            <h6 class="mb-2">Team Availability</h6>
            ${officers.map(officer => `
                <div class="d-flex align-items-center mb-1">
                    <span class="status-indicator ${officer.status} me-2"></span>
                    <small>${officer.name} - ${officer.specialization}</small>
                </div>
            `).join('')}
        `;

        document.querySelector('.sidebar').appendChild(statusContainer);
    }

    function initializeQueryChat() {
        // This would integrate with a real chat system
        console.log('Chat system initialized for officer collaboration');
    }

    // Enhanced refreshTable with advanced filtering
    function refreshTable() {
        const statusFilter = document.getElementById('filterStatus').value;
        const urgencyFilter = document.getElementById('filterUrgency').value;
        const dateFilter = document.getElementById('dateFilter')?.value || 'all';
        const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
        const attachmentFilter = document.getElementById('attachmentFilter')?.value || 'all';
        
        let arr = loadQueries().sort((a, b) => {
            if (a.urgency === 'high' && b.urgency !== 'high') return -1;
            if (b.urgency === 'high' && a.urgency !== 'high') return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Apply all filters
        if (statusFilter !== 'all') {
            arr = arr.filter(q => q.status === statusFilter);
        }
        if (urgencyFilter !== 'all') {
            arr = arr.filter(q => q.urgency === urgencyFilter);
        }
        if (dateFilter !== 'all') {
            const now = new Date();
            const startDate = new Date();
            
            switch(dateFilter) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }
            
            arr = arr.filter(q => new Date(q.createdAt) >= startDate);
        }
        if (categoryFilter !== 'all') {
            arr = arr.filter(q => q.category === categoryFilter);
        }
        if (attachmentFilter !== 'all') {
            switch(attachmentFilter) {
                case 'image':
                    arr = arr.filter(q => q.hasImage);
                    break;
                case 'audio':
                    arr = arr.filter(q => q.hasAudio);
                    break;
                case 'both':
                    arr = arr.filter(q => q.hasImage && q.hasAudio);
                    break;
            }
        }

        // ... rest of the table rendering code
    }

    // Add CSS for new features
    const dashboardCSS = `
    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }
    
    .status-indicator.online {
        background-color: #28a745;
    }
    
    .status-indicator.busy {
        background-color: #ffc107;
    }
    
    .status-indicator.offline {
        background-color: #6c757d;
    }
    
    .officer-status {
        padding: 1rem;
        border-top: 1px solid #dee2e6;
        margin-top: 1rem;
    }
    
    .advanced-filters {
        border-top: 1px solid #dee2e6;
        padding-top: 1rem;
    }
    
    /* Enhanced table interactions */
    .table-hover tbody tr {
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .table-hover tbody tr:hover {
        background-color: rgba(46, 125, 50, 0.1) !important;
        transform: scale(1.01);
    }
    
    /* Quick action buttons */
    .btn-group-sm .btn {
        padding: 0.25rem 0.5rem;
        transition: all 0.2s ease;
    }
    
    .btn-group-sm .btn:hover {
        transform: translateY(-1px);
    }
    
    /* Notification animations */
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
    
    .alert.position-fixed {
        animation: slideInRight 0.3s ease;
    }
    `;

    const style = document.createElement('style');
    style.textContent = dashboardCSS;
    document.head.appendChild(style);
});

});