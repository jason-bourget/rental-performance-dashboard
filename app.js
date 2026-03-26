/**
 * Meridian Capital - Portfolio Dashboard
 * Apartment Building Performance Analytics
 */

const API_BASE = '';

// ========================================
// State Management
// ========================================

let state = {
    properties: [],
    dashboardData: [],
    trendData: {},
    selectedMetric: 'noi',
    viewMode: 'absolute', // 'absolute' or 'perUnit'
    selectedProperty: 'all',
    ownershipView: false,
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() || 12, // Default to current month or December
    availableMonths: [],
    trendChart: null,
    kpiView: 'monthly',
    kpiAverageData: null
};

// ========================================
// API Functions
// ========================================

async function fetchDashboardData(year, month) {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/${year}/${month}`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        return await response.json();
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        return [];
    }
}

async function fetchTrendData(metric) {
    try {
        const response = await fetch(`${API_BASE}/api/trends/${metric}`);
        if (!response.ok) throw new Error('Failed to fetch trend data');
        return await response.json();
    } catch (err) {
        console.error('Error fetching trend data:', err);
        return [];
    }
}

async function fetchAvailableMonths() {
    try {
        const response = await fetch(`${API_BASE}/api/available-months`);
        if (!response.ok) throw new Error('Failed to fetch available months');
        return await response.json();
    } catch (err) {
        console.error('Error fetching available months:', err);
        return [];
    }
}

async function fetchProperties() {
    try {
        const response = await fetch(`${API_BASE}/api/properties`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        return await response.json();
    } catch (err) {
        console.error('Error fetching properties:', err);
        return [];
    }
}

async function fetchKpiAverages(year, month) {
    try {
        const response = await fetch(`${API_BASE}/api/kpi-averages/${year}/${month}`);
        if (!response.ok) throw new Error('Failed to fetch KPI averages');
        return await response.json();
    } catch (err) {
        console.error('Error fetching KPI averages:', err);
        return [];
    }
}

// ========================================
// Chart Configuration
// ========================================

Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';

const chartColors = [
    '#d4a853', '#10b981', '#38bdf8', '#a78bfa', '#f43f5e', '#fb923c', '#14b8a6'
];

const metricLabels = {
    noi: 'Net Operating Income',
    net_income: 'Net Income',
    vacancies: 'Vacancies',
    bad_debt: 'Bad Debt (Rent)',
    uncollectibles: 'Uncollectibles (Non-Rent)'
};

// ========================================
// Chart Functions
// ========================================

function applyOwnership(value, ownershipPct) {
    if (!state.ownershipView) return value;
    return value * (ownershipPct / 100);
}

// Generate 12 months ending at the specified year/month
function generate12MonthRange(endYear, endMonth) {
    const months = [];
    let year = endYear;
    let month = endMonth;
    
    for (let i = 0; i < 12; i++) {
        months.unshift({ year, month });
        month--;
        if (month < 1) {
            month = 12;
            year--;
        }
    }
    return months;
}

async function createTrendChart() {
    const ctx = document.getElementById('trendChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (state.trendChart) {
        state.trendChart.destroy();
    }
    
    // Fetch trend data for selected metric
    const trendData = await fetchTrendData(state.selectedMetric);
    if (!trendData.length) {
        console.log('No trend data available');
        return;
    }
    
    const isPerUnit = state.viewMode === 'perUnit';
    const datasets = [];
    
    // Generate 12-month range ending at selected reporting period
    const monthRange = generate12MonthRange(state.selectedYear, state.selectedMonth);
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = monthRange.map(m => `${monthNames[m.month]} ${String(m.year).slice(2)}`);
    
    const propertiesToShow = state.selectedProperty === 'all' 
        ? trendData 
        : trendData.filter(p => p.id === state.selectedProperty);
    
    propertiesToShow.forEach((prop, index) => {
        // Get property ownership
        const propInfo = state.properties.find(p => p.id === prop.id);
        const ownership = propInfo?.ownership_percent || 0;
        
        // Map data to month range - use null for missing months
        const data = monthRange.map(({ year, month }) => {
            const monthData = prop.months.find(m => m.year === year && m.month === month);
            if (!monthData) return null; // Missing data renders as gap
            
            let value = monthData.actual || 0;
            
            if (isPerUnit && prop.units) {
                value = value / prop.units;
            } else if (!isPerUnit) {
                value = applyOwnership(value, ownership);
            }
            
            return value;
        });
        
        const color = chartColors[index % chartColors.length];
        
        datasets.push({
            label: prop.name + (state.ownershipView && !isPerUnit ? ` (${ownership}%)` : ''),
            data: data,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2.5,
            fill: state.selectedProperty !== 'all',
            tension: 0,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: color,
            pointBorderColor: '#0a0e17',
            pointBorderWidth: 2,
            spanGaps: false // Don't connect lines across missing data
        });
    });
    
    const yAxisLabel = isPerUnit 
        ? `${metricLabels[state.selectedMetric]} per Unit`
        : metricLabels[state.selectedMetric];
    
    state.trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    display: state.selectedProperty === 'all',
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 }
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
                            const value = context.raw;
                            if (isPerUnit) {
                                return context.dataset.label + ': $' + value.toFixed(2);
                            }
                            return context.dataset.label + ': $' + Math.round(value).toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.08)' },
                    title: { display: true, text: yAxisLabel, color: '#64748b', font: { size: 11, weight: 500 } },
                    ticks: {
                        font: { size: 11 },
                        callback: function(value) {
                            if (isPerUnit) return '$' + value.toFixed(0);
                            return '$' + (value >= 1000 ? (value/1000).toFixed(0) + 'k' : value);
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// Table & Summary Functions  
// ========================================

function populateBudgetTable() {
    const tbody = document.getElementById('budgetTableBody');
    if (!tbody) return;
    
    if (!state.dashboardData.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#64748b;">No data available. Upload a Budget Variance Report to get started.</td></tr>';
        return;
    }
    
    const rows = state.dashboardData.map(prop => {
        const ownership = prop.ownership_percent || 0;
        const multiplier = state.ownershipView ? (ownership / 100) : 1;
        
        const formatVariance = (actual, budget) => {
            const adjActual = Math.round((actual || 0) * multiplier);
            const adjBudget = Math.round((budget || 0) * multiplier);
            const diff = adjActual - adjBudget;
            const pct = adjBudget !== 0 ? ((diff / adjBudget) * 100) : 0;
            const sign = pct >= 0 ? '+' : '';
            
            return {
                actual: '$' + adjActual.toLocaleString(),
                budget: '$' + adjBudget.toLocaleString(),
                pct: sign + pct.toFixed(1) + '%',
                isPositive: diff >= 0
            };
        };
        
        const formatVarianceInverse = (actual, budget) => {
            const result = formatVariance(actual, budget);
            result.isPositive = !result.isPositive || (actual === 0 && budget === 0);
            return result;
        };
        
        const noi = formatVariance(prop.noi_actual, prop.noi_budget);
        const vacancies = formatVarianceInverse(prop.vacancies_actual, prop.vacancies_budget);
        const badDebt = formatVarianceInverse(prop.bad_debt_actual, prop.bad_debt_budget);
        const uncollectibles = formatVarianceInverse(prop.uncollectibles_actual, prop.uncollectibles_budget);
        const netIncome = formatVariance(prop.net_income_actual, prop.net_income_budget);
        
        const ownershipBadge = state.ownershipView ? `<span class="ownership-badge">${ownership}%</span>` : '';
        
        return `
            <tr>
                <td class="property-cell">
                    <strong>${prop.name}</strong>
                    <span>${prop.units} units ${ownershipBadge}</span>
                </td>
                <td>
                    <div class="budget-cell">
                        <span class="actual">${noi.actual}</span>
                        <span class="budget">Budget: ${noi.budget}</span>
                        <span class="variance ${noi.isPositive ? 'positive' : 'negative'}">${noi.pct}</span>
                    </div>
                </td>
                <td>
                    <div class="budget-cell">
                        <span class="actual">${vacancies.actual}</span>
                        <span class="budget">Budget: ${vacancies.budget}</span>
                        <span class="variance ${vacancies.isPositive ? 'positive' : 'negative'}">${vacancies.pct}</span>
                    </div>
                </td>
                <td>
                    <div class="budget-cell">
                        <span class="actual">${badDebt.actual}</span>
                        <span class="budget">Budget: ${badDebt.budget}</span>
                        <span class="variance ${badDebt.isPositive ? 'positive' : 'negative'}">${badDebt.pct}</span>
                    </div>
                </td>
                <td>
                    <div class="budget-cell">
                        <span class="actual">${uncollectibles.actual}</span>
                        <span class="budget">Budget: ${uncollectibles.budget}</span>
                        <span class="variance ${uncollectibles.isPositive ? 'positive' : 'negative'}">${uncollectibles.pct}</span>
                    </div>
                </td>
                <td>
                    <div class="budget-cell">
                        <span class="actual">${netIncome.actual}</span>
                        <span class="budget">Budget: ${netIncome.budget}</span>
                        <span class="variance ${netIncome.isPositive ? 'positive' : 'negative'}">${netIncome.pct}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tbody.innerHTML = rows;
}

