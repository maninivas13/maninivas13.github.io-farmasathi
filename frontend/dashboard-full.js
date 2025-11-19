// dashboard.js - Complete Officer Dashboard Implementation

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = auth.getUser();
    if (!user || user.role !== 'officer') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize dashboard
    initializeDashboard();
    loadStatistics();
    refreshTable();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadStatistics();
        refreshTable();
    }, 30000);
});

function initializeDashboard() {
    const user = auth.getUser();
    
    // Display officer info
    document.getElementById('officerName').textContent = user.name;
    document.getElementById('officerRole').textContent = user.department || 'Officer';
    
    // Display current date
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dashboardDate').textContent = new Date().toLocaleDateString('en-US', dateOptions);
    
    // Add sample queries if none exist (for testing)
    const queries = loadQueries();
    if (queries.length === 0) {
        addSampleQueries();
    }
}

function addSampleQueries() {
    const sampleQueries = [
        {
            id: Date.now(),
            name: 'Ravi Kumar',
            location: 'Warangal, Telangana',
            cropType: 'rice',
            text: 'My rice crop leaves are turning yellow. What could be the problem? I have tried fertilizer but no improvement.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            urgency: 'high',
            assignedTo: null,
            reply: null,
            category: 'disease',
            hasImage: false,
            hasAudio: false
        },
        {
            id: Date.now() + 1,
            name: 'Lakshmi Devi',
            location: 'Krishna, Andhra Pradesh',
            cropType: 'cotton',
            text: 'There are small insects on my cotton plants. They seem to be eating the leaves. Need urgent help.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            urgency: 'high',
            assignedTo: null,
            reply: null,
            category: 'pest',
            hasImage: false,
            hasAudio: false
        },
        {
            id: Date.now() + 2,
            name: 'Suresh Reddy',
            location: 'Nalgonda, Telangana',
            cropType: 'wheat',
            text: 'What is the current market price for wheat? When should I sell for best price?',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: 'assigned',
            urgency: 'normal',
            assignedTo: 'Officer',
            reply: null,
            category: 'market',
            hasImage: false,
            hasAudio: false
        },
        {
            id: Date.now() + 3,
            name: 'Venkat Rao',
            location: 'Karimnagar, Telangana',
            cropType: 'tomato',
            text: 'My tomato plants are healthy. Just wanted to know the best fertilizer schedule.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'resolved',
            urgency: 'normal',
            assignedTo: 'Officer',
            reply: 'For tomato, apply NPK 19:19:19 at 20 days after transplanting, then use 13:0:45 at flowering stage. Apply organic manure every 15 days.',
            repliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            category: 'fertilizer',
            hasImage: false,
            hasAudio: false
        },
        {
            id: Date.now() + 4,
            name: 'Rajesh Naik',
            location: 'Medak, Telangana',
            cropType: 'maize',
            text: 'Need advice on drip irrigation system for my maize field. Is it cost effective?',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            urgency: 'normal',
            assignedTo: null,
            reply: null,
            category: 'irrigation',
            hasImage: false,
            hasAudio: false
        }
    ];
    
    saveQueries(sampleQueries);
    console.log('✅ Sample queries added for testing');
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.dashboard-nav');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked
            item.classList.add('active');
            
            // Show corresponding section
            const sectionId = item.id.replace('nav', '').toLowerCase() + 'Section';
            showSection(sectionId);
        });
    });
    
    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            auth.logout();
            window.location.href = 'login.html';
        }
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        
        // Load section-specific data
        if (sectionId === 'analyticsSection' && window.analytics) {
            analytics.updateAllCharts();
        }
    }
}

function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadStatistics();
        refreshTable();
        if (window.analytics) {
            analytics.updateAllCharts();
        }
    });
    
    // Filter handlers
    document.getElementById('filterStatus').addEventListener('change', refreshTable);
    document.getElementById('filterUrgency').addEventListener('change', refreshTable);
    
    // Export data
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // View urgent button
    const urgentBtn = document.getElementById('viewUrgentBtn');
    if (urgentBtn) {
        urgentBtn.addEventListener('click', () => {
            document.getElementById('filterUrgency').value = 'high';
            refreshTable();
        });
    }
}

function loadQueries() {
    try {
        return JSON.parse(localStorage.getItem('agri_queries') || '[]');
    } catch (error) {
        console.error('Error loading queries:', error);
        return [];
    }
}

function saveQueries(queries) {
    try {
        localStorage.setItem('agri_queries', JSON.stringify(queries));
    } catch (error) {
        console.error('Error saving queries:', error);
    }
}

