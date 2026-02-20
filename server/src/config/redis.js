const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const config = require('./env');
const logger = require('../utils/logger');

let redisConnection;

const getRedisConnection = () => {
    if (!redisConnection) {
        redisConnection = new IORedis(config.redisUrl, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
        });

        redisConnection.on('connect', () => logger.info('Redis connected'));
        redisConnection.on('error', (err) => logger.error('Redis error', { err: err.message }));
    }
    return redisConnection;
};

const QUEUES = {
    AI_SCORING: 'ai.scoring',
    AI_DUPLICATE: 'ai.duplicate',
    AI_ROUTING: 'ai.routing',
    SLA_START: 'sla.start',
    SLA_CHECK: 'sla.check',
    NOTIFICATION: 'notification',
    WORKFLOW_TRANSITION: 'workflow.transition',
    ANALYTICS_UPDATE: 'analytics.update',
};

const queues = {};

const getQueue = (name) => {
    if (!queues[name]) {
        queues[name] = new Queue(name, {
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });
    }
    return queues[name];
};

module.exports = { getRedisConnection, getQueue, QUEUES };
