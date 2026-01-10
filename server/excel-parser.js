const XLSX = require('xlsx');

// Property code to ID mapping
const PROPERTY_MAP = {
    '010': 'aspen-i',
    '011': 'seasons-i',
    '012': 'aspen-ii',
    '013': 'seasons-ii',
    '031': 'hillside',
    '054': 'alexis-park',
    '060': 'sommerset'
};

// Parse month from report header (e.g., "November 2025 - Accrual...")
function parseReportDate(headerText) {
    const monthNames = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    };
    
    const match = headerText.toLowerCase().match(/(\w+)\s+(\d{4})/);
    if (match) {
        const month = monthNames[match[1]];
        const year = parseInt(match[2]);
        if (month && year) {
            return { month, year };
        }
    }
    return null;
}

// Find a row by searching for text in the first column
function findRowByText(data, searchText, exactMatch = false) {
    for (let i = 0; i < data.length; i++) {
        const cellValue = (data[i][0] || '').toString();
        if (exactMatch) {
            if (cellValue.trim() === searchText) return { row: data[i], index: i };
        } else {
            if (cellValue.includes(searchText)) return { row: data[i], index: i };
        }
    }
    return null;
}

// Extract a numeric value, handling negatives and formatting
function extractNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    // Remove currency symbols and commas, parse as float
    const cleaned = value.toString().replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Parse a single worksheet
function parseWorksheet(sheet, sheetName) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    // Get property ID from sheet code
    const propertyId = PROPERTY_MAP[sheetName];
    if (!propertyId) {
        console.warn(`Unknown property code: ${sheetName}`);
        return null;
    }
    
    // Get property name from row 1
    const propertyName = data[0]?.[0] || 'Unknown';
    
    // Get report date from row 4 (index 3)
    const dateHeader = data[3]?.[0] || '';
    const reportDate = parseReportDate(dateHeader);
    if (!reportDate) {
        console.warn(`Could not parse date from: ${dateHeader}`);
        return null;
    }
    
    // Column indices for monthly data
    const MONTHLY_ACTUAL = 1;
    const MONTHLY_BUDGET = 2;
    
    // Find key metrics by searching for specific text
    const metrics = {};
    
    // NOI - search for "NET OPERATING INCOME" (exact match on trimmed value)
    const noiRow = findRowByText(data, 'NET OPERATING INCOME', true);
    if (noiRow) {
        metrics.noi_actual = extractNumber(noiRow.row[MONTHLY_ACTUAL]);
        metrics.noi_budget = extractNumber(noiRow.row[MONTHLY_BUDGET]);
        console.log(`  NOI: ${metrics.noi_actual} / ${metrics.noi_budget}`);
    } else {
        console.warn(`  NOI: NOT FOUND`);
    }
    
    // Net Income - search for "NET INCOME" (exact match)
    const netIncomeRow = findRowByText(data, 'NET INCOME', true);
    if (netIncomeRow) {
        metrics.net_income_actual = extractNumber(netIncomeRow.row[MONTHLY_ACTUAL]);
        metrics.net_income_budget = extractNumber(netIncomeRow.row[MONTHLY_BUDGET]);
        console.log(`  Net Income: ${metrics.net_income_actual} / ${metrics.net_income_budget}`);
    } else {
        console.warn(`  Net Income: NOT FOUND`);
    }
    
    // Vacancies - search for "5210-000 Vacancies"
    const vacanciesRow = findRowByText(data, '5210-000 Vacancies');
    if (vacanciesRow) {
        // Vacancies are stored as negative, convert to positive for display
        metrics.vacancies_actual = Math.abs(extractNumber(vacanciesRow.row[MONTHLY_ACTUAL]));
        metrics.vacancies_budget = Math.abs(extractNumber(vacanciesRow.row[MONTHLY_BUDGET]));
        console.log(`  Vacancies: ${metrics.vacancies_actual} / ${metrics.vacancies_budget}`);
    } else {
        console.warn(`  Vacancies: NOT FOUND`);
    }
    
    // Bad Debt - search for "6370-000 Bad Debt"
    const badDebtRow = findRowByText(data, '6370-000 Bad Debt');
    if (badDebtRow) {
        // Bad debt is typically negative, convert to positive
        metrics.bad_debt_actual = Math.abs(extractNumber(badDebtRow.row[MONTHLY_ACTUAL]));
        metrics.bad_debt_budget = Math.abs(extractNumber(badDebtRow.row[MONTHLY_BUDGET]));
        console.log(`  Bad Debt: ${metrics.bad_debt_actual} / ${metrics.bad_debt_budget}`);
    } else {
        console.warn(`  Bad Debt: NOT FOUND`);
    }
    
    // Uncollectibles (Non-Rent) - search for "6370-100 Uncollectible"
    const uncollectiblesRow = findRowByText(data, '6370-100 Uncollectible');
    if (uncollectiblesRow) {
        metrics.uncollectibles_actual = Math.abs(extractNumber(uncollectiblesRow.row[MONTHLY_ACTUAL]));
        metrics.uncollectibles_budget = Math.abs(extractNumber(uncollectiblesRow.row[MONTHLY_BUDGET]));
        console.log(`  Uncollectibles: ${metrics.uncollectibles_actual} / ${metrics.uncollectibles_budget}`);
    } else {
        console.warn(`  Uncollectibles: NOT FOUND`);
    }
    
    return {
        propertyId,
        propertyName,
        year: reportDate.year,
        month: reportDate.month,
        ...metrics
    };
}

// Parse entire workbook
function parseWorkbook(filePath) {
    const workbook = XLSX.readFile(filePath);
    const results = [];
    const errors = [];
    
    for (const sheetName of workbook.SheetNames) {
        try {
            const sheet = workbook.Sheets[sheetName];
            const result = parseWorksheet(sheet, sheetName);
            if (result) {
                results.push(result);
                console.log(`Parsed: ${result.propertyName} - ${result.month}/${result.year}`);
            }
        } catch (err) {
            errors.push({ sheet: sheetName, error: err.message });
            console.error(`Error parsing sheet ${sheetName}:`, err.message);
        }
    }
    
    return { results, errors };
}

module.exports = { parseWorkbook, parseWorksheet, PROPERTY_MAP };
