const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const { citizenLimiter } = require('../middleware/rateLimiter');
const complaintsvc = require('../services/complaint.service');
const { apiResponse } = require('../utils/helpers');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'), false);
    },
});

// POST /api/complaints
router.post('/', authenticate, citizenLimiter, upload.single('image'), async (req, res, next) => {
    try {
        const body = JSON.parse(req.body.data || '{}');
        body.latitude = parseFloat(body.latitude);
        body.longitude = parseFloat(body.longitude);
        body.imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        body.citizenId = req.user.id;

        const validated = schemas.createComplaint.parse(body);
        const complaint = await complaintsvc.create({ ...validated, ...body });
        apiResponse(res, 201, complaint, 'Complaint submitted successfully');
    } catch (err) { next(err); }
});

// GET /api/complaints
router.get('/', authenticate, async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, priority, departmentId, search } = req.query;
        const result = await complaintsvc.findAll({
            role: req.user.role, userId: req.user.id,
            page, limit, status, priority, departmentId, search,
        });
        apiResponse(res, 200, result);
    } catch (err) { next(err); }
});

// GET /api/complaints/:id
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const complaint = await complaintsvc.findById(req.params.id, req.user.id, req.user.role);
        apiResponse(res, 200, complaint);
    } catch (err) { next(err); }
});

// PATCH /api/complaints/:id/status
router.patch('/:id/status', authenticate, validate(schemas.updateStatus), async (req, res, next) => {
    try {
        const updated = await complaintsvc.updateStatus(req.params.id, req.body, req.user.id, req.user.role);
        apiResponse(res, 200, updated, 'Status updated');
    } catch (err) { next(err); }
});

// PATCH /api/complaints/:id/assign  (Admin only)
router.patch('/:id/assign', authenticate, authorize('ADMIN'), validate(schemas.assignOfficer), async (req, res, next) => {
    try {
        const updated = await complaintsvc.assign(req.params.id, req.body.officerId, req.user.id);
        apiResponse(res, 200, updated, 'Officer assigned');
    } catch (err) { next(err); }
});

// PATCH /api/complaints/:id/merge  (Admin only)
router.patch('/:id/merge', authenticate, authorize('ADMIN'), validate(schemas.mergeComplaint), async (req, res, next) => {
    try {
        const updated = await complaintsvc.merge(req.params.id, req.body.targetId, req.user.id);
        apiResponse(res, 200, updated, 'Complaint merged');
    } catch (err) { next(err); }
});

module.exports = router;
