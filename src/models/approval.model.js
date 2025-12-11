const db = require('../database/db');

class ApprovalModel {
    /**
     * Create an approval record
     */
    static async create(data) {
        const { version_id, stage_number, approver_id, action, comments } = data;
        const result = await db.run(
            `INSERT INTO approval_records 
             (version_id, stage_number, approver_id, action, comments)
             VALUES (?, ?, ?, ?, ?)`,
            [version_id, stage_number, approver_id, action, comments]
        );
        return result.id;
    }

    /**
     * Get approval records for a version
     */
    static async findByVersionId(versionId) {
        return await db.all(
            `SELECT ar.*, u.full_name as approver_name, u.role as approver_role
             FROM approval_records ar
             LEFT JOIN users u ON ar.approver_id = u.id
             WHERE ar.version_id = ?
             ORDER BY ar.stage_number, ar.created_at DESC`,
            [versionId]
        );
    }

    /**
     * Get latest approval for each stage of a version
     */
    static async getLatestApprovals(versionId) {
        return await db.all(
            `SELECT ar.*, u.full_name as approver_name, u.role as approver_role
             FROM approval_records ar
             LEFT JOIN users u ON ar.approver_id = u.id
             WHERE ar.version_id = ?
             AND ar.id IN (
                 SELECT MAX(id)
                 FROM approval_records
                 WHERE version_id = ?
                 GROUP BY stage_number
             )
             ORDER BY ar.stage_number`,
            [versionId, versionId]
        );
    }

    /**
     * Check if a stage has been approved
     */
    static async isStageApproved(versionId, stageNumber) {
        const record = await db.get(
            `SELECT action FROM approval_records
             WHERE version_id = ? AND stage_number = ?
             ORDER BY created_at DESC
             LIMIT 1`,
            [versionId, stageNumber]
        );
        return record && record.action === 'approved';
    }

    /**
     * Get approval workflow for a category
     */
    static async getWorkflowByCategory(categoryId) {
        return await db.all(
            `SELECT * FROM approval_workflows
             WHERE category_id = ? AND is_active = 1
             ORDER BY stage_number`,
            [categoryId]
        );
    }

    /**
     * Get current approval stage for a version
     */
    static async getCurrentStage(versionId) {
        const approvals = await this.getLatestApprovals(versionId);
        
        // Find the first non-approved stage
        for (let stage = 1; stage <= 3; stage++) {
            const stageApproval = approvals.find(a => a.stage_number === stage);
            if (!stageApproval || stageApproval.action !== 'approved') {
                return stage;
            }
        }
        
        // All stages approved
        return 4; // Beyond final stage
    }

    /**
     * Get approval history for a document (all versions)
     */
    static async getDocumentApprovalHistory(documentId) {
        return await db.all(
            `SELECT ar.*, v.version_number, u.full_name as approver_name
             FROM approval_records ar
             LEFT JOIN document_versions v ON ar.version_id = v.id
             LEFT JOIN users u ON ar.approver_id = u.id
             WHERE v.document_id = ?
             ORDER BY v.version_number DESC, ar.stage_number, ar.created_at DESC`,
            [documentId]
        );
    }
}

module.exports = ApprovalModel;
