const VersionModel = require('../models/version.model');
const ApprovalModel = require('../models/approval.model');
const DocumentModel = require('../models/document.model');

class ApprovalController {
    /**
     * 提交版本進行審核（階段 1 -> 階段 2）
     */
    async submitForReview(req, res) {
        try {
            const { version_id } = req.body;
            const author_id = req.user?.id || 1;

            const version = await VersionModel.findById(version_id);
            if (!version) {
                return res.status(404).json({ error: 'Version not found' });
            }

            // 更新版本狀態
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
     * 審核版本（階段 2）
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

            // 建立簽核紀錄
            await ApprovalModel.create({
                version_id,
                stage_number: 2,
                approver_id: reviewer_id,
                action,
                comments
            });

            // 根據動作更新版本
            if (action === 'approved') {
                // 移至核准階段
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
     * 核准版本（階段 3 - 最終核准）
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

            // 建立簽核紀錄
            await ApprovalModel.create({
                version_id,
                stage_number: 3,
                approver_id,
                action,
                comments
            });

            // 根據動作更新版本
            if (action === 'approved') {
                // 設為正式版本並封存舊版本
                await VersionModel.setAsOfficial(version_id, version.document_id);

                // 更新文件狀態
                await DocumentModel.update(version.document_id, {
                    status: 'approved'
                });
            } else if (action === 'rejected') {
                await VersionModel.update(version_id, {
                    status: 'rejected'
                });
            } else if (action === 'returned') {
                // 退回至審核階段
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
     * 取得目前使用者的待簽核項目
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
     * 取得版本的簽核歷史紀錄
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
     * 取得類別的簽核流程
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
