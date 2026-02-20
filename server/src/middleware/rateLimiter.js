const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message },
    });

// Citizen: 100 requests / 15 min
const citizenLimiter = createLimiter(15 * 60 * 1000, 100, 'Too many requests, please try again later.');

// Officer / Admin: 500 requests / 15 min
const officerLimiter = createLimiter(15 * 60 * 1000, 500, 'Too many requests.');

// Auth endpoints: 10 attempts / 15 min (brute-force protection)
const authLimiter = createLimiter(15 * 60 * 1000, 10, 'Too many login attempts, please try again in 15 minutes.');

// Default general limiter
const generalLimiter = createLimiter(15 * 60 * 1000, 200, 'Too many requests.');

module.exports = { citizenLimiter, officerLimiter, authLimiter, generalLimiter };
