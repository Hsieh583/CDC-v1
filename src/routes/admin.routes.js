const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

// 所有管理員路由皆需要管理員角色
router.use(authenticate);
router.use(authorize('admin'));
router.use(apiLimiter);

// 類別管理
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);

// 使用者管理
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);

// 簽核流程設定
router.get('/workflow/:category_id', adminController.getWorkflowConfig);
router.put('/workflow/:category_id/:stage_number', adminController.updateWorkflowConfig);

// 稽核紀錄
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
