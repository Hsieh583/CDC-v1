const db = require('../database/db');

class UserModel {
    /**
     * 建立新使用者
     */
    static async create(data) {
        const { username, email, full_name, department, role } = data;
        const result = await db.run(
            `INSERT INTO users (username, email, full_name, department, role)
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, full_name, department, role || 'user']
        );
        return result.id;
    }

    /**
     * 依 ID 取得使用者
     */
    static async findById(id) {
        return await db.get(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
    }

    /**
     * 依 email 取得使用者
     */
    static async findByEmail(email) {
        return await db.get(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
    }

    /**
     * 依 username 取得使用者
     */
    static async findByUsername(username) {
        return await db.get(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
    }

    /**
     * 取得所有使用者
     */
    static async getAll() {
        return await db.all(
            'SELECT id, username, email, full_name, department, role, is_active, created_at FROM users WHERE is_active = 1 ORDER BY full_name ASC',
            []
        );
    }

    /**
     * 更新使用者
     */
    static async update(id, data) {
        const fields = [];
        const params = [];

        if (data.full_name) {
            fields.push('full_name = ?');
            params.push(data.full_name);
        }
        if (data.department) {
            fields.push('department = ?');
            params.push(data.department);
        }
        if (data.role) {
            fields.push('role = ?');
            params.push(data.role);
        }
        if (data.is_active !== undefined) {
            fields.push('is_active = ?');
            params.push(data.is_active);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
        return await db.run(sql, params);
    }

    /**
     * 刪除使用者（軟刪除）
     */
    static async delete(id) {
        return await db.run(
            'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }
}

module.exports = UserModel;
