const db = require('../database/db');

class AdminController {
    /**
     * 取得所有類別
     */
    async getCategories(req, res) {
        try {
            const categories = await db.all(
                'SELECT * FROM categories WHERE is_active = 1 ORDER BY code'
            );

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({ error: 'Failed to get categories' });
        }
    }

    /**
     * 建立新類別
     */
    async createCategory(req, res) {
        try {
            const { code, name, description } = req.body;

            if (!code || !name) {
                return res.status(400).json({ error: 'Code and name are required' });
            }

            const result = await db.run(
                'INSERT INTO categories (code, name, description) VALUES (?, ?, ?)',
                [code, name, description]
            );

            const category = await db.get('SELECT * FROM categories WHERE id = ?', [result.id]);

            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (error) {
            console.error('Error creating category:', error);
            if (error.message.includes('UNIQUE')) {
                res.status(400).json({ error: 'Category code already exists' });
            } else {
                res.status(500).json({ error: 'Failed to create category' });
            }
        }
    }

    /**
     * 更新類別
     */
    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, description, is_active } = req.body;

            const fields = [];
            const params = [];

            if (name) {
                fields.push('name = ?');
                params.push(name);
            }
            if (description !== undefined) {
                fields.push('description = ?');
                params.push(description);
            }
            if (is_active !== undefined) {
                fields.push('is_active = ?');
                params.push(is_active ? 1 : 0);
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            await db.run(
                `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
                params
            );

            const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'Failed to update category' });
        }
    }

    /**
     * 取得所有使用者
     */
    async getUsers(req, res) {
        try {
            const users = await db.all(
                'SELECT id, username, email, full_name, role, is_active, created_at FROM users ORDER BY full_name'
            );

            res.json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Error getting users:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    }

    /**
     * 建立新使用者
     */
    async createUser(req, res) {
        try {
            const { username, email, full_name, role } = req.body;

            if (!username || !email || !full_name || !role) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            const validRoles = ['admin', 'author', 'reviewer', 'approver', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            const result = await db.run(
                'INSERT INTO users (username, email, full_name, role) VALUES (?, ?, ?, ?)',
                [username, email, full_name, role]
            );

            const user = await db.get(
                'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
                [result.id]
            );

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user
            });
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.message.includes('UNIQUE')) {
                res.status(400).json({ error: 'Username or email already exists' });
            } else {
                res.status(500).json({ error: 'Failed to create user' });
            }
        }
    }

    /**
     * 更新使用者
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { email, full_name, role, is_active } = req.body;

            const fields = [];
            const params = [];

            if (email) {
                fields.push('email = ?');
                params.push(email);
            }
            if (full_name) {
                fields.push('full_name = ?');
                params.push(full_name);
            }
            if (role) {
                fields.push('role = ?');
                params.push(role);
            }
            if (is_active !== undefined) {
                fields.push('is_active = ?');
                params.push(is_active ? 1 : 0);
            }

            fields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            await db.run(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                params
            );

            const user = await db.get(
                'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
                [id]
            );

            res.json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    /**
     * 取得類別的簽核流程設定
     */
    async getWorkflowConfig(req, res) {
        try {
            const { category_id } = req.params;

            const workflows = await db.all(
                'SELECT * FROM approval_workflows WHERE category_id = ? ORDER BY stage_number',
                [category_id]
            );

            res.json({
                success: true,
                data: workflows
            });
        } catch (error) {
            console.error('Error getting workflow config:', error);
            res.status(500).json({ error: 'Failed to get workflow configuration' });
        }
    }

    /**
     * 更新簽核流程設定
     */
    async updateWorkflowConfig(req, res) {
        try {
            const { category_id, stage_number } = req.params;
            const { stage_name, role_required, is_active } = req.body;

            const fields = [];
            const params = [];

            if (stage_name) {
                fields.push('stage_name = ?');
                params.push(stage_name);
            }
            if (role_required) {
                fields.push('role_required = ?');
                params.push(role_required);
            }
            if (is_active !== undefined) {
                fields.push('is_active = ?');
                params.push(is_active ? 1 : 0);
            }

            params.push(category_id, stage_number);

            await db.run(
                `UPDATE approval_workflows SET ${fields.join(', ')} 
                 WHERE category_id = ? AND stage_number = ?`,
                params
            );

            const workflow = await db.get(
                'SELECT * FROM approval_workflows WHERE category_id = ? AND stage_number = ?',
                [category_id, stage_number]
            );

            res.json({
                success: true,
                message: 'Workflow configuration updated successfully',
                data: workflow
            });
        } catch (error) {
            console.error('Error updating workflow config:', error);
            res.status(500).json({ error: 'Failed to update workflow configuration' });
        }
    }

    /**
     * 取得稽核紀錄
     */
    async getAuditLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;

            const logs = await db.all(
                `SELECT al.*, u.username, u.full_name
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 ORDER BY al.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            res.json({
                success: true,
                data: logs,
                pagination: { page, limit }
            });
        } catch (error) {
            console.error('Error getting audit logs:', error);
            res.status(500).json({ error: 'Failed to get audit logs' });
        }
    }
}

module.exports = new AdminController();
