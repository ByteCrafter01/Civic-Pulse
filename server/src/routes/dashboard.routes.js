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

router.get('/sentiment-trends', authenticate, async (req, res, next) => {
    try {
        const data = await analytics.getSentimentTrends();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.get('/area-sentiment', authenticate, async (req, res, next) => {
    try {
        const data = await analytics.getAreaSentiment();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.get('/insights', authenticate, async (req, res, next) => {
    try {
        // Generate AI insights from trends data
        const [trends, sentiment, depts] = await Promise.all([
            analytics.getTrends(),
            analytics.getSentimentTrends(),
            analytics.getByDepartment(),
        ]);

        let insights = [];

        // Rule-based insights (always available)
        const recentWeeks = trends.slice(-4);
        const totalRecent = recentWeeks.reduce((s, w) => s + w.submitted, 0);
        const prevWeeks = trends.slice(-8, -4);
        const totalPrev = prevWeeks.reduce((s, w) => s + w.submitted, 0);

        if (totalPrev > 0) {
            const change = ((totalRecent - totalPrev) / totalPrev * 100).toFixed(0);
            insights.push(`Complaint volume ${change >= 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% over the last 4 weeks compared to the previous 4 weeks.`);
        }

        const recentSentiment = sentiment.slice(-4);
        const avgRecentSent = recentSentiment.reduce((s, w) => s + w.avgSentiment, 0) / (recentSentiment.length || 1);
        if (avgRecentSent < -0.3) {
            insights.push('Overall citizen sentiment is significantly negative in recent weeks, indicating systemic dissatisfaction.');
        } else if (avgRecentSent > 0.3) {
            insights.push('Citizen sentiment has been largely positive recently, suggesting effective complaint resolution.');
        }

        const topDept = depts.sort((a, b) => b.total - a.total)[0];
        if (topDept) {
            insights.push(`${topDept.name} has the highest complaint volume (${topDept.total}), with ${topDept.resolved} resolved.`);
        }

        const breachedDept = depts.find((d) => d.critical > 2);
        if (breachedDept) {
            insights.push(`${breachedDept.name} has ${breachedDept.critical} critical complaints requiring immediate attention.`);
        }

        apiResponse(res, 200, insights);
    } catch (err) { next(err); }
});

module.exports = router;
