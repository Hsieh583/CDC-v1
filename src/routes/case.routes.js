const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const CaseController = require('../controllers/case.controller');

// 設定檔案上傳
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
    }
});

// 案件路由
router.post('/', CaseController.createCase);
router.get('/', CaseController.getCases);
router.get('/search', CaseController.searchCases);
router.get('/:id', CaseController.getCase);
router.put('/:id', CaseController.updateCase);

// 檔案路由
router.post('/upload', upload.single('file'), CaseController.uploadFile);
router.get('/:case_id/files', CaseController.getCaseFiles);
router.get('/files/:file_id/download', CaseController.downloadFile);

module.exports = router;
