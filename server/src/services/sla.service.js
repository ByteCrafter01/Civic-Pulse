const { PrismaClient } = require('@prisma/client');
const { calculateSLADates } = require('../utils/helpers');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Set SLA deadlines on a complaint based on its category's SLAConfig
 */
const startSLA = async (complaintId) => {
    const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: { category: { include: { slaConfig: true } } },
    });

    if (!complaint || !complaint.category.slaConfig) return;

    const { slaDeadline, slaWarningAt } = calculateSLADates(complaint.category.slaConfig);

    await prisma.complaint.update({
        where: { id: complaintId },
        data: { slaDeadline, slaWarningAt },
    });

    logger.info('SLA set', { complaintId, slaDeadline, slaWarningAt });
};

/**
 * Sweep for SLA breaches and mark/escalate
 */
const checkBreaches = async () => {
    const now = new Date();

    const breached = await prisma.complaint.findMany({
        where: {
            slaDeadline: { lte: now },
            slaBreached: false,
            status: {
                notIn: ['RESOLVED', 'CLOSED', 'MERGED'],
            },
        },
        select: { id: true, status: true },
    });

    logger.info(`SLA sweep: found ${breached.length} breaches`);

    for (const c of breached) {
        await prisma.complaint.update({
            where: { id: c.id },
            data: {
                slaBreached: true,
                slaBreachedAt: now,
                status: c.status !== 'ESCALATED' ? 'ESCALATED' : undefined,
            },
        });
    }

    return breached.length;
};

/**
 * Get SLA summary stats (for dashboard)
 */
const getSLAStats = async () => {
    const [total, breached, atRisk] = await Promise.all([
        prisma.complaint.count({ where: { slaDeadline: { not: null } } }),
        prisma.complaint.count({ where: { slaBreached: true } }),
        prisma.complaint.count({
            where: {
                slaWarningAt: { lte: new Date() },
                slaBreached: false,
                status: { notIn: ['RESOLVED', 'CLOSED', 'MERGED'] },
            },
        }),
    ]);

    return {
        total,
        breached,
        atRisk,
        breachRate: total > 0 ? ((breached / total) * 100).toFixed(1) : 0,
    };
};

module.exports = { startSLA, checkBreaches, getSLAStats };
