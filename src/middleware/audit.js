const db = require('../database/db');

/**
 * 記錄動作至稽核紀錄的中介軟體
 */
async function auditLog(action, entityType, entityId, details = null) {
    return async (req, res, next) => {
        // 儲存原始的 send 方法
        const originalSend = res.send;

        res.send = function (data) {
            // 在成功回應後記錄動作
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

            // 呼叫原始的 send
            originalSend.call(this, data);
        };

        next();
    };
}

module.exports = auditLog;
