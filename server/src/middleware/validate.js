const { z } = require('zod');
const { apiError } = require('../utils/helpers');

/**
 * Validate request body against a Zod schema.
 * Returns 422 with field-level errors on failure.
 */
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const details = result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return apiError(res, 422, 'Validation failed', details);
    }
    req.body = result.data;
    next();
};

/**
 * Validate query params against a Zod schema
 */
const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        const details = result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return apiError(res, 422, 'Invalid query parameters', details);
    }
    req.query = result.data;
    next();
};

// ── Common Schemas ─────────────────────────────────────────────────────────
const schemas = {
    register: z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
        role: z.enum(['CITIZEN', 'OFFICER', 'ADMIN']).optional().default('CITIZEN'),
        phone: z.string().optional(),
    }),

    login: z.object({
        email: z.string().email(),
        password: z.string().min(1),
    }),

    createComplaint: z.object({
        title: z.string().min(5).max(200),
        description: z.string().min(20).max(2000),
        categoryId: z.string().uuid(),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }),

    updateStatus: z.object({
        status: z.enum(['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'VERIFICATION', 'RESOLVED', 'CLOSED', 'REOPENED', 'MERGED', 'ESCALATED']),
        note: z.string().max(500).optional(),
    }),

    assignOfficer: z.object({
        officerId: z.string().uuid(),
    }),

    mergeComplaint: z.object({
        targetId: z.string().uuid(),
    }),

    submitFeedback: z.object({
        correctedScore: z.number().min(0).max(100),
        correctedPriority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
        reason: z.string().max(500).optional(),
    }),

    createCategory: z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        weight: z.number().min(0).max(5).optional().default(1.0),
        departmentId: z.string().uuid(),
        slaConfigId: z.string().uuid().optional(),
    }),

    createDepartment: z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
    }),

    createSLAConfig: z.object({
        name: z.string().min(2).max(100),
        resolutionHours: z.number().int().positive(),
        warningHours: z.number().int().positive(),
        escalationHours: z.number().int().positive(),
    }),
};

module.exports = { validate, validateQuery, schemas };
