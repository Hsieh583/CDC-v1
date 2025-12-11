const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiter');

// 對所有路由套用一般 API 速率限制
router.use(apiLimiter);

// 簽核路由在寫入操作上有更嚴格的速率限制
router.post('/submit', authenticate, strictLimiter, authorize('author', 'admin'), approvalController.submitForReview);
router.post('/review', authenticate, strictLimiter, authorize('reviewer', 'admin'), approvalController.reviewVersion);
router.post('/approve', authenticate, strictLimiter, authorize('approver', 'admin'), approvalController.approveVersion);
router.get('/pending', authenticate, approvalController.getPendingApprovals);
router.get('/history/:version_id', authenticate, approvalController.getApprovalHistory);
router.get('/workflow/:category_id', authenticate, approvalController.getWorkflow);

module.exports = router;
