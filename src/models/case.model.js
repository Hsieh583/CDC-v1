const db = require('../database/db');

class CaseModel {
    /**
     * 建立新請購案件
     */
    static async create(data) {
        const { case_number, case_type_id, department, amount, applicant_name, applicant_id, description, sharepoint_folder_path } = data;
        const result = await db.run(
            `INSERT INTO cases (case_number, case_type_id, department, amount, applicant_name, applicant_id, description, sharepoint_folder_path, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [case_number, case_type_id, department, amount, applicant_name, applicant_id, description, sharepoint_folder_path]
        );
        return result.id;
    }

    /**
     * 依 ID 取得案件
     */
    static async findById(id) {
        return await db.get(
            `SELECT c.*, ct.name as case_type_name, ct.code as case_type_code,
                    u.full_name as applicant_full_name, u.email as applicant_email
             FROM cases c
             LEFT JOIN case_types ct ON c.case_type_id = ct.id
             LEFT JOIN users u ON c.applicant_id = u.id
             WHERE c.id = ?`,
            [id]
        );
    }

    /**
     * 依案號取得案件
     */
    static async findByCaseNumber(caseNumber) {
        return await db.get(
            `SELECT c.*, ct.name as case_type_name, ct.code as case_type_code,
                    u.full_name as applicant_full_name, u.email as applicant_email
             FROM cases c
             LEFT JOIN case_types ct ON c.case_type_id = ct.id
             LEFT JOIN users u ON c.applicant_id = u.id
             WHERE c.case_number = ?`,
            [caseNumber]
        );
    }

    /**
     * 搜尋案件
     */
    static async search(filters = {}) {
        let sql = `
            SELECT c.*, ct.name as case_type_name, ct.code as case_type_code,
                   u.full_name as applicant_full_name
            FROM cases c
            LEFT JOIN case_types ct ON c.case_type_id = ct.id
            LEFT JOIN users u ON c.applicant_id = u.id
            WHERE c.is_active = 1
        `;
        const params = [];

        if (filters.case_type_id) {
            sql += ' AND c.case_type_id = ?';
            params.push(filters.case_type_id);
        }

        if (filters.department) {
            sql += ' AND c.department = ?';
            params.push(filters.department);
        }

        if (filters.status) {
            sql += ' AND c.status = ?';
            params.push(filters.status);
        }

        if (filters.applicant_id) {
            sql += ' AND c.applicant_id = ?';
            params.push(filters.applicant_id);
        }

        if (filters.search) {
            sql += ' AND (c.case_number LIKE ? OR c.applicant_name LIKE ? OR c.description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY c.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            sql += ' OFFSET ?';
            params.push(filters.offset);
        }

        return await db.all(sql, params);
    }

    /**
     * 更新案件
     */
    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.department) {
            fields.push('department = ?');
            params.push(data.department);
        }
        if (data.amount !== undefined) {
            fields.push('amount = ?');
            params.push(data.amount);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            params.push(data.description);
        }
        if (data.status) {
            fields.push('status = ?');
            params.push(data.status);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE cases SET ${fields.join(', ')} WHERE id = ?`;
        return await db.run(sql, params);
    }

    /**
     * 刪除案件（軟刪除）
     */
    static async delete(id) {
        return await db.run(
            'UPDATE cases SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    /**
     * 取得所有案件（含分頁）
     */
    static async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return await db.all(
            `SELECT c.*, ct.name as case_type_name, u.full_name as applicant_full_name
             FROM cases c
             LEFT JOIN case_types ct ON c.case_type_id = ct.id
             LEFT JOIN users u ON c.applicant_id = u.id
             WHERE c.is_active = 1
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
    }

    /**
     * 取得案件總數
     */
    static async count(filters = {}) {
        let sql = 'SELECT COUNT(*) as count FROM cases WHERE is_active = 1';
        const params = [];

        if (filters.case_type_id) {
            sql += ' AND case_type_id = ?';
            params.push(filters.case_type_id);
        }

        if (filters.department) {
            sql += ' AND department = ?';
            params.push(filters.department);
        }

        if (filters.status) {
            sql += ' AND status = ?';
            params.push(filters.status);
        }

        const result = await db.get(sql, params);
        return result.count;
    }
}

module.exports = CaseModel;
