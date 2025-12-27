const CaseTypeModel = require('../models/case-type.model');
const UserModel = require('../models/user.model');
const db = require('../database/db');

class AdminController {
    /**
     * 取得所有案件類型
     */
    static async getCaseTypes(req, res) {
        try {
            const caseTypes = await CaseTypeModel.getAll();
            res.json({ case_types: caseTypes });
        } catch (error) {
            console.error('Get case types error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 建立案件類型
     */
    static async createCaseType(req, res) {
        try {
            const { code, name, description } = req.body;
            const userId = req.headers['x-user-id'];

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            if (!code || !name) {
                return res.status(400).json({ error: 'code and name are required' });
            }

            const caseTypeId = await CaseTypeModel.create({ code, name, description });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'CREATE_CASE_TYPE', 'case_type', caseTypeId, `Created case type ${code}`]
            );

            const newCaseType = await CaseTypeModel.findById(caseTypeId);
            res.status(201).json({
                message: 'Case type created successfully',
                case_type: newCaseType
            });
        } catch (error) {
            console.error('Create case type error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 更新案件類型
     */
    static async updateCaseType(req, res) {
        try {
            const { id } = req.params;
            const { name, description, is_active } = req.body;
            const userId = req.headers['x-user-id'];

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            const caseType = await CaseTypeModel.findById(id);
            if (!caseType) {
                return res.status(404).json({ error: 'Case type not found' });
            }

            await CaseTypeModel.update(id, { name, description, is_active });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'UPDATE_CASE_TYPE', 'case_type', id, `Updated case type ${caseType.code}`]
            );

            const updatedCaseType = await CaseTypeModel.findById(id);
            res.json({
                message: 'Case type updated successfully',
                case_type: updatedCaseType
            });
        } catch (error) {
            console.error('Update case type error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 取得所有使用者
     */
    static async getUsers(req, res) {
        try {
            const users = await UserModel.getAll();
            res.json({ users });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 建立使用者
     */
    static async createUser(req, res) {
        try {
            const { username, email, full_name, department, role } = req.body;
            const userId = req.headers['x-user-id'];

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            if (!username || !email || !full_name) {
                return res.status(400).json({ error: 'username, email, and full_name are required' });
            }

            const newUserId = await UserModel.create({ username, email, full_name, department, role });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'CREATE_USER', 'user', newUserId, `Created user ${username}`]
            );

            const newUser = await UserModel.findById(newUserId);
            res.status(201).json({
                message: 'User created successfully',
                user: newUser
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 更新使用者
     */
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { full_name, department, role, is_active } = req.body;
            const userId = req.headers['x-user-id'];

            if (!userId) {
                return res.status(401).json({ error: 'User ID is required' });
            }

            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            await UserModel.update(id, { full_name, department, role, is_active });

            // 記錄審計日誌
            await db.run(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'UPDATE_USER', 'user', id, `Updated user ${user.username}`]
            );

            const updatedUser = await UserModel.findById(id);
            res.json({
                message: 'User updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * 取得審計日誌
     */
    static async getAuditLogs(req, res) {
        try {
            const { page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            const logs = await db.all(
                `SELECT al.*, u.full_name as user_name, u.email as user_email
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 ORDER BY al.created_at DESC
                 LIMIT ? OFFSET ?`,
                [parseInt(limit), parseInt(offset)]
            );

            const countResult = await db.get('SELECT COUNT(*) as count FROM audit_logs', []);
            const total = countResult.count;

            res.json({
                logs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = AdminController;
