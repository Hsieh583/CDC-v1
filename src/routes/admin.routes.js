const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Category management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);

// User management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);

// Workflow configuration
router.get('/workflow/:category_id', adminController.getWorkflowConfig);
router.put('/workflow/:category_id/:stage_number', adminController.updateWorkflowConfig);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
