const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLimiter, apiLimiter } = require('../middleware/rateLimiter');
const db = require('../database/db');

// Attach database to request
router.use((req, res, next) => {
    req.db = db;
    next();
});

// Apply general API rate limiting to all routes
router.use(apiLimiter);

// Document routes
router.post('/', authenticate, documentController.createDocument);
router.post('/upload-version', authenticate, uploadLimiter, upload.single('file'), documentController.uploadVersion);
router.get('/', authenticate, documentController.getAllDocuments);
router.get('/search', authenticate, documentController.searchDocuments);
router.get('/:id', authenticate, documentController.getDocument);
router.get('/:document_id/versions', authenticate, documentController.getVersionHistory);
router.get('/:document_id/download', authenticate, uploadLimiter, documentController.downloadOfficialVersion);

module.exports = router;
