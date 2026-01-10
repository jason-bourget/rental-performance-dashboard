const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('Budget Variance Report.xlsx');

// Key terms to search for
const searchTerms = [
    'Net Operating Income',
    'NOI',
    'Net Income',
    'Total Income',
    'Total Expenses',
    'Total Operating',
    'Cash Flow',
    'Vacancies',
    'Bad Debt',
    'Uncollect'
];

// Just analyze the first sheet to understand structure
const sheetName = workbook.SheetNames[0];
console.log(`\n=== Analyzing: ${sheetName} (${workbook.Sheets[sheetName]['A1']?.v}) ===\n`);

const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

console.log('=== KEY ROWS (searching for important metrics) ===\n');

data.forEach((row, idx) => {
    const rowText = row[0]?.toString() || '';
    
    // Check if this row contains any search terms
    const matchesTerm = searchTerms.some(term => 
        rowText.toLowerCase().includes(term.toLowerCase())
    );
    
    // Also show "Total" rows to understand structure
    const isTotal = rowText.includes('Total');
    
    if (matchesTerm || isTotal) {
        const nonEmpty = row.map((cell, colIdx) => {
            if (cell === '' || cell === null || cell === undefined) return null;
            return `[${colIdx}]${cell}`;
        }).filter(x => x !== null);
        
        if (nonEmpty.length > 0) {
            console.log(`Row ${idx + 1}: ${nonEmpty.join(' | ')}`);
        }
    }
});

console.log('\n=== LAST 30 ROWS (to find bottom-line figures) ===\n');

data.slice(-30).forEach((row, idx) => {
    const actualIdx = data.length - 30 + idx;
    const nonEmpty = row.map((cell, colIdx) => {
        if (cell === '' || cell === null || cell === undefined) return null;
        return `[${colIdx}]${cell}`;
    }).filter(x => x !== null);
    
    if (nonEmpty.length > 0) {
        console.log(`Row ${actualIdx + 1}: ${nonEmpty.join(' | ')}`);
    }
});
