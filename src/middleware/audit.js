const db = require('../database/db');

/**
 * Middleware to log actions to audit log
 */
async function auditLog(action, entityType, entityId, details = null) {
    return async (req, res, next) => {
        // Store original send method
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user?.id || 1;
                const ipAddress = req.ip || req.connection.remoteAddress;
                
                db.run(
                    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, action, entityType, entityId, JSON.stringify(details), ipAddress]
                ).catch(err => {
                    console.error('Error logging audit:', err);
                });
            }
            
            // Call original send
            originalSend.call(this, data);
        };
        
        next();
    };
}

module.exports = auditLog;
