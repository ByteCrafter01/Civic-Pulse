const { Worker, Queue } = require('bullmq');
const { getRedisConnection, QUEUES } = require('../config/redis');
const slaService = require('../services/sla.service');
const logger = require('../utils/logger');

/**
 * SLA periodic check worker — runs every 15 minutes via cron
 */
const startSLACheckWorker = () => {
    // Scheduler queue
    const schedulerQueue = new Queue(QUEUES.SLA_CHECK, { connection: getRedisConnection() });

    // Register cron job (upsert — idempotent)
    schedulerQueue.add(
        'sweep',
        {},
        {
            repeat: { every: 15 * 60 * 1000 }, // every 15 min
            jobId: 'sla-sweep-cron',
            removeOnComplete: 10,
        }
    ).catch((e) => logger.warn('SLA cron register failed', { e: e.message }));

    const worker = new Worker(
        QUEUES.SLA_CHECK,
        async () => {
            const count = await slaService.checkBreaches();
            logger.info('SLA sweep complete', { breachesFound: count });
        },
        { connection: getRedisConnection(), concurrency: 1 }
    );

    worker.on('failed', (job, err) => logger.error('SLA check failed', { err: err.message }));
    logger.info('SLA check worker started (every 15 min)');
    return worker;
};

module.exports = { startSLACheckWorker };
