const db = require('../database/db');

class CaseFileModel {
    /**
     * 建立新案件檔案
     */
    static async create(data) {
        const {
            case_id, file_name, original_name, file_path, sharepoint_path,
            file_size, file_type, is_main_document, uploaded_by
        } = data;

        const result = await db.run(
            `INSERT INTO case_files 
             (case_id, file_name, original_name, file_path, sharepoint_path, 
              file_size, file_type, is_main_document, uploaded_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [case_id, file_name, original_name, file_path, sharepoint_path,
                file_size, file_type, is_main_document ? 1 : 0, uploaded_by]
        );
        return result.id;
    }

    /**
     * 依 ID 取得檔案
     */
    static async findById(id) {
        return await db.get(
            `SELECT cf.*, c.case_number, u.full_name as uploader_name
             FROM case_files cf
             LEFT JOIN cases c ON cf.case_id = c.id
             LEFT JOIN users u ON cf.uploaded_by = u.id
             WHERE cf.id = ?`,
            [id]
        );
    }

    /**
     * 取得案件的所有檔案
     */
    static async findByCaseId(caseId) {
        return await db.all(
            `SELECT cf.*, u.full_name as uploader_name
             FROM case_files cf
             LEFT JOIN users u ON cf.uploaded_by = u.id
             WHERE cf.case_id = ?
             ORDER BY cf.is_main_document DESC, cf.created_at ASC`,
            [caseId]
        );
    }

    /**
     * 取得案件的主文件
     */
    static async getMainDocument(caseId) {
        return await db.get(
            `SELECT cf.*, u.full_name as uploader_name
             FROM case_files cf
             LEFT JOIN users u ON cf.uploaded_by = u.id
             WHERE cf.case_id = ? AND cf.is_main_document = 1`,
            [caseId]
        );
    }

    /**
     * 取得案件的附件列表
     */
    static async getAttachments(caseId) {
        return await db.all(
            `SELECT cf.*, u.full_name as uploader_name
             FROM case_files cf
             LEFT JOIN users u ON cf.uploaded_by = u.id
             WHERE cf.case_id = ? AND cf.is_main_document = 0
             ORDER BY cf.created_at ASC`,
            [caseId]
        );
    }

    /**
     * 刪除檔案
     */
    static async delete(id) {
        return await db.run(
            'DELETE FROM case_files WHERE id = ?',
            [id]
        );
    }

    /**
     * 更新主文件標記（確保每個案件只有一個主文件）
     */
    static async setMainDocument(fileId, caseId) {
        // 先將該案件的所有檔案的主文件標記設為 0
        await db.run(
            'UPDATE case_files SET is_main_document = 0 WHERE case_id = ?',
            [caseId]
        );

        // 然後將指定檔案設為主文件
        return await db.run(
            'UPDATE case_files SET is_main_document = 1 WHERE id = ?',
            [fileId]
        );
    }

    /**
     * 檢查案件是否已有主文件
     */
    static async hasMainDocument(caseId) {
        const result = await db.get(
            'SELECT COUNT(*) as count FROM case_files WHERE case_id = ? AND is_main_document = 1',
            [caseId]
        );
        return result.count > 0;
    }

    /**
     * 取得案件的檔案總數
     */
    static async countByCaseId(caseId) {
        const result = await db.get(
            'SELECT COUNT(*) as count FROM case_files WHERE case_id = ?',
            [caseId]
        );
        return result.count;
    }
}

module.exports = CaseFileModel;
