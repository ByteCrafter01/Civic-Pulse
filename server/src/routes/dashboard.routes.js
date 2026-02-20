const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const analytics = require('../services/analytics.service');
const sla = require('../services/sla.service');
const { apiResponse } = require('../utils/helpers');

// Authenticated dashboard stats (role-filtered)
router.get('/stats', authenticate, async (req, res, next) => {
    try {
        const stats = await analytics.getDashboardStats(req.user.role, req.user.id);
        apiResponse(res, 200, stats);
    } catch (err) { next(err); }
});

router.get('/by-department', authenticate, async (req, res, next) => {
    try {
        const data = await analytics.getByDepartment();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.get('/by-category', authenticate, async (req, res, next) => {
    try {
        const data = await analytics.getByCategory();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.get('/trends', authenticate, async (req, res, next) => {
    try {
        const data = await analytics.getTrends();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.get('/heatmap', authenticate, async (req, res, next) => {
    try {
        const data = await analytics.getHeatmapData();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.get('/sla', authenticate, async (req, res, next) => {
    try {
        const data = await sla.getSLAStats();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

module.exports = router;