function loadStatistics() {
    const stats = window.analytics ? analytics.getStatistics() : getBasicStats();
    
    // Update stats cards
    document.getElementById('totalQueries').textContent = stats.total;
    document.getElementById('openCount').textContent = stats.open;
    document.getElementById('assignedCount').textContent = stats.assigned;
    document.getElementById('resolvedCount').textContent = stats.resolved;
    
    // Update growth indicator
    const growthEl = document.getElementById('queryGrowth');
    if (growthEl) {
        growthEl.textContent = `${stats.growth > 0 ? '+' : ''}${stats.growth}%`;
        growthEl.parentElement.className = stats.growth >= 0 ? 'text-success' : 'text-danger';
    }
    
    // Update other metrics
    if (document.getElementById('openAge')) {
        document.getElementById('openAge').textContent = `Avg: ${stats.avgResponseTime || 0} hours`;
    }
    
    if (document.getElementById('resolutionRate')) {
        document.getElementById('resolutionRate').textContent = `${stats.resolutionRate}% resolution rate`;
    }
    
    // Show urgent alert if needed
    if (stats.urgent > 0) {
        const urgentAlert = document.getElementById('urgentAlert');
        if (urgentAlert) {
            urgentAlert.style.display = 'flex';
            document.getElementById('urgentCount').textContent = stats.urgent;
        }
    }
}

function getBasicStats() {
    const queries = loadQueries();
    return {
        total: queries.length,
        open: queries.filter(q => q.status === 'open').length,
        assigned: queries.filter(q => q.status === 'assigned').length,
        resolved: queries.filter(q => q.status === 'resolved').length,
        urgent: queries.filter(q => q.urgency === 'high' && q.status !== 'resolved').length,
        growth: 0,
        avgResponseTime: 0,
        resolutionRate: queries.length > 0 ? Math.round((queries.filter(q => q.status === 'resolved').length / queries.length) * 100) : 0
    };
}

