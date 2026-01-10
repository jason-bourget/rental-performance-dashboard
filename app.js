/**
 * Meridian Capital - Portfolio Dashboard
 * Apartment Building Performance Analytics
 */

// ========================================
// Sample Data
// ========================================

const portfolioData = {
    properties: [
        {
            id: 1,
            name: "The Ashford",
            address: "1420 Park Avenue, Brooklyn",
            units: 48,
            occupancy: 97.9,
            grossRevenue: 89400,
            noi: 55200,
            capRate: 5.8,
            ownershipPercent: 15,
            trend: 2.4
        },
        {
            id: 2,
            name: "Maple Gardens",
            address: "825 Elm Street, Queens",
            units: 32,
            occupancy: 93.8,
            grossRevenue: 54200,
            noi: 32800,
            capRate: 5.2,
            ownershipPercent: 15,
            trend: 1.8
        },
        {
            id: 3,
            name: "Riverside Terrace",
            address: "2100 River Road, Hoboken",
            units: 64,
            occupancy: 91.4,
            grossRevenue: 118600,
            noi: 71200,
            capRate: 5.6,
            ownershipPercent: 15,
            trend: -0.8
        },
        {
            id: 4,
            name: "Summit Place",
            address: "445 Highland Ave, Jersey City",
            units: 24,
            occupancy: 95.8,
            grossRevenue: 42800,
            noi: 27400,
            capRate: 6.1,
            ownershipPercent: 15,
            trend: 3.2
        }
    ],
    
    monthlyData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenue: [285000, 288000, 292000, 295000, 298000, 302000, 305000, 301000, 304000, 308000, 305000, 305000],
        noi: [171000, 174000, 178000, 180000, 183000, 186000, 188000, 183000, 187000, 190000, 187000, 186600]
    },
    
    expenses: {
        labels: ['Property Tax', 'Insurance', 'Maintenance', 'Utilities', 'Management', 'Reserves'],
        values: [28500, 12400, 24800, 18600, 21500, 12600],
        colors: [
            'rgba(212, 168, 83, 0.9)',
            'rgba(56, 189, 248, 0.9)',
            'rgba(167, 139, 250, 0.9)',
            'rgba(16, 185, 129, 0.9)',
            'rgba(244, 63, 94, 0.9)',
            'rgba(148, 163, 184, 0.9)'
        ]
    }
};

// ========================================
// Chart Configuration
// ========================================

// Global Chart.js defaults
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';

// Revenue & NOI Chart
function createRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Create gradient for revenue
    const revenueGradient = ctx.createLinearGradient(0, 0, 0, 280);
    revenueGradient.addColorStop(0, 'rgba(212, 168, 83, 0.3)');
    revenueGradient.addColorStop(1, 'rgba(212, 168, 83, 0)');
    
    // Create gradient for NOI
    const noiGradient = ctx.createLinearGradient(0, 0, 0, 280);
    noiGradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    noiGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: portfolioData.monthlyData.labels,
            datasets: [
                {
                    label: 'Gross Revenue',
                    data: portfolioData.monthlyData.revenue,
                    borderColor: '#d4a853',
                    backgroundColor: revenueGradient,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#d4a853',
                    pointBorderColor: '#0a0e17',
                    pointBorderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: 'Net Operating Income',
                    data: portfolioData.monthlyData.noi,
                    borderColor: '#10b981',
                    backgroundColor: noiGradient,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#0a0e17',
                    pointBorderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a2234',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 14,
                    cornerRadius: 8,
                    titleFont: {
                        size: 13,
                        weight: 600
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.raw.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    min: 100000,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.08)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

// Expense Breakdown Chart
function createExpenseChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: portfolioData.expenses.labels,
            datasets: [{
                data: portfolioData.expenses.values,
                backgroundColor: portfolioData.expenses.colors,
                borderColor: '#1a2234',
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1a2234',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 14,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return '$' + context.raw.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Occupancy Chart
function createOccupancyChart() {
    const ctx = document.getElementById('occupancyChart').getContext('2d');
    
    const propertyNames = portfolioData.properties.map(p => p.name);
    const occupancyRates = portfolioData.properties.map(p => p.occupancy);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: propertyNames,
            datasets: [{
                label: 'Occupancy Rate',
                data: occupancyRates,
                backgroundColor: occupancyRates.map(rate => 
                    rate >= 95 ? 'rgba(16, 185, 129, 0.8)' :
                    rate >= 90 ? 'rgba(212, 168, 83, 0.8)' :
                    'rgba(244, 63, 94, 0.8)'
                ),
                borderRadius: 6,
                barThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1a2234',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(148, 163, 184, 0.2)',
                    borderWidth: 1,
                    padding: 14,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return context.raw.toFixed(1) + '% occupied';
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 80,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.08)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// Table Population
// ========================================

function populatePropertiesTable() {
    const tbody = document.getElementById('propertiesTableBody');
    
    const rows = portfolioData.properties.map(property => {
        const yourShare = (property.noi * (property.ownershipPercent / 100)).toFixed(0);
        const trendClass = property.trend >= 0 ? 'up' : 'down';
        const trendIcon = property.trend >= 0 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/></svg>';
        
        return `
            <tr>
                <td>
                    <div class="property-name">
                        <strong>${property.name}</strong>
                        <span>${property.address}</span>
                    </div>
                </td>
                <td>${property.units}</td>
                <td>
                    <div class="occupancy-bar">
                        <div class="occupancy-track">
                            <div class="occupancy-fill" style="width: ${property.occupancy}%"></div>
                        </div>
                        <span>${property.occupancy.toFixed(1)}%</span>
                    </div>
                </td>
                <td>$${property.grossRevenue.toLocaleString()}</td>
                <td>$${property.noi.toLocaleString()}</td>
                <td>${property.capRate.toFixed(1)}%</td>
                <td>$${parseInt(yourShare).toLocaleString()}</td>
                <td>
                    <div class="trend-indicator ${trendClass}">
                        ${trendIcon}
                        ${Math.abs(property.trend).toFixed(1)}%
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = rows;
}

// ========================================
// Event Handlers
// ========================================

function initDateSelector() {
    const dateButtons = document.querySelectorAll('.date-btn');
    
    dateButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dateButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // In a real app, this would filter the data
            const range = btn.dataset.range;
            console.log('Selected range:', range);
        });
    });
}

function initMonthPicker() {
    const monthSelect = document.getElementById('monthSelect');
    
    monthSelect.addEventListener('change', (e) => {
        const selectedMonth = e.target.value;
        console.log('Selected month:', selectedMonth);
        // In a real app, this would update the dashboard data
    });
}

// ========================================
// Initialize Dashboard
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Create charts
    createRevenueChart();
    createExpenseChart();
    createOccupancyChart();
    
    // Populate table
    populatePropertiesTable();
    
    // Initialize interactive elements
    initDateSelector();
    initMonthPicker();
    
    console.log('Meridian Portfolio Dashboard initialized');
});
