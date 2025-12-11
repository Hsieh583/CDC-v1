const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for file upload endpoints
 * Prevents abuse of file system operations
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 upload requests per windowMs
    message: 'Too many upload requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for sensitive operations
 */
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: 'Too many requests for this operation, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    uploadLimiter,
    apiLimiter,
    strictLimiter
};
