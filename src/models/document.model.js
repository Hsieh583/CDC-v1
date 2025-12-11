const db = require('../database/db');

class DocumentModel {
    /**
     * 建立新文件
     */
    static async create(data) {
        const { document_code, title, category_id, description, author_id } = data;
        const result = await db.run(
            `INSERT INTO documents (document_code, title, category_id, description, author_id, status)
             VALUES (?, ?, ?, ?, ?, 'draft')`,
            [document_code, title, category_id, description, author_id]
        );
        return result.id;
    }

    /**
     * 依 ID 取得文件
     */
    static async findById(id) {
        return await db.get(
            `SELECT d.*, c.name as category_name, c.code as category_code, 
                    u.full_name as author_name
             FROM documents d
             LEFT JOIN categories c ON d.category_id = c.id
             LEFT JOIN users u ON d.author_id = u.id
             WHERE d.id = ?`,
            [id]
        );
    }

    /**
     * 依代碼取得文件
     */
    static async findByCode(code) {
        return await db.get(
            `SELECT d.*, c.name as category_name, c.code as category_code,
                    u.full_name as author_name
             FROM documents d
             LEFT JOIN categories c ON d.category_id = c.id
             LEFT JOIN users u ON d.author_id = u.id
             WHERE d.document_code = ?`,
            [code]
        );
    }

    /**
     * 搜尋文件
     */
    static async search(filters = {}) {
        let sql = `
            SELECT d.*, c.name as category_name, c.code as category_code,
                   u.full_name as author_name
            FROM documents d
            LEFT JOIN categories c ON d.category_id = c.id
            LEFT JOIN users u ON d.author_id = u.id
            WHERE d.is_active = 1
        `;
        const params = [];

        if (filters.category_id) {
            sql += ' AND d.category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.status) {
            sql += ' AND d.status = ?';
            params.push(filters.status);
        }

        if (filters.author_id) {
            sql += ' AND d.author_id = ?';
            params.push(filters.author_id);
        }

        if (filters.search) {
            sql += ' AND (d.title LIKE ? OR d.document_code LIKE ? OR d.description LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        sql += ' ORDER BY d.updated_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        return await db.all(sql, params);
    }

    /**
     * 更新文件
     */
    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.title) {
            fields.push('title = ?');
            params.push(data.title);
        }
        if (data.description) {
            fields.push('description = ?');
            params.push(data.description);
        }
        if (data.status) {
            fields.push('status = ?');
            params.push(data.status);
        }
        if (data.current_version !== undefined) {
            fields.push('current_version = ?');
            params.push(data.current_version);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`;
        return await db.run(sql, params);
    }

    /**
     * 刪除文件（軟刪除）
     */
    static async delete(id) {
        return await db.run(
            'UPDATE documents SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    /**
     * 取得所有文件（含分頁）
     */
    static async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return await db.all(
            `SELECT d.*, c.name as category_name, u.full_name as author_name
             FROM documents d
             LEFT JOIN categories c ON d.category_id = c.id
             LEFT JOIN users u ON d.author_id = u.id
             WHERE d.is_active = 1
             ORDER BY d.updated_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );
    }
}

module.exports = DocumentModel;
