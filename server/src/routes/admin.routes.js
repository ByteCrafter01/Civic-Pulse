const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { apiResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// ── Departments ─────────────────────────────────────────────────────────────
router.get('/departments', authenticate, async (req, res, next) => {
    try {
        const data = await prisma.department.findMany({ include: { _count: { select: { categories: true, officers: true } } } });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.post('/departments', authenticate, authorize('ADMIN'), validate(schemas.createDepartment), async (req, res, next) => {
    try {
        const data = await prisma.department.create({ data: req.body });
        apiResponse(res, 201, data);
    } catch (err) { next(err); }
});

router.patch('/departments/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.delete('/departments/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.department.delete({ where: { id: req.params.id } });
        apiResponse(res, 200, null, 'Department deleted');
    } catch (err) { next(err); }
});

// ── Categories ──────────────────────────────────────────────────────────────
router.get('/categories', authenticate, async (req, res, next) => {
    try {
        const data = await prisma.category.findMany({ include: { department: true, slaConfig: true, _count: { select: { complaints: true } } } });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.post('/categories', authenticate, authorize('ADMIN'), validate(schemas.createCategory), async (req, res, next) => {
    try {
        const data = await prisma.category.create({ data: req.body, include: { department: true } });
        apiResponse(res, 201, data);
    } catch (err) { next(err); }
});

router.patch('/categories/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.category.update({ where: { id: req.params.id }, data: req.body, include: { department: true } });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.delete('/categories/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        await prisma.category.delete({ where: { id: req.params.id } });
        apiResponse(res, 200, null, 'Category deleted');
    } catch (err) { next(err); }
});

// ── SLA Configs ─────────────────────────────────────────────────────────────
router.get('/sla-configs', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.sLAConfig.findMany({ include: { _count: { select: { categories: true } } } });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.post('/sla-configs', authenticate, authorize('ADMIN'), validate(schemas.createSLAConfig), async (req, res, next) => {
    try {
        const data = await prisma.sLAConfig.create({ data: req.body });
        apiResponse(res, 201, data);
    } catch (err) { next(err); }
});

router.patch('/sla-configs/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.sLAConfig.update({ where: { id: req.params.id }, data: req.body });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

// ── Officers ─────────────────────────────────────────────────────────────────
router.get('/officers', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const data = await prisma.user.findMany({
            where: { role: 'OFFICER', isActive: true },
            select: { id: true, name: true, email: true, department: true, _count: { select: { assigned: true } } },
        });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

router.patch('/officers/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
    try {
        const { departmentId, isActive } = req.body;
        const data = await prisma.user.update({
            where: { id: req.params.id },
            data: { departmentId, isActive },
            select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
        });
        apiResponse(res, 200, data);
    } catch (err) { next(err); }
});

module.exports = router;
