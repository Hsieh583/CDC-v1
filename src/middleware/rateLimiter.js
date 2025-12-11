const rateLimit = require('express-rate-limit');

/**
 * 檔案上傳端點的速率限制器
 * 防止濫用檔案系統操作
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 50, // 限制每個 IP 在 windowMs 內最多 50 次上傳請求
    message: 'Too many upload requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 一般 API 速率限制器
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 限制每個 IP 在 windowMs 內最多 100 次請求
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * 敏感操作的嚴格速率限制器
 */
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 20, // 限制每個 IP 在 windowMs 內最多 20 次請求
    message: 'Too many requests for this operation, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    uploadLimiter,
    apiLimiter,
    strictLimiter
};
