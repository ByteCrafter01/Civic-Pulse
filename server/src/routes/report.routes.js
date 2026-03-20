const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const reportService = require('../services/report.service');
const { apiError } = require('../utils/helpers');

/**
 * GET /api/reports/monthly
 * Generate and download monthly PDF report (Admin only)
 */
router.get('/monthly', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const pdf = await reportService.generateMonthlyReport();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=civicpulse-monthly-report.pdf');
        res.send(pdf);
    } catch (err) { next(err); }
});

/**
 * GET /api/reports/complaint/:id/receipt
 * Generate complaint receipt PDF (Citizen: own complaint only)
 */
router.get('/complaint/:id/receipt', authenticate, async (req, res, next) => {
    try {
        const pdf = await reportService.generateComplaintReceipt(req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=complaint-${req.params.id.slice(0, 8)}-receipt.pdf`);
        res.send(pdf);
    } catch (err) {
        if (err.message === 'Complaint not found') return apiError(res, 404, 'Complaint not found');
        next(err);
    }
});

/**
 * GET /api/reports/ai-evaluation
 * Generate AI evaluation PDF report (Admin only)
 */
router.get('/ai-evaluation', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const pdf = await reportService.generateAIEvaluationReport();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=ai-evaluation-report.pdf');
        res.send(pdf);
    } catch (err) { next(err); }
});

module.exports = router;
