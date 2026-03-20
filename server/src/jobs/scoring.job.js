const { Worker } = require('bullmq');
const { PrismaClient } = require('@prisma/client');
const { getRedisConnection, QUEUES } = require('../config/redis');
const aiService = require('../services/ai.service');
const slaService = require('../services/sla.service');
const notificationService = require('../services/notification.service');
const { scoreToPriority } = require('../utils/helpers');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * AI Scoring Worker — processes queued complaints for priority scoring
 */
const startScoringWorker = () => {
    const worker = new Worker(
        QUEUES.AI_SCORING,
        async (job) => {
            const { complaintId } = job.data;
            logger.info('Scoring complaint', { complaintId });

            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
                include: { category: true },
            });
            if (!complaint) return;

            const result = await aiService.scoreComplaint({
                title: complaint.title,
                description: complaint.description,
                categoryName: complaint.category.name,
                categoryWeight: complaint.category.weight,
                latitude: complaint.latitude,
                longitude: complaint.longitude,
            });

            await prisma.complaint.update({
                where: { id: complaintId },
                data: {
                    priorityScore: result.priority_score,
                    priorityLevel: scoreToPriority(result.priority_score),
                    sentimentLabel: result.sentiment_label,
                    sentimentScore: result.sentiment_score,
                    urgencyKeywords: result.urgency_keywords || [],
                    aiExplanation: result.explanation || {},
                    status: 'TRIAGED',
                    previousStatus: complaint.status,
                },
            });

            // Create auto-triage log
            await prisma.complaintLog.create({
                data: {
                    complaintId,
                    actorId: complaint.citizenId,
                    fromStatus: 'SUBMITTED',
                    toStatus: 'TRIAGED',
                    note: `Auto-triaged by AI. Priority score: ${result.priority_score?.toFixed(1)}`,
                    metadata: { automated: true },
                },
            });

            logger.info('Complaint scored', { complaintId, score: result.priority_score });
        },
        { connection: getRedisConnection(), concurrency: 5 }
    );

    worker.on('failed', (job, err) => logger.error('Scoring job failed', { id: job?.id, err: err.message }));
    return worker;
};

/**
 * Duplicate Detection Worker
 */
const startDuplicateWorker = () => {
    const worker = new Worker(
        QUEUES.AI_DUPLICATE,
        async (job) => {
            const { complaintId } = job.data;
            const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
            if (!complaint) return;

            const result = await aiService.checkDuplicate({
                title: complaint.title,
                description: complaint.description,
                latitude: complaint.latitude,
                longitude: complaint.longitude,
                categoryId: complaint.categoryId,
            });

            if (result.is_duplicate && result.duplicate_of_id) {
                await prisma.complaint.update({
                    where: { id: complaintId },
                    data: {
                        isDuplicate: true,
                        duplicateOfId: result.duplicate_of_id,
                        similarityScore: result.text_similarity,
                    },
                });
                logger.info('Duplicate detected', { complaintId, duplicateOf: result.duplicate_of_id });
            }
        },
        { connection: getRedisConnection(), concurrency: 3 }
    );

    worker.on('failed', (job, err) => logger.error('Duplicate job failed', { id: job?.id, err: err.message }));
    return worker;
};

/**
 * SLA Start Worker
 */
const startSLAWorker = () => {
    const worker = new Worker(
        QUEUES.SLA_START,
        async (job) => {
            await slaService.startSLA(job.data.complaintId);
        },
        { connection: getRedisConnection(), concurrency: 10 }
    );
    worker.on('failed', (job, err) => logger.error('SLA job failed', { err: err.message }));
    return worker;
};

/**
 * Notification Worker
 */
const startNotificationWorker = () => {
    const worker = new Worker(
        QUEUES.NOTIFICATION,
        async (job) => {
            if (job.name === 'status-change') {
                await notificationService.notifyStatusChange(job.data);
            } else if (job.name === 'sla-warning') {
                await notificationService.notifySLAWarning(job.data);
            }
        },
        { connection: getRedisConnection(), concurrency: 10 }
    );
    worker.on('failed', (job, err) => logger.error('Notification job failed', { err: err.message }));
    return worker;
};

module.exports = { startScoringWorker, startDuplicateWorker, startSLAWorker, startNotificationWorker };
