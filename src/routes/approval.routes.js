const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Approval routes
router.post('/submit', authenticate, authorize('author', 'admin'), approvalController.submitForReview);
router.post('/review', authenticate, authorize('reviewer', 'admin'), approvalController.reviewVersion);
router.post('/approve', authenticate, authorize('approver', 'admin'), approvalController.approveVersion);
router.get('/pending', authenticate, approvalController.getPendingApprovals);
router.get('/history/:version_id', authenticate, approvalController.getApprovalHistory);
router.get('/workflow/:category_id', authenticate, approvalController.getWorkflow);

module.exports = router;
