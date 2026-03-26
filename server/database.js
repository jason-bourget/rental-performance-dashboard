const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use persistent volume in production, local directory in development
const dataDir = process.env.NODE_ENV === 'production' 
    ? '/app/data' 
    : __dirname;

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'portfolio.db');
console.log(`Database path: ${dbPath}`);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
    -- Properties table
    CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        units INTEGER NOT NULL,
        ownership_percent REAL NOT NULL DEFAULT 0
    );

    -- Monthly financial data
    CREATE TABLE IF NOT EXISTS monthly_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        noi_actual REAL DEFAULT 0,
        noi_budget REAL DEFAULT 0,
        net_income_actual REAL DEFAULT 0,
        net_income_budget REAL DEFAULT 0,
        vacancies_actual REAL DEFAULT 0,
        vacancies_budget REAL DEFAULT 0,
        bad_debt_actual REAL DEFAULT 0,
        bad_debt_budget REAL DEFAULT 0,
        uncollectibles_actual REAL DEFAULT 0,
        uncollectibles_budget REAL DEFAULT 0,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        UNIQUE(property_id, year, month)
    );

    -- Import log
    CREATE TABLE IF NOT EXISTS import_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        report_month INTEGER,
        report_year INTEGER,
        imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        records_imported INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success',
        error_message TEXT
    );
`);

// Seed properties if not exist
const insertProperty = db.prepare(`
    INSERT OR IGNORE INTO properties (id, code, name, units, ownership_percent)
    VALUES (?, ?, ?, ?, ?)
`);

const properties = [
    ['aspen-i', '010', 'Aspen Apartments', 144, 5.0],
    ['seasons-i', '011', 'Seasons Apartments', 156, 8.0],
    ['aspen-ii', '012', 'Aspen Apartments II', 132, 5.0],
    ['seasons-ii', '013', 'Seasons Apartments II', 120, 8.0],
    ['hillside', '031', 'Hillside Apartments', 204, 15.0],
    ['alexis-park', '054', 'Alexis Park', 216, 10.0],
    ['sommerset', '060', 'Sommerset Apartments', 144, 12.0]
];

const insertMany = db.transaction((props) => {
    for (const prop of props) {
        insertProperty.run(...prop);
    }
});

insertMany(properties);

console.log('Database initialized with properties');

module.exports = db;
