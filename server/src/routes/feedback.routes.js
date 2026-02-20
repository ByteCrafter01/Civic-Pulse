const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { apiResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// POST /api/feedback/:complaintId  (Officers only)
router.post('/:complaintId', authenticate, authorize('OFFICER', 'ADMIN'), validate(schemas.submitFeedback), async (req, res, next) => {
    try {
        const complaint = await prisma.complaint.findUnique({ where: { id: req.params.complaintId } });
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        const feedback = await prisma.aIFeedback.create({
            data: {
                complaintId: req.params.complaintId,
                officerId: req.user.id,
                originalScore: complaint.priorityScore || 50,
                correctedScore: req.body.correctedScore,
                correctedPriority: req.body.correctedPriority,
                reason: req.body.reason,
            },
        });

        apiResponse(res, 201, feedback, 'Feedback recorded');
    } catch (err) { next(err); }
});

// GET /api/feedback/:complaintId  — list feedback for a complaint
router.get('/:complaintId', authenticate, authorize('OFFICER', 'ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.aIFeedback.findMany({
            where: { complaintId: req.params.complaintId },
            include: { officer: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

// GET /api/feedback  — all feedback (Admin analytics)
router.get('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.aIFeedback.findMany({
            include: {
                complaint: { select: { id: true, title: true, priorityScore: true } },
                officer: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

module.exports = router;
