/**
 * 簡易驗證中介軟體
 * 在正式環境中，這將驗證 JWT 權杖或工作階段 Cookie
 */
const db = require('../database/db');

// 模擬驗證 - 將預設使用者附加至請求
async function authenticate(req, res, next) {
    try {
        // 在正式環境中，這將提取並驗證 JWT 權杖
        // 目前，我們僅根據標頭附加預設使用者
        const userId = req.headers['x-user-id'] || 1;

        const user = await db.get(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = 1',
            [userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// 基於角色的授權中介軟體
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorize
};
