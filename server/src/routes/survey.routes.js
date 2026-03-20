const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { apiResponse, apiError } = require('../utils/helpers');

const prisma = new PrismaClient();

/**
 * POST /api/surveys/:complaintId
 * Citizen submits satisfaction survey after complaint resolution
 */
router.post('/:complaintId', authenticate, authorize('CITIZEN'), async (req, res, next) => {
    try {
        const { complaintId } = req.params;
        const { rating, responseTime, communication, resolution, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return apiError(res, 400, 'Rating must be between 1 and 5');
        }

        // Verify complaint exists, belongs to citizen, and is resolved/closed
        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint) return apiError(res, 404, 'Complaint not found');
        if (complaint.citizenId !== req.user.id) return apiError(res, 403, 'Not your complaint');
        if (!['RESOLVED', 'CLOSED', 'VERIFICATION'].includes(complaint.status)) {
            return apiError(res, 400, 'Complaint must be resolved before submitting a survey');
        }

        // Check if survey already exists
        const existing = await prisma.satisfactionSurvey.findUnique({ where: { complaintId } });
        if (existing) return apiError(res, 409, 'Survey already submitted for this complaint');

        const survey = await prisma.satisfactionSurvey.create({
            data: {
                complaintId,
                citizenId: req.user.id,
                rating,
                responseTime: responseTime || null,
                communication: communication || null,
                resolution: resolution || null,
                comment: comment || null,
            },
        });

        apiResponse(res, 201, survey, 'Survey submitted successfully');
    } catch (err) { next(err); }
});

/**
 * GET /api/surveys/check/:complaintId
 * Check if a survey exists for a complaint
 */
router.get('/check/:complaintId', authenticate, async (req, res, next) => {
    try {
        const survey = await prisma.satisfactionSurvey.findUnique({
            where: { complaintId: req.params.complaintId },
        });
        apiResponse(res, 200, { exists: !!survey, survey });
    } catch (err) { next(err); }
});

/**
 * GET /api/surveys/analytics
 * Admin-only aggregate survey analytics
 */
router.get('/analytics', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const surveys = await prisma.satisfactionSurvey.findMany({
            include: {
                complaint: {
                    select: {
                        priorityScore: true,
                        officerId: true,
                        category: { select: { name: true, department: { select: { name: true } } } },
                    },
                },
            },
        });

        if (surveys.length === 0) {
            return apiResponse(res, 200, {
                totalSurveys: 0,
                avgRating: 0,
                avgResponseTime: 0,
                avgCommunication: 0,
                avgResolution: 0,
                byDepartment: [],
                ratingDistribution: [],
                scoreSatisfactionCorrelation: [],
                responseRate: 0,
            });
        }

        // Averages
        const avg = (arr) => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2)) : 0;
        const avgRating = avg(surveys.map((s) => s.rating));
        const avgResponseTime = avg(surveys.filter((s) => s.responseTime).map((s) => s.responseTime));
        const avgCommunication = avg(surveys.filter((s) => s.communication).map((s) => s.communication));
        const avgResolution = avg(surveys.filter((s) => s.resolution).map((s) => s.resolution));

        // By department
        const deptMap = {};
        surveys.forEach((s) => {
            const dept = s.complaint.category?.department?.name || 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { ratings: [], count: 0 };
            deptMap[dept].ratings.push(s.rating);
            deptMap[dept].count++;
        });
        const byDepartment = Object.entries(deptMap).map(([name, data]) => ({
            name,
            avgRating: avg(data.ratings),
            count: data.count,
        }));

        // Rating distribution
        const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
            rating: r,
            count: surveys.filter((s) => s.rating === r).length,
        }));

        // AI Score vs Satisfaction correlation
        const correlation = surveys
            .filter((s) => s.complaint.priorityScore !== null)
            .map((s) => ({
                priorityScore: s.complaint.priorityScore,
                satisfaction: s.rating,
            }));

        // Response rate
        const resolvedCount = await prisma.complaint.count({
            where: { status: { in: ['RESOLVED', 'CLOSED'] } },
        });
        const responseRate = resolvedCount > 0 ? parseFloat(((surveys.length / resolvedCount) * 100).toFixed(1)) : 0;

        apiResponse(res, 200, {
            totalSurveys: surveys.length,
            avgRating,
            avgResponseTime,
            avgCommunication,
            avgResolution,
            byDepartment,
            ratingDistribution: ratingDist,
            scoreSatisfactionCorrelation: correlation,
            responseRate,
        });
    } catch (err) { next(err); }
});

module.exports = router;
