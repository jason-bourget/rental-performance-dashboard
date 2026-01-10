const express = require('express');
const cors = require('cors');
const multer = require('multer');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const { parseWorkbook } = require('./excel-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Access password - set via environment variable or use default for development
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'rrc2025';

// Trust Railway's proxy (required for secure cookies behind load balancer)
app.set('trust proxy', 1);

// Middleware
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'rrc-portfolio-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    // For API requests, return 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    // For page requests, redirect to login
    return res.redirect('/login');
}

// Login endpoint (no auth required)
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ACCESS_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Login page (no auth required)
app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Protected static files
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Serve static assets (CSS, JS) - these need to be accessible for login page too
app.use(express.static(path.join(__dirname, '..'), {
    index: false // Don't serve index.html automatically
}));

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
        }
    }
});

// ============================================
// API Endpoints (all require authentication)
// ============================================

// Get all properties
app.get('/api/properties', requireAuth, (req, res) => {
    try {
        const properties = db.prepare('SELECT * FROM properties ORDER BY name').all();
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get monthly data for dashboard
app.get('/api/dashboard/:year/:month', requireAuth, (req, res) => {
    try {
        const { year, month } = req.params;
        
        const query = `
            SELECT 
                p.id, p.name, p.units, p.ownership_percent,
                m.noi_actual, m.noi_budget,
                m.net_income_actual, m.net_income_budget,
                m.vacancies_actual, m.vacancies_budget,
                m.bad_debt_actual, m.bad_debt_budget,
                m.uncollectibles_actual, m.uncollectibles_budget
            FROM properties p
            LEFT JOIN monthly_data m ON p.id = m.property_id 
                AND m.year = ? AND m.month = ?
            ORDER BY p.name
        `;
        
        const data = db.prepare(query).all(year, month);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get trend data (12 months for a specific metric)
app.get('/api/trends/:metric', requireAuth, (req, res) => {
    try {
        const { metric } = req.params;
        const validMetrics = ['noi', 'net_income', 'vacancies', 'bad_debt', 'uncollectibles'];
        
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({ error: 'Invalid metric' });
        }
        
        // Get last 12 months of data
        const query = `
            SELECT 
                p.id, p.name, p.units,
                m.year, m.month,
                m.${metric}_actual as actual,
                m.${metric}_budget as budget
            FROM properties p
            LEFT JOIN monthly_data m ON p.id = m.property_id
            WHERE m.year IS NOT NULL
            ORDER BY p.name, m.year DESC, m.month DESC
        `;
        
        const data = db.prepare(query).all();
        
        // Group by property
        const grouped = {};
        data.forEach(row => {
            if (!grouped[row.id]) {
                grouped[row.id] = {
                    id: row.id,
                    name: row.name,
                    units: row.units,
                    months: []
                };
            }
            grouped[row.id].months.push({
                year: row.year,
                month: row.month,
                actual: row.actual || 0,
                budget: row.budget || 0
            });
        });
        
        res.json(Object.values(grouped));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get available months
app.get('/api/available-months', requireAuth, (req, res) => {
    try {
        const query = `
            SELECT DISTINCT year, month 
            FROM monthly_data 
            ORDER BY year DESC, month DESC
        `;
        const months = db.prepare(query).all();
        res.json(months);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Upload and import Excel file
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const filePath = req.file.path;
        const { results, errors } = parseWorkbook(filePath);
        
        if (results.length === 0) {
            // Log failed import
            db.prepare(`
                INSERT INTO import_log (filename, records_imported, status, error_message)
                VALUES (?, 0, 'failed', ?)
            `).run(req.file.originalname, 'No valid data found in file');
            
            return res.status(400).json({ 
                error: 'No valid data found in file',
                parseErrors: errors 
            });
        }
        
        // Upsert data for each property
        const upsert = db.prepare(`
            INSERT INTO monthly_data (
                property_id, year, month,
                noi_actual, noi_budget,
                net_income_actual, net_income_budget,
                vacancies_actual, vacancies_budget,
                bad_debt_actual, bad_debt_budget,
                uncollectibles_actual, uncollectibles_budget
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(property_id, year, month) DO UPDATE SET
                noi_actual = excluded.noi_actual,
                noi_budget = excluded.noi_budget,
                net_income_actual = excluded.net_income_actual,
                net_income_budget = excluded.net_income_budget,
                vacancies_actual = excluded.vacancies_actual,
                vacancies_budget = excluded.vacancies_budget,
                bad_debt_actual = excluded.bad_debt_actual,
                bad_debt_budget = excluded.bad_debt_budget,
                uncollectibles_actual = excluded.uncollectibles_actual,
                uncollectibles_budget = excluded.uncollectibles_budget,
                imported_at = CURRENT_TIMESTAMP
        `);
        
        const insertAll = db.transaction((data) => {
            for (const row of data) {
                upsert.run(
                    row.propertyId,
                    row.year,
                    row.month,
                    row.noi_actual || 0,
                    row.noi_budget || 0,
                    row.net_income_actual || 0,
                    row.net_income_budget || 0,
                    row.vacancies_actual || 0,
                    row.vacancies_budget || 0,
                    row.bad_debt_actual || 0,
                    row.bad_debt_budget || 0,
                    row.uncollectibles_actual || 0,
                    row.uncollectibles_budget || 0
                );
            }
        });
        
        insertAll(results);
        
        // Log successful import
        db.prepare(`
            INSERT INTO import_log (filename, report_month, report_year, records_imported, status)
            VALUES (?, ?, ?, ?, 'success')
        `).run(req.file.originalname, results[0]?.month, results[0]?.year, results.length);
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            imported: results.length,
            month: results[0]?.month,
            year: results[0]?.year,
            properties: results.map(r => r.propertyName),
            errors: errors.length > 0 ? errors : undefined
        });
        
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get import history
app.get('/api/imports', requireAuth, (req, res) => {
    try {
        const imports = db.prepare(`
            SELECT * FROM import_log 
            ORDER BY imported_at DESC 
            LIMIT 20
        `).all();
        res.json(imports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update property settings (units and ownership)
app.put('/api/properties/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { units, ownership_percent } = req.body;
        
        db.prepare(`
            UPDATE properties 
            SET units = COALESCE(?, units),
                ownership_percent = COALESCE(?, ownership_percent)
            WHERE id = ?
        `).run(units, ownership_percent, id);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legacy endpoint for backwards compatibility
app.put('/api/properties/:id/ownership', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { ownership_percent } = req.body;
        
        db.prepare(`
            UPDATE properties SET ownership_percent = ? WHERE id = ?
        `).run(ownership_percent, id);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin`);
});
