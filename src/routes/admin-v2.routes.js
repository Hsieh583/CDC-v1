const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin-v2.controller');

// 案件類型管理
router.get('/case-types', AdminController.getCaseTypes);
router.post('/case-types', AdminController.createCaseType);
router.put('/case-types/:id', AdminController.updateCaseType);

// 使用者管理
router.get('/users', AdminController.getUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);

// 審計日誌
router.get('/audit-logs', AdminController.getAuditLogs);

module.exports = router;
