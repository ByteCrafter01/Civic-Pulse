const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const analytics = require('../services/analytics.service');
const { apiResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// GET /api/public/stats — sanitized aggregate (no PII)
router.get('/stats', async (req, res, next) => {
    try {
        const data = await analytics.getPublicStats();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

// GET /api/public/heatmap — complaint density
router.get('/heatmap', async (req, res, next) => {
    try {
        const data = await analytics.getHeatmapData();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

// GET /api/public/track/:id — track complaint by ID (no login)
router.get('/track/:id', async (req, res, next) => {
    try {
        const searchId = req.params.id.trim();
        const selectFields = {
            id: true, title: true, status: true, priorityLevel: true,
            createdAt: true, updatedAt: true, slaDeadline: true, slaBreached: true,
            category: { select: { name: true } },
            logs: {
                select: { fromStatus: true, toStatus: true, note: true, createdAt: true },
                orderBy: { createdAt: 'asc' },
            },
        };

        // Try exact match first
        let complaint = await prisma.complaint.findUnique({
            where: { id: searchId },
            select: selectFields,
        });

        // If not found, try partial match (starts with)
        if (!complaint) {
            complaint = await prisma.complaint.findFirst({
                where: { id: { startsWith: searchId } },
                select: selectFields,
            });
        }

        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
        apiResponse(res, 200, complaint);
    } catch (err) { next(err); }
});

// GET /api/public/by-department — public department summary
router.get('/by-department', async (req, res, next) => {
    try {
        const data = await analytics.getByDepartment();
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

module.exports = router;