function updatePortfolioSummary() {
    const totals = {
        noi: { actual: 0, budget: 0 },
        netIncome: { actual: 0, budget: 0 },
        vacancies: { actual: 0, budget: 0 },
        badDebt: { actual: 0, budget: 0 },
        uncollectibles: { actual: 0, budget: 0 }
    };
    
    const isAverage = state.kpiView === 'average';
    const sourceData = isAverage ? state.kpiAverageData : state.dashboardData;
    
    if (!sourceData || !sourceData.length) {
        return;
    }

    const actualKey = isAverage ? 'avg_actual' : 'actual';
    const budgetKey = isAverage ? 'avg_budget' : 'budget';
    
    sourceData.forEach(prop => {
        const multiplier = state.ownershipView ? ((prop.ownership_percent || 0) / 100) : 1;
        
        totals.noi.actual += (prop[`noi_${actualKey}`] || 0) * multiplier;
        totals.noi.budget += (prop[`noi_${budgetKey}`] || 0) * multiplier;
        totals.netIncome.actual += (prop[`net_income_${actualKey}`] || 0) * multiplier;
        totals.netIncome.budget += (prop[`net_income_${budgetKey}`] || 0) * multiplier;
        totals.vacancies.actual += (prop[`vacancies_${actualKey}`] || 0) * multiplier;
        totals.vacancies.budget += (prop[`vacancies_${budgetKey}`] || 0) * multiplier;
        totals.badDebt.actual += (prop[`bad_debt_${actualKey}`] || 0) * multiplier;
        totals.badDebt.budget += (prop[`bad_debt_${budgetKey}`] || 0) * multiplier;
        totals.uncollectibles.actual += (prop[`uncollectibles_${actualKey}`] || 0) * multiplier;
        totals.uncollectibles.budget += (prop[`uncollectibles_${budgetKey}`] || 0) * multiplier;
    });
    
    const formatCurrency = (val) => {
        if (val >= 1000000) return '$' + (val / 1000000).toFixed(2) + 'M';
        if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'k';
        return '$' + Math.round(val).toLocaleString();
    };
    
    // Compute 12-month average totals (for the inline avg line in monthly mode)
    const avgTotals = {
        noi: 0, netIncome: 0, vacancies: 0, badDebt: 0, uncollectibles: 0
    };
    const hasAvgData = state.kpiAverageData && state.kpiAverageData.length > 0;
    if (hasAvgData) {
        state.kpiAverageData.forEach(prop => {
            const multiplier = state.ownershipView ? ((prop.ownership_percent || 0) / 100) : 1;
            avgTotals.noi += (prop.noi_avg_actual || 0) * multiplier;
            avgTotals.netIncome += (prop.net_income_avg_actual || 0) * multiplier;
            avgTotals.vacancies += (prop.vacancies_avg_actual || 0) * multiplier;
            avgTotals.badDebt += (prop.bad_debt_avg_actual || 0) * multiplier;
            avgTotals.uncollectibles += (prop.uncollectibles_avg_actual || 0) * multiplier;
        });
    }

    const budgetLabel = isAverage ? 'Avg Budget' : 'Budget';
    
    const updateKpiCard = (id, actual, budget, avgValue, lowerIsBetter = false) => {
        const diff = actual - budget;
        const pct = budget !== 0 ? ((diff / budget) * 100) : 0;
        const isPositive = lowerIsBetter ? diff <= 0 : diff >= 0;
        const sign = pct >= 0 ? '+' : '';
        
        const valueEl = document.getElementById(`kpi${id}`);
        const budgetEl = document.getElementById(`kpi${id}Budget`);
        const varianceEl = document.getElementById(`kpi${id}Variance`);
        const avgEl = document.getElementById(`kpi${id}Avg`);
        const avgLineEl = document.getElementById(`kpi${id}AvgLine`);
        
        if (valueEl) valueEl.textContent = formatCurrency(actual);
        if (budgetEl) {
            budgetEl.textContent = formatCurrency(budget);
            budgetEl.parentElement.firstChild.textContent = `${budgetLabel}: `;
        }
        if (varianceEl) {
            varianceEl.textContent = sign + pct.toFixed(1) + '%';
            varianceEl.classList.toggle('negative', !isPositive);
        }
        if (avgLineEl) {
            avgLineEl.style.display = isAverage ? 'none' : '';
        }
        if (avgEl && hasAvgData) {
            avgEl.textContent = formatCurrency(avgValue);
        }
    };
    
    updateKpiCard('NOI', totals.noi.actual, totals.noi.budget, avgTotals.noi, false);
    updateKpiCard('NetIncome', totals.netIncome.actual, totals.netIncome.budget, avgTotals.netIncome, false);
    updateKpiCard('Vacancies', totals.vacancies.actual, totals.vacancies.budget, avgTotals.vacancies, true);
    updateKpiCard('BadDebt', totals.badDebt.actual, totals.badDebt.budget, avgTotals.badDebt, true);
    updateKpiCard('Uncollectibles', totals.uncollectibles.actual, totals.uncollectibles.budget, avgTotals.uncollectibles, true);
    
    // Update toggle button
    const toggleBtn = document.getElementById('ownershipToggle');
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', state.ownershipView);
        toggleBtn.querySelector('.toggle-label').textContent = state.ownershipView ? 'RRC Share' : 'Property Totals';
    }
}

