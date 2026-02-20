const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { apiError } = require('../utils/helpers');

/**
 * Verify JWT access token and attach user payload to req.user
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return apiError(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, config.jwt.secret);
        req.user = payload;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return apiError(res, 401, 'Token expired');
        }
        return apiError(res, 401, 'Invalid token');
    }
};

/**
 * Role-based access control guard
 * Usage: authorize('ADMIN', 'OFFICER')
 */
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) return apiError(res, 401, 'Not authenticated');
    if (!roles.includes(req.user.role)) {
        return apiError(res, 403, 'Insufficient permissions');
    }
    next();
};

/**
 * Optional auth — attaches user if token present, does not reject if absent
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
        } catch (_) { /* ignored */ }
    }
    next();
};

module.exports = { authenticate, authorize, optionalAuth };
