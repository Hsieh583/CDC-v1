const db = require('../database/db');

class VersionModel {
    /**
     * 建立新文件版本
     */
    static async create(data) {
        const {
            document_id, version_number, title, description,
            file_name, file_path, sharepoint_path, file_size,
            file_type, author_id
        } = data;

        const result = await db.run(
            `INSERT INTO document_versions 
             (document_id, version_number, title, description, file_name, 
              file_path, sharepoint_path, file_size, file_type, author_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
            [document_id, version_number, title, description, file_name,
                file_path, sharepoint_path, file_size, file_type, author_id]
        );
        return result.id;
    }

    /**
     * 依 ID 取得版本
     */
    static async findById(id) {
        return await db.get(
            `SELECT v.*, d.document_code, d.title as document_title,
                    u.full_name as author_name
             FROM document_versions v
             LEFT JOIN documents d ON v.document_id = d.id
             LEFT JOIN users u ON v.author_id = u.id
             WHERE v.id = ?`,
            [id]
        );
    }

    /**
     * 取得文件的所有版本
     */
    static async findByDocumentId(documentId) {
        return await db.all(
            `SELECT v.*, u.full_name as author_name
             FROM document_versions v
             LEFT JOIN users u ON v.author_id = u.id
             WHERE v.document_id = ?
             ORDER BY v.version_number DESC`,
            [documentId]
        );
    }

    /**
     * 取得文件的最新版本
     */
    static async getLatestVersion(documentId) {
        return await db.get(
            `SELECT v.*, u.full_name as author_name
             FROM document_versions v
             LEFT JOIN users u ON v.author_id = u.id
             WHERE v.document_id = ?
             ORDER BY v.version_number DESC
             LIMIT 1`,
            [documentId]
        );
    }

    /**
     * 取得文件的正式版本
     */
    static async getOfficialVersion(documentId) {
        return await db.get(
            `SELECT v.*, u.full_name as author_name
             FROM document_versions v
             LEFT JOIN users u ON v.author_id = u.id
             WHERE v.document_id = ? AND v.is_official = 1`,
            [documentId]
        );
    }

    /**
     * 更新版本
     */
    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.status) {
            fields.push('status = ?');
            params.push(data.status);
        }
        if (data.approval_stage !== undefined) {
            fields.push('approval_stage = ?');
            params.push(data.approval_stage);
        }
        if (data.is_official !== undefined) {
            fields.push('is_official = ?');
            params.push(data.is_official);
        }
        if (data.approved_at) {
            fields.push('approved_at = ?');
            params.push(data.approved_at);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE document_versions SET ${fields.join(', ')} WHERE id = ?`;
        return await db.run(sql, params);
    }

    /**
     * 將版本設為正式版並封存舊的正式版
     */
    static async setAsOfficial(versionId, documentId) {
        // 首先，封存目前的正式版本
        await db.run(
            `UPDATE document_versions 
             SET is_official = 0, status = 'archived'
             WHERE document_id = ? AND is_official = 1`,
            [documentId]
        );

        // 然後將新版本設為正式版
        await db.run(
            `UPDATE document_versions 
             SET is_official = 1, status = 'approved', approved_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [versionId]
        );

        return { success: true };
    }

    /**
     * 取得文件的下一個版本號
     */
    static async getNextVersionNumber(documentId) {
        const result = await db.get(
            `SELECT MAX(version_number) as max_version
             FROM document_versions
             WHERE document_id = ?`,
            [documentId]
        );
        return (result.max_version || 0) + 1;
    }

    /**
     * 取得待核准的版本
     */
    static async getPendingApprovals(userId, role) {
        let statusFilter = '';
        if (role === 'reviewer') {
            statusFilter = "AND v.status = 'pending_review'";
        } else if (role === 'approver') {
            statusFilter = "AND v.status = 'pending_approval'";
        }

        return await db.all(
            `SELECT v.*, v.id as version_id, d.document_code, d.title as document_title,
                    u.full_name as author_name
             FROM document_versions v
             LEFT JOIN documents d ON v.document_id = d.id
             LEFT JOIN users u ON v.author_id = u.id
             WHERE 1=1 ${statusFilter}
             ORDER BY v.created_at ASC`,
            []
        );
    }
}

module.exports = VersionModel;
