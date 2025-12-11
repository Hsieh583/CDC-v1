const db = require('../database/db');

class ApprovalModel {
    /**
     * 建立簽核紀錄
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
     * 取得版本的簽核紀錄
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
     * 取得版本各階段的最新簽核
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
     * 檢查階段是否已核准
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
     * 取得類別的簽核流程
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
     * 取得版本目前的簽核階段
     */
    static async getCurrentStage(versionId) {
        const approvals = await this.getLatestApprovals(versionId);

        // 尋找第一個未核准的階段
        for (let stage = 1; stage <= 3; stage++) {
            const stageApproval = approvals.find(a => a.stage_number === stage);
            if (!stageApproval || stageApproval.action !== 'approved') {
                return stage;
            }
        }

        // 所有階段皆已核准
        return 4; // 超過最終階段
    }

    /**
     * 取得文件的簽核歷史紀錄（所有版本）
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
