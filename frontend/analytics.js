// analytics.js - Dashboard analytics and charts

class AnalyticsSystem {
    constructor() {
        this.charts = {};
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCharts());
        } else {
            this.initializeCharts();
        }
    }
    
    initializeCharts() {
        // Only initialize if we're on the dashboard page
        if (!document.getElementById('analyticsSection')) {
            return;
        }
        
        this.createStatusChart();
        this.createLocationChart();
        this.createCropChart();
        this.createTimeChart();
    }
    
    getQueryData() {
        try {
            return JSON.parse(localStorage.getItem('agri_queries') || '[]');
        } catch (error) {
            console.error('Error loading query data:', error);
            return [];
        }
    }
    
    createStatusChart() {
        const canvas = document.getElementById('statusChart');
        if (!canvas) return;
        
        const queries = this.getQueryData();
        const statusCounts = {
            open: queries.filter(q => q.status === 'open').length,
            assigned: queries.filter(q => q.status === 'assigned').length,
            resolved: queries.filter(q => q.status === 'resolved').length
        };
        
        if (this.charts.status) {
            this.charts.status.destroy();
        }
        
        this.charts.status = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Open', 'Assigned', 'Resolved'],
                datasets: [{
                    data: [statusCounts.open, statusCounts.assigned, statusCounts.resolved],
                    backgroundColor: [
                        '#ffc107',
                        '#17a2b8',
                        '#28a745'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }
    
    createLocationChart() {
        const canvas = document.getElementById('locChart');
        if (!canvas) return;
        
        const queries = this.getQueryData();
        const locationCounts = {};
        
        queries.forEach(q => {
            const loc = q.location || 'Unknown';
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });
        
        // Get top 6 locations
        const sortedLocations = Object.entries(locationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
        
        if (this.charts.location) {
            this.charts.location.destroy();
        }
        
        this.charts.location = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: sortedLocations.map(l => l[0]),
                datasets: [{
                    label: 'Queries by Location',
                    data: sortedLocations.map(l => l[1]),
                    backgroundColor: '#28a745',
                    borderColor: '#1e7e34',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    createCropChart() {
        const canvas = document.getElementById('cropChart');
        if (!canvas) return;
        
        const queries = this.getQueryData();
        const cropCounts = {};
        
        queries.forEach(q => {
            const crop = q.cropType || 'Not specified';
            cropCounts[crop] = (cropCounts[crop] || 0) + 1;
        });
        
        if (this.charts.crop) {
            this.charts.crop.destroy();
        }
        
        this.charts.crop = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(cropCounts),
                datasets: [{
                    data: Object.values(cropCounts),
                    backgroundColor: [
                        '#28a745',
                        '#20c997',
                        '#17a2b8',
                        '#007bff',
                        '#6610f2',
                        '#e83e8c',
                        '#fd7e14',
                        '#ffc107'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
    
    createTimeChart() {
        const canvas = document.getElementById('timeChart');
        if (!canvas) return;
        
        const queries = this.getQueryData();
        const last7Days = [];
        const today = new Date();
        
        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            last7Days.push({
                date: date,
                label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: 0
            });
        }
        
        // Count queries per day
        queries.forEach(q => {
            const queryDate = new Date(q.createdAt);
            queryDate.setHours(0, 0, 0, 0);
            
            const dayEntry = last7Days.find(d => d.date.getTime() === queryDate.getTime());
            if (dayEntry) {
                dayEntry.count++;
            }
        });
        
        if (this.charts.time) {
            this.charts.time.destroy();
        }
        
        this.charts.time = new Chart(canvas, {
            type: 'line',
            data: {
                labels: last7Days.map(d => d.label),
                datasets: [{
                    label: 'Daily Queries',
                    data: last7Days.map(d => d.count),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    updateAllCharts() {
        this.createStatusChart();
        this.createLocationChart();
        this.createCropChart();
        this.createTimeChart();
    }
    
    getStatistics() {
        const queries = this.getQueryData();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const stats = {
            total: queries.length,
            open: queries.filter(q => q.status === 'open').length,
            assigned: queries.filter(q => q.status === 'assigned').length,
            resolved: queries.filter(q => q.status === 'resolved').length,
            urgent: queries.filter(q => q.urgency === 'high' && q.status !== 'resolved').length,
            thisWeek: queries.filter(q => new Date(q.createdAt) >= weekAgo).length,
            lastWeek: 0
        };
        
        // Calculate last week for growth percentage
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        stats.lastWeek = queries.filter(q => {
            const qDate = new Date(q.createdAt);
            return qDate >= twoWeeksAgo && qDate < weekAgo;
        }).length;
        
        // Calculate growth percentage
        if (stats.lastWeek > 0) {
            stats.growth = Math.round(((stats.thisWeek - stats.lastWeek) / stats.lastWeek) * 100);
        } else {
            stats.growth = stats.thisWeek > 0 ? 100 : 0;
        }
        
        // Calculate average response time
        const resolvedQueries = queries.filter(q => q.repliedAt);
        if (resolvedQueries.length > 0) {
            const totalTime = resolvedQueries.reduce((sum, q) => {
                const created = new Date(q.createdAt);
                const replied = new Date(q.repliedAt);
                return sum + (replied - created);
            }, 0);
            stats.avgResponseTime = Math.round(totalTime / resolvedQueries.length / (1000 * 60 * 60)); // in hours
        } else {
            stats.avgResponseTime = 0;
        }
        
        // Resolution rate
        stats.resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
        
        return stats;
    }
}

// Initialize analytics
let analytics;
document.addEventListener('DOMContentLoaded', () => {
    analytics = new AnalyticsSystem();
    window.analytics = analytics;
});
