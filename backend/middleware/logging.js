const winston = require('winston');
const pool = require('../config/database');

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'training-attendance-api' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const logRequest = async (req, res, next) => {
    const start = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const userId = req.user?.id || null;

    // Log request
    logger.info('API Request', {
        method,
        url,
        ip,
        userAgent,
        userId,
        timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - start;
        const { statusCode } = res;

        // Log response
        logger.info('API Response', {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            ip,
            userId,
            timestamp: new Date().toISOString()
        });

        // Log to database if user is authenticated
        if (userId && (method !== 'GET' || statusCode >= 400)) {
            logToDatabase(userId, method, url, statusCode, ip, req.body);
        }

        originalEnd.call(this, chunk, encoding);
    };

    next();
};

const logToDatabase = async (userId, action, entityType, statusCode, ipAddress, requestData) => {
    try {
        await pool.query(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            userId,
            `${action} ${entityType}`,
            entityType.split('/')[1] || 'unknown',
            null,
            JSON.stringify(requestData || {}),
            ipAddress
        ]);
    } catch (error) {
        logger.error('Failed to log to database:', error);
    }
};

const logError = (error, req, res, next) => {
    logger.error('API Error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.user?.id || null,
        body: req.body,
        timestamp: new Date().toISOString()
    });

    next(error);
};

module.exports = {
    logRequest,
    logError,
    logger
};
