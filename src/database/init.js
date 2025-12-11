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
            INSERT OR IGNORE INTO users (username, email, full_name, role)
            VALUES ('admin', 'admin@company.com', 'System Administrator', 'admin')
        `, (err) => {
            if (err) console.error('Error inserting admin user:', err.message);
            else console.log('Default admin user created.');
        });

        // 插入預設類別
        const categories = [
            ['QMS', '品質管理文件', 'Quality Management System documents'],
            ['SOP', '標準作業程序', 'Standard Operating Procedures'],
            ['SPEC', '規格文件', 'Specification documents'],
            ['FORM', '表單文件', 'Form documents'],
            ['PROC', '程序文件', 'Procedure documents']
        ];

        const categoryStmt = db.prepare(`
            INSERT OR IGNORE INTO categories (code, name, description)
            VALUES (?, ?, ?)
        `);

        categories.forEach(cat => {
            categoryStmt.run(cat, (err) => {
                if (err) console.error('Error inserting category:', err.message);
            });
        });

        categoryStmt.finalize(() => {
            console.log('Default categories created.');
        });

        // 插入預設簽核流程
        const workflows = [
            // QMS 簽核流程（3 階段）
            [1, 1, '作者提交', 'author'],
            [1, 2, '審核人審核', 'reviewer'],
            [1, 3, '核准人核准', 'approver'],
            // SOP 簽核流程
            [2, 1, '作者提交', 'author'],
            [2, 2, '審核人審核', 'reviewer'],
            [2, 3, '核准人核准', 'approver'],
            // SPEC 簽核流程
            [3, 1, '作者提交', 'author'],
            [3, 2, '審核人審核', 'reviewer'],
            [3, 3, '核准人核准', 'approver'],
            // FORM 簽核流程
            [4, 1, '作者提交', 'author'],
            [4, 2, '審核人審核', 'reviewer'],
            [4, 3, '核准人核准', 'approver'],
            // PROC 簽核流程
            [5, 1, '作者提交', 'author'],
            [5, 2, '審核人審核', 'reviewer'],
            [5, 3, '核准人核准', 'approver']
        ];

        const workflowStmt = db.prepare(`
            INSERT OR IGNORE INTO approval_workflows (category_id, stage_number, stage_name, role_required)
            VALUES (?, ?, ?, ?)
        `);

        workflows.forEach(wf => {
            workflowStmt.run(wf, (err) => {
                if (err) console.error('Error inserting workflow:', err.message);
            });
        });

        workflowStmt.finalize(() => {
            console.log('Default approval workflows created.');
            console.log('\nDatabase initialization completed successfully!');
            db.close();
        });
    });
}
