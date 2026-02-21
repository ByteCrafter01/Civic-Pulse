const { PrismaClient } = require('@prisma/client');
const { validateTransition } = require('./workflow.service');
const { scoreToPriority, paginate } = require('../utils/helpers');
const { getQueue, QUEUES, redisEnabled } = require('../config/redis');
const { scoreComplaint, groqEnabled } = require('./ai.service');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const COMPLAINT_INCLUDE = {
    category: { include: { department: true, slaConfig: true } },
    citizen: { select: { id: true, name: true, email: true } },
    officer: { select: { id: true, name: true, email: true } },
    logs: {
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
    },
};

const create = async ({ title, description, categoryId, latitude, longitude, citizenId, imageUrl }) => {
    const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { slaConfig: true },
    });
    if (!category) throw { statusCode: 404, isOperational: true, message: 'Category not found' };

    let complaint = await prisma.complaint.create({
        data: { title, description, categoryId, latitude, longitude, citizenId, imageUrl },
        include: COMPLAINT_INCLUDE,
    });

    // If Groq AI is available, score inline (no Redis needed)
    if (groqEnabled) {
        try {
            const aiResult = await scoreComplaint({
                title, description,
                categoryName: category.name,
                categoryWeight: category.slaConfig?.weight || 1,
                latitude, longitude,
            });
            complaint = await prisma.complaint.update({
                where: { id: complaint.id },
                data: {
                    priorityScore: aiResult.priority_score || 50,
                    priorityLevel: aiResult.priority_level || 'MEDIUM',
                    sentimentLabel: aiResult.sentiment_label || 'NEUTRAL',
                    sentimentScore: aiResult.sentiment_score || 0,
                    urgencyKeywords: aiResult.urgency_keywords || [],
                    aiExplanation: aiResult.explanation || {},
                },
                include: COMPLAINT_INCLUDE,
            });
            logger.info('AI scored inline', { id: complaint.id, score: aiResult.priority_score });
        } catch (err) {
            logger.warn('Inline AI scoring failed, complaint saved without score', { error: err.message });
        }
    } else if (redisEnabled) {
        // Fallback: queue via BullMQ
        await Promise.all([
            getQueue(QUEUES.AI_SCORING).add('score', { complaintId: complaint.id }),
            getQueue(QUEUES.AI_DUPLICATE).add('check', { complaintId: complaint.id }),
            getQueue(QUEUES.AI_ROUTING).add('route', { complaintId: complaint.id }),
        ]);
    }

    logger.info('Complaint created', { id: complaint.id, citizenId });
    return complaint;
};

const findAll = async ({ role, userId, page, limit, status, priority, departmentId, search }) => {
    const where = {};

    // Citizens can only see their own
    if (role === 'CITIZEN') where.citizenId = userId;

    // Officers see their assigned + their department's
    if (role === 'OFFICER') {
        const officerUser = await prisma.user.findUnique({ where: { id: userId } });
        if (officerUser?.departmentId) {
            where.OR = [
                { officerId: userId },
                { category: { departmentId: officerUser.departmentId } },
            ];
        } else {
            where.officerId = userId;
        }
    }

    if (status) where.status = status;
    if (priority) where.priorityLevel = priority;
    if (departmentId) where.category = { departmentId };
    if (search) where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
    ];

    const { skip, take } = paginate(page, limit);

    const [data, total] = await Promise.all([
        prisma.complaint.findMany({
            where,
            include: {
                category: { include: { department: true } },
                citizen: { select: { id: true, name: true } },
                officer: { select: { id: true, name: true } },
            },
            orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
            skip,
            take,
        }),
        prisma.complaint.count({ where }),
    ]);

    return { data, total, page: +page || 1, limit: +limit || 20, pages: Math.ceil(total / take) };
};

const findById = async (id, userId, role) => {
    const complaint = await prisma.complaint.findUnique({ where: { id }, include: COMPLAINT_INCLUDE });
    if (!complaint) throw { statusCode: 404, isOperational: true, message: 'Complaint not found' };

    // Citizens can only view their own
    if (role === 'CITIZEN' && complaint.citizenId !== userId) {
        throw { statusCode: 403, isOperational: true, message: 'Access denied' };
    }
    return complaint;
};

const updateStatus = async (id, { status, note }, actorId, role) => {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw { statusCode: 404, isOperational: true, message: 'Complaint not found' };

    const { valid, reason } = validateTransition(complaint.status, status, role);
    if (!valid) throw { statusCode: 422, isOperational: true, message: reason };

    const [updated] = await Promise.all([
        prisma.complaint.update({
            where: { id },
            data: {
                previousStatus: complaint.status,
                status,
                resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
            },
            include: COMPLAINT_INCLUDE,
        }),
        prisma.complaintLog.create({
            data: { complaintId: id, actorId, fromStatus: complaint.status, toStatus: status, note },
        }),
    ]);

    // Queue notification
    await getQueue(QUEUES.NOTIFICATION).add('status-change', {
        complaintId: id,
        citizenId: complaint.citizenId,
        fromStatus: complaint.status,
        toStatus: status,
    });

    // If SLA should start (complaint assigned)
    if (status === 'ASSIGNED') {
        await getQueue(QUEUES.SLA_START).add('start', { complaintId: id });
    }

    logger.info('Status updated', { id, from: complaint.status, to: status, actor: actorId });
    return updated;
};

const assign = async (id, officerId, actorId) => {
    const [officer, complaint] = await Promise.all([
        prisma.user.findUnique({ where: { id: officerId } }),
        prisma.complaint.findUnique({ where: { id } }),
    ]);

    if (!officer || officer.role !== 'OFFICER') {
        throw { statusCode: 400, isOperational: true, message: 'Invalid officer' };
    }
    if (!complaint) throw { statusCode: 404, isOperational: true, message: 'Complaint not found' };

    const updated = await prisma.complaint.update({
        where: { id },
        data: {
            officerId,
            status: 'ASSIGNED',
            previousStatus: complaint.status,
        },
        include: COMPLAINT_INCLUDE,
    });

    await prisma.complaintLog.create({
        data: {
            complaintId: id,
            actorId,
            fromStatus: complaint.status,
            toStatus: 'ASSIGNED',
            note: `Assigned to officer ${officer.name}`,
        },
    });

    await getQueue(QUEUES.SLA_START).add('start', { complaintId: id });
    return updated;
};

const merge = async (id, targetId, actorId) => {
    if (id === targetId) throw { statusCode: 400, isOperational: true, message: 'Cannot merge with itself' };

    const [source, target] = await Promise.all([
        prisma.complaint.findUnique({ where: { id } }),
        prisma.complaint.findUnique({ where: { id: targetId } }),
    ]);

    if (!source || !target) throw { statusCode: 404, isOperational: true, message: 'Complaint not found' };

    const updated = await prisma.complaint.update({
        where: { id },
        data: { status: 'MERGED', isDuplicate: true, duplicateOfId: targetId },
        include: COMPLAINT_INCLUDE,
    });

    await prisma.complaintLog.create({
        data: {
            complaintId: id,
            actorId,
            fromStatus: source.status,
            toStatus: 'MERGED',
            note: `Merged into complaint ${targetId}`,
        },
    });

    return updated;
};

module.exports = { create, findAll, findById, updateStatus, assign, merge };