// ========================================
// UI Functions
// ========================================

function populateMonthSelector() {
    const select = document.getElementById('monthSelect');
    if (!select) return;
    
    if (!state.availableMonths.length) {
        select.innerHTML = '<option value="">No data available</option>';
        return;
    }
    
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    select.innerHTML = state.availableMonths.map(m => 
        `<option value="${m.year}-${m.month}">${monthNames[m.month]} ${m.year}</option>`
    ).join('');
    
    // Select first available month
    if (state.availableMonths.length > 0) {
        state.selectedYear = state.availableMonths[0].year;
        state.selectedMonth = state.availableMonths[0].month;
    }
}

function populatePropertyFilter() {
    const select = document.getElementById('propertyFilter');
    if (!select) return;
    
    const options = ['<option value="all">All Properties</option>'];
    state.properties.forEach(p => {
        options.push(`<option value="${p.id}">${p.name}</option>`);
    });
    select.innerHTML = options.join('');
}

function updateBudgetSectionTitle() {
    const subtitle = document.querySelector('.budget-section .section-subtitle');
    if (subtitle && state.selectedMonth && state.selectedYear) {
        const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        subtitle.textContent = `${monthNames[state.selectedMonth]} ${state.selectedYear} Actuals vs. Budget`;
    }
}

