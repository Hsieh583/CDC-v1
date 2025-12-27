const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const caseRoutes = require('./routes/case.routes');
const adminRoutes = require('./routes/admin-v2.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 確保 uploads 目錄存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中介軟體
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 從 public 目錄提供靜態檔案
app.use(express.static(path.join(__dirname, '../public')));

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'CDC Procurement Case Document Upload Portal is running' });
});

// API 路由
app.use('/api/cases', caseRoutes);
app.use('/api/admin', adminRoutes);

// API 文件端點
app.get('/api', (req, res) => {
    res.json({
        name: 'CDC Procurement Case Document Upload Portal',
        version: '1.0.0',
        description: 'Controlled document upload portal for procurement cases with SharePoint integration',
        endpoints: {
            cases: {
                'POST /api/cases': 'Create a new procurement case',
                'POST /api/cases/upload': 'Upload a file to a case (main document or attachment)',
                'GET /api/cases': 'Get all cases (with pagination)',
                'GET /api/cases/search': 'Search cases with filters',
                'GET /api/cases/:id': 'Get case details with all files',
                'PUT /api/cases/:id': 'Update case information',
                'GET /api/cases/:case_id/files': 'Get all files for a case',
                'GET /api/cases/files/:file_id/download': 'Download a specific file'
            },
            admin: {
                'GET /api/admin/case-types': 'Get all case types',
                'POST /api/admin/case-types': 'Create a case type',
                'PUT /api/admin/case-types/:id': 'Update a case type',
                'GET /api/admin/users': 'Get all users',
                'POST /api/admin/users': 'Create a user',
                'PUT /api/admin/users/:id': 'Update a user',
                'GET /api/admin/audit-logs': 'Get audit logs'
            }
        },
        features: [
            'Procurement case management',
            'One main document + multiple attachments per case',
            'SharePoint folder-based storage with metadata',
            'Support for any file format',
            'SQLite index for quick search and retrieval',
            'Audit logging for all operations',
            'Simple user and case type management',
            'No approval workflow - focus on controlled upload'
        ],
        design_principles: [
            'Minimal change from CDC-v1',
            'Low friction deployment',
            'Case-based organization (not document control)',
            'Metadata at folder level (case number, department, amount, applicant)',
            'No document classification or approval process'
        ]
    });
});

// 錯誤處理中介軟體
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large' });
        }
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: err.message || 'Internal server error' });
});

// 404 處理常式
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   CDC Procurement Case Document Upload Portal                ║
║   請購案件文件受控上傳入口                                        ║
║                                                               ║
║   Server is running on http://localhost:${PORT}                 ║
║                                                               ║
║   API Documentation: http://localhost:${PORT}/api               ║
║   Health Check: http://localhost:${PORT}/health                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;
