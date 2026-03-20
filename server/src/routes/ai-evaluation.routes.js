const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const aiEval = require('../services/ai-evaluation.service');
const { apiResponse } = require('../utils/helpers');

// All AI evaluation endpoints are admin-only
router.use(authenticate, authorize('ADMIN'));

/**
 * GET /api/ai-evaluation/metrics
 * Returns all AI evaluation metrics as JSON
 */
router.get('/metrics', async (req, res, next) => {
    try {
        const metrics = await aiEval.getAllMetrics();
        apiResponse(res, 200, metrics);
    } catch (err) { next(err); }
});

/**
 * GET /api/ai-evaluation/accuracy
 * Returns accuracy metrics (MAE, confusion matrix, override rate)
 */
router.get('/accuracy', async (req, res, next) => {
    try {
        const data = await aiEval.getAccuracyMetrics();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

/**
 * GET /api/ai-evaluation/routing
 * Returns routing accuracy stats
 */
router.get('/routing', async (req, res, next) => {
    try {
        const data = await aiEval.getRoutingAccuracy();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

/**
 * GET /api/ai-evaluation/export
 * Returns all metrics as CSV for paper appendix
 */
router.get('/export', async (req, res, next) => {
    try {
        const csv = await aiEval.exportMetricsCSV();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=ai-evaluation-metrics.csv');
        res.send(csv);
    } catch (err) { next(err); }
});

module.exports = router;
