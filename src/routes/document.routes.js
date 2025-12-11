const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter, apiLimiter } = require('../middleware/rateLimiter');
const db = require('../database/db');

// 將資料庫附加至請求
router.use((req, res, next) => {
    req.db = db;
    next();
});

// 對所有路由套用一般 API 速率限制
router.use(apiLimiter);

// 文件路由
router.post('/', authenticate, documentController.createDocument);
router.post('/upload-version', authenticate, uploadLimiter, upload.single('file'), documentController.uploadVersion);
router.get('/', authenticate, documentController.getAllDocuments);
router.get('/search', authenticate, documentController.searchDocuments);
router.get('/:id', authenticate, documentController.getDocument);
router.get('/:document_id/versions', authenticate, documentController.getVersionHistory);
router.get('/:document_id/download', authenticate, uploadLimiter, documentController.downloadOfficialVersion);

module.exports = router;
