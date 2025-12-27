const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './data/cdc.db';
const schemaPath = path.join(__dirname, 'schema.sql');

// 確保資料目錄存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the CDC database.');
});

// 讀取並執行架構
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating schema:', err.message);
        process.exit(1);
    }
    console.log('Database schema created successfully.');

    // 插入預設資料
    insertDefaultData();
});

function insertDefaultData() {
    db.serialize(() => {
        // 插入預設管理員使用者
        db.run(`
            INSERT OR IGNORE INTO users (username, email, full_name, department, role)
            VALUES ('admin', 'admin@company.com', 'System Administrator', 'IT', 'admin')
        `, (err) => {
            if (err) console.error('Error inserting admin user:', err.message);
            else console.log('Default admin user created.');
        });

        // 插入測試使用者
        db.run(`
            INSERT OR IGNORE INTO users (username, email, full_name, department, role)
            VALUES ('user1', 'user1@company.com', 'Test User', 'Procurement', 'user')
        `, (err) => {
            if (err) console.error('Error inserting test user:', err.message);
            else console.log('Default test user created.');
        });

        // 插入預設請購案件類型
        const caseTypes = [
            ['GENERAL', '一般請購', 'General procurement requests'],
            ['IT', '資訊設備', 'IT equipment procurement'],
            ['OFFICE', '辦公用品', 'Office supplies'],
            ['SERVICE', '勞務採購', 'Service procurement'],
            ['FACILITY', '設施維護', 'Facility maintenance']
        ];

        const caseTypeStmt = db.prepare(`
            INSERT OR IGNORE INTO case_types (code, name, description)
            VALUES (?, ?, ?)
        `);

        caseTypes.forEach(ct => {
            caseTypeStmt.run(ct, (err) => {
                if (err) console.error('Error inserting case type:', err.message);
            });
        });

        caseTypeStmt.finalize(() => {
            console.log('Default case types created.');
            console.log('\nDatabase initialization completed successfully!');
            db.close();
        });
    });
}
