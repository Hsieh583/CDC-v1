const VersionModel = require('../models/version.model');
const ApprovalModel = require('../models/approval.model');
const DocumentModel = require('../models/document.model');

class ApprovalController {
    /**
     * Submit version for review (Stage 1 -> Stage 2)
     */
    async submitForReview(req, res) {
        try {
            const { version_id } = req.body;
            const author_id = req.user?.id || 1;

            const version = await VersionModel.findById(version_id);
            if (!version) {
                return res.status(404).json({ error: 'Version not found' });
            }

            // Update version status
            await VersionModel.update(version_id, {
                status: 'pending_review',
                approval_stage: 2
            });

            res.json({
                success: true,
                message: 'Version submitted for review'
            });
        } catch (error) {
            console.error('Error submitting for review:', error);
            res.status(500).json({ error: 'Failed to submit for review' });
        }
    }

    /**
     * Review version (Stage 2)
     */
    async reviewVersion(req, res) {
        try {
            const { version_id, action, comments } = req.body;
            const reviewer_id = req.user?.id || 1;

            if (!['approved', 'rejected', 'returned'].includes(action)) {
                return res.status(400).json({ error: 'Invalid action' });
            }

            const version = await VersionModel.findById(version_id);
            if (!version) {
                return res.status(404).json({ error: 'Version not found' });
            }

            // Create approval record
            await ApprovalModel.create({
                version_id,
                stage_number: 2,
                approver_id: reviewer_id,
                action,
                comments
            });

            // Update version based on action
            if (action === 'approved') {
                // Move to approval stage
                await VersionModel.update(version_id, {
                    status: 'pending_approval',
                    approval_stage: 3
                });
            } else if (action === 'rejected') {
                await VersionModel.update(version_id, {
                    status: 'rejected'
                });
            } else if (action === 'returned') {
                await VersionModel.update(version_id, {
                    status: 'draft',
                    approval_stage: 1
                });
            }

            res.json({
                success: true,
                message: `Version ${action} successfully`
            });
        } catch (error) {
            console.error('Error reviewing version:', error);
            res.status(500).json({ error: 'Failed to review version' });
        }
    }

    /**
     * Approve version (Stage 3 - Final Approval)
     */
    async approveVersion(req, res) {
        try {
            const { version_id, action, comments } = req.body;
            const approver_id = req.user?.id || 1;

            if (!['approved', 'rejected', 'returned'].includes(action)) {
                return res.status(400).json({ error: 'Invalid action' });
            }

            const version = await VersionModel.findById(version_id);
            if (!version) {
                return res.status(404).json({ error: 'Version not found' });
            }

            // Create approval record
            await ApprovalModel.create({
                version_id,
                stage_number: 3,
                approver_id,
                action,
                comments
            });

            // Update version based on action
            if (action === 'approved') {
                // Set as official version and archive old ones
                await VersionModel.setAsOfficial(version_id, version.document_id);
                
                // Update document status
                await DocumentModel.update(version.document_id, {
                    status: 'approved'
                });
            } else if (action === 'rejected') {
                await VersionModel.update(version_id, {
                    status: 'rejected'
                });
            } else if (action === 'returned') {
                // Return to review stage
                await VersionModel.update(version_id, {
                    status: 'pending_review',
                    approval_stage: 2
                });
            }

            res.json({
                success: true,
                message: `Version ${action} successfully`
            });
        } catch (error) {
            console.error('Error approving version:', error);
            res.status(500).json({ error: 'Failed to approve version' });
        }
    }

    /**
     * Get pending approvals for current user
     */
    async getPendingApprovals(req, res) {
        try {
            const user_id = req.user?.id || 1;
            const user_role = req.user?.role || 'reviewer';

            const pendingApprovals = await VersionModel.getPendingApprovals(user_id, user_role);

            res.json({
                success: true,
                data: pendingApprovals
            });
        } catch (error) {
            console.error('Error getting pending approvals:', error);
            res.status(500).json({ error: 'Failed to get pending approvals' });
        }
    }

    /**
     * Get approval history for a version
     */
    async getApprovalHistory(req, res) {
        try {
            const { version_id } = req.params;
            const approvals = await ApprovalModel.findByVersionId(version_id);

            res.json({
                success: true,
                data: approvals
            });
        } catch (error) {
            console.error('Error getting approval history:', error);
            res.status(500).json({ error: 'Failed to get approval history' });
        }
    }

    /**
     * Get approval workflow for a category
     */
    async getWorkflow(req, res) {
        try {
            const { category_id } = req.params;
            const workflow = await ApprovalModel.getWorkflowByCategory(category_id);

            res.json({
                success: true,
                data: workflow
            });
        } catch (error) {
            console.error('Error getting workflow:', error);
            res.status(500).json({ error: 'Failed to get workflow' });
        }
    }
}

module.exports = new ApprovalController();
