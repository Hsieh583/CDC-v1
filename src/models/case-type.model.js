const db = require('../database/db');

class CaseTypeModel {
    /**
     * 建立新案件類型
     */
    static async create(data) {
        const { code, name, description } = data;
        const result = await db.run(
            `INSERT INTO case_types (code, name, description)
             VALUES (?, ?, ?)`,
            [code, name, description]
        );
        return result.id;
    }

    /**
     * 依 ID 取得案件類型
     */
    static async findById(id) {
        return await db.get(
            'SELECT * FROM case_types WHERE id = ?',
            [id]
        );
    }

    /**
     * 依代碼取得案件類型
     */
    static async findByCode(code) {
        return await db.get(
            'SELECT * FROM case_types WHERE code = ?',
            [code]
        );
    }

    /**
     * 取得所有案件類型
     */
    static async getAll() {
        return await db.all(
            'SELECT * FROM case_types WHERE is_active = 1 ORDER BY code ASC',
            []
        );
    }

    /**
     * 更新案件類型
     */
    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.name) {
            fields.push('name = ?');
            params.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            params.push(data.description);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            params.push(data.is_active);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE case_types SET ${fields.join(', ')} WHERE id = ?`;
        return await db.run(sql, params);
    }

    /**
     * 刪除案件類型（軟刪除）
     */
    static async delete(id) {
        return await db.run(
            'UPDATE case_types SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }
}

module.exports = CaseTypeModel;