// ========================================
// Event Handlers
// ========================================

function initControls() {
    // Metric selector
    document.querySelectorAll('.metric-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedMetric = btn.dataset.metric;
            createTrendChart();
        });
    });
    
    // View mode toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.viewMode = btn.dataset.view;
            createTrendChart();
        });
    });
    
    // Property filter
    const propertySelect = document.getElementById('propertyFilter');
    if (propertySelect) {
        propertySelect.addEventListener('change', (e) => {
            state.selectedProperty = e.target.value;
            createTrendChart();
        });
    }
    
    // KPI view toggle (Monthly / 12-Mo Avg)
    document.querySelectorAll('.kpi-view-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.kpi-view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.kpiView = btn.dataset.kpiView;
            
            if (state.kpiView === 'average' && !state.kpiAverageData) {
                state.kpiAverageData = await fetchKpiAverages(state.selectedYear, state.selectedMonth);
            }
            updatePortfolioSummary();
        });
    });

    // Ownership toggle
    const ownershipToggle = document.getElementById('ownershipToggle');
    if (ownershipToggle) {
        ownershipToggle.addEventListener('click', () => {
            state.ownershipView = !state.ownershipView;
            refreshAllViews();
        });
    }
    
    // Month picker - updates both dashboard data AND trend chart lookback period
    const monthSelect = document.getElementById('monthSelect');
    if (monthSelect) {
        monthSelect.addEventListener('change', async (e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            state.selectedYear = year;
            state.selectedMonth = month;
            
            state.dashboardData = await fetchDashboardData(year, month);
            state.kpiAverageData = await fetchKpiAverages(year, month);
            
            updateBudgetSectionTitle();
            populateBudgetTable();
            updatePortfolioSummary();
            createTrendChart();
        });
    }
}

function refreshAllViews() {
    createTrendChart();
    populateBudgetTable();
    updatePortfolioSummary();
}

// ========================================
// Initialize Dashboard
// ========================================

async function initDashboard() {
    // Fetch initial data
    state.properties = await fetchProperties();
    state.availableMonths = await fetchAvailableMonths();
    
    // Populate UI
    populatePropertyFilter();
    populateMonthSelector();
    
    // Fetch dashboard data and 12-month averages for selected month
    if (state.availableMonths.length > 0) {
        const { year, month } = state.availableMonths[0];
        state.selectedYear = year;
        state.selectedMonth = month;
        state.dashboardData = await fetchDashboardData(year, month);
        state.kpiAverageData = await fetchKpiAverages(year, month);
    }
    
    // Update displays
    updateBudgetSectionTitle();
    populateBudgetTable();
    updatePortfolioSummary();
    createTrendChart();
    
    // Initialize controls
    initControls();
    
    console.log('Dashboard initialized');
}

document.addEventListener('DOMContentLoaded', initDashboard);
