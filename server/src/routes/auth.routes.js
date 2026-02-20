const router = require('express').Router();
const authService = require('../services/auth.service');
const { validate, schemas } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { apiResponse } = require('../utils/helpers');

router.post('/register', authLimiter, validate(schemas.register), async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        apiResponse(res, 201, result, 'Registration successful');
    } catch (err) { next(err); }
});

router.post('/login', authLimiter, validate(schemas.login), async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        apiResponse(res, 200, result, 'Login successful');
    } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });
        const tokens = await authService.refresh(refreshToken);
        apiResponse(res, 200, tokens);
    } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.id);
        apiResponse(res, 200, user);
    } catch (err) { next(err); }
});

module.exports = router;