function refreshTable() {
    const statusFilter = document.getElementById('filterStatus').value;
    const urgencyFilter = document.getElementById('filterUrgency').value;
    
    let queries = loadQueries();
    
    // Sort by urgency and date
    queries.sort((a, b) => {
        if (a.urgency === 'high' && b.urgency !== 'high') return -1;
        if (b.urgency === 'high' && a.urgency !== 'high') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Apply filters
    if (statusFilter !== 'all') {
        queries = queries.filter(q => q.status === statusFilter);
    }
    
    if (urgencyFilter === 'high') {
        queries = queries.filter(q => q.urgency === 'high');
    } else if (urgencyFilter === 'normal') {
        queries = queries.filter(q => q.urgency !== 'high');
    }
    
    // Render table
    const tbody = document.querySelector('#queriesTable tbody');
    tbody.innerHTML = '';
    
    if (queries.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                    <div>No queries found</div>
                </td>
            </tr>
        `;
    } else {
        queries.forEach(q => {
            const row = createQueryRow(q);
            tbody.appendChild(row);
        });
    }
    
    // Update counts
    document.getElementById('shownCount').textContent = queries.length;
    document.getElementById('totalCount').textContent = loadQueries().length;
}

function createQueryRow(query) {
    const tr = document.createElement('tr');
    tr.className = query.urgency === 'high' ? 'table-warning' : '';
    
    const createdDate = new Date(query.createdAt).toLocaleDateString();
    const statusClass = getStatusBadgeClass(query.status);
    
    tr.innerHTML = `
        <td><strong>#${query.id}</strong></td>
        <td>${escapeHtml(query.name)}</td>
        <td>${escapeHtml(query.location || 'N/A')}</td>
        <td>${query.cropType || 'N/A'}</td>
        <td>
            <span class="query-preview">${escapeHtml(query.text.substring(0, 50))}...</span>
            ${query.hasImage ? '<i class="fas fa-image text-primary ms-1" title="Has image"></i>' : ''}
            ${query.hasAudio ? '<i class="fas fa-microphone text-info ms-1" title="Has audio"></i>' : ''}
        </td>
        <td>${createdDate}</td>
        <td>
            <span class="badge ${statusClass}">${query.status}</span>
            ${query.urgency === 'high' ? '<span class="badge bg-danger ms-1">Urgent</span>' : ''}
        </td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="viewQueryDetails(${query.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-outline-success" onclick="replyToQuery(${query.id})" title="Reply">
                    <i class="fas fa-reply"></i>
                </button>
                ${query.status !== 'assigned' ? `
                    <button class="btn btn-outline-info" onclick="assignQuery(${query.id})" title="Assign to me">
                        <i class="fas fa-user-check"></i>
                    </button>
                ` : ''}
            </div>
        </td>
    `;
    
    return tr;
}

function getStatusBadgeClass(status) {
    const classes = {
        'open': 'bg-warning text-dark',
        'assigned': 'bg-info text-white',
        'resolved': 'bg-success text-white'
    };
    return classes[status] || 'bg-secondary text-white';
}

window.viewQueryDetails = function(queryId) {
    const queries = loadQueries();
    const query = queries.find(q => q.id === queryId);
    
    if (!query) return;
    
    const modalContent = document.getElementById('queryDetailContent');
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">Query #${query.id}</h6>
                        <span class="badge ${getStatusBadgeClass(query.status)}">${query.status}</span>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Farmer:</strong> ${escapeHtml(query.name)}<br>
                            <strong>Phone:</strong> ${query.farmerId || 'Not provided'}<br>
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
                                <strong><i class="fas fa-reply"></i> Your Response:</strong><br>
                                ${escapeHtml(query.reply)}
                                <div class="text-muted small mt-1">
                                    Replied on: ${new Date(query.repliedAt).toLocaleString()}
                                </div>
                            </div>
                        ` : ''}
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
                            <img src="${query.image}" class="img-fluid rounded" style="max-height: 300px; cursor: pointer;" 
                                 onclick="window.open(this.src, '_blank')">
                            <small class="text-muted d-block mt-1">Click to view full size</small>
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
                                <source src="${query.audio}" type="audio/webm">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
    
    // Setup reply button
    document.getElementById('replyFromDetail').onclick = () => {
        modal.hide();
        replyToQuery(queryId);
    };
};

window.replyToQuery = function(queryId) {
    const queries = loadQueries();
    const query = queries.find(q => q.id === queryId);
    
    if (!query) return;
    
    const queryDetails = document.getElementById('queryDetails');
    queryDetails.innerHTML = `
        <div class="mb-2"><strong>Farmer:</strong> ${escapeHtml(query.name)}</div>
        <div class="mb-2"><strong>Location:</strong> ${escapeHtml(query.location || 'N/A')}</div>
        <div class="mb-2"><strong>Query:</strong></div>
        <div class="text-muted small">${escapeHtml(query.text.substring(0, 200))}...</div>
    `;
    
    // Clear previous reply if editing
    document.getElementById('replyText').value = query.reply || '';
    document.getElementById('markResolved').checked = query.status === 'resolved';
    
    const modal = new bootstrap.Modal(document.getElementById('replyModal'));
    modal.show();
    
    // Handle form submission
    const replyForm = document.getElementById('replyForm');
    replyForm.onsubmit = (e) => {
        e.preventDefault();
        
        const replyText = document.getElementById('replyText').value.trim();
        const markResolved = document.getElementById('markResolved').checked;
        
        if (!replyText) {
            alert('Please enter your response');
            return;
        }
        
        // Update query
        query.reply = replyText;
        query.repliedAt = new Date().toISOString();
        query.status = markResolved ? 'resolved' : 'assigned';
        query.assignedTo = auth.getUser().name;
        
        saveQueries(queries);
        
        modal.hide();
        loadStatistics();
        refreshTable();
        
        if (window.notifications) {
            notifications.success('Response sent successfully!');
        }
    };
};

window.assignQuery = function(queryId) {
    const queries = loadQueries();
    const query = queries.find(q => q.id === queryId);
    
    if (!query) return;
    
    query.status = 'assigned';
    query.assignedTo = auth.getUser().name;
    query.assignedAt = new Date().toISOString();
    
    saveQueries(queries);
    
    loadStatistics();
    refreshTable();
    
    if (window.notifications) {
        notifications.success(`Query #${queryId} assigned to you`);
    }
};

function exportData() {
    const queries = loadQueries();
    const csvContent = convertToCSV(queries);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `queries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function convertToCSV(queries) {
    const headers = ['ID', 'Farmer', 'Location', 'Crop', 'Query', 'Status', 'Urgency', 'Created', 'Replied'];
    const rows = queries.map(q => [
        q.id,
        q.name,
        q.location || '',
        q.cropType || '',
        q.text.replace(/,/g, ';'),
        q.status,
        q.urgency || 'normal',
        new Date(q.createdAt).toLocaleString(),
        q.repliedAt ? new Date(q.repliedAt).toLocaleString() : 'Pending'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Real-time character counter for reply
document.addEventListener('DOMContentLoaded', () => {
    const replyText = document.getElementById('replyText');
    const responseLength = document.getElementById('responseLength');
    
    if (replyText && responseLength) {
        replyText.addEventListener('input', () => {
            responseLength.textContent = replyText.value.length;
        });
    }
});
