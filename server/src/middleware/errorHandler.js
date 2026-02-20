const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Prisma known errors
    if (err.code === 'P2002') {
        return res.status(409).json({
            success: false,
            message: 'A record with this value already exists.',
            field: err.meta?.target,
        });
    }
    if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    // JWT errors (should normally be caught in auth middleware, safety net)
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File size exceeds 5MB limit.' });
    }

    const statusCode = err.statusCode || err.status || 500;
    const message = err.isOperational ? err.message : 'Internal server error';

    res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
