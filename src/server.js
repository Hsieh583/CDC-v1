const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const documentRoutes = require('./routes/document.routes');
const approvalRoutes = require('./routes/approval.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'CDC Document Control Center is running' });
});

// API routes
app.use('/api/documents', documentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/admin', adminRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'CDC Document Control Center API',
        version: '1.0.0',
        description: 'SharePoint-based document management platform with approval workflow',
        endpoints: {
            documents: {
                'POST /api/documents': 'Create a new document',
                'POST /api/documents/upload-version': 'Upload a new version',
                'GET /api/documents': 'Get all documents',
                'GET /api/documents/search': 'Search documents',
                'GET /api/documents/:id': 'Get document details',
                'GET /api/documents/:document_id/versions': 'Get version history',
                'GET /api/documents/:document_id/download': 'Download official version'
            },
            approvals: {
                'POST /api/approvals/submit': 'Submit version for review',
                'POST /api/approvals/review': 'Review a version (Stage 2)',
                'POST /api/approvals/approve': 'Approve a version (Stage 3)',
                'GET /api/approvals/pending': 'Get pending approvals',
                'GET /api/approvals/history/:version_id': 'Get approval history',
                'GET /api/approvals/workflow/:category_id': 'Get approval workflow'
            },
            admin: {
                'GET /api/admin/categories': 'Get all categories',
                'POST /api/admin/categories': 'Create a category',
                'PUT /api/admin/categories/:id': 'Update a category',
                'GET /api/admin/users': 'Get all users',
                'POST /api/admin/users': 'Create a user',
                'PUT /api/admin/users/:id': 'Update a user',
                'GET /api/admin/workflow/:category_id': 'Get workflow config',
                'PUT /api/admin/workflow/:category_id/:stage_number': 'Update workflow config',
                'GET /api/admin/audit-logs': 'Get audit logs'
            }
        },
        features: [
            'Three-stage approval workflow (Author → Reviewer → Approver)',
            'SharePoint integration for document storage',
            'Version control and history tracking',
            'Automatic file naming based on document code and version',
            'Permission-based access control',
            'Audit logging for all actions',
            'Document search and filtering',
            'Category management',
            'User management'
        ]
    });
});

// Error handling middleware
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   CDC Document Control Center                                 ║
║   文件管制中心                                                  ║
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
