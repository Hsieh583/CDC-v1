/**
 * Simple authentication middleware
 * In production, this would validate JWT tokens or session cookies
 */
const db = require('../database/db');

// Mock authentication - attach a default user to request
async function authenticate(req, res, next) {
    try {
        // In production, this would extract and validate a JWT token
        // For now, we'll just attach a default user based on a header
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

// Role-based authorization middleware
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
