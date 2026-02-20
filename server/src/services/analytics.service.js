const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboardStats = async (role, userId) => {
    const where = {};
    if (role === 'CITIZEN') where.citizenId = userId;
    if (role === 'OFFICER') where.officerId = userId;

    const [total, pending, inProgress, resolved, breached] = await Promise.all([
        prisma.complaint.count({ where }),
        prisma.complaint.count({ where: { ...where, status: { in: ['SUBMITTED', 'TRIAGED', 'ASSIGNED'] } } }),
        prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.complaint.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
        prisma.complaint.count({ where: { ...where, slaBreached: true } }),
    ]);

    return { total, pending, inProgress, resolved, breached };
};

const getByDepartment = async () => {
    const data = await prisma.department.findMany({
        include: {
            categories: {
                include: {
                    _count: { select: { complaints: true } },
                    complaints: {
                        select: { status: true, priorityLevel: true },
                    },
                },
            },
        },
    });

    return data.map((dept) => {
        const complaints = dept.categories.flatMap((c) => c.complaints);
        return {
            id: dept.id,
            name: dept.name,
            total: complaints.length,
            resolved: complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
            critical: complaints.filter((c) => c.priorityLevel === 'CRITICAL').length,
        };
    });
};

const getByCategory = async () => {
    const data = await prisma.category.findMany({
        include: {
            department: { select: { name: true } },
            _count: { select: { complaints: true } },
        },
        orderBy: { complaints: { _count: 'desc' } },
    });

    return data.map((c) => ({
        id: c.id,
        name: c.name,
        department: c.department.name,
        count: c._count.complaints,
    }));
};

const getTrends = async () => {
    const weeks = 12;
    const results = [];

    for (let i = weeks - 1; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - (i + 1) * 7);
        const end = new Date();
        end.setDate(end.getDate() - i * 7);

        const [submitted, resolved] = await Promise.all([
            prisma.complaint.count({ where: { createdAt: { gte: start, lt: end } } }),
            prisma.complaint.count({ where: { resolvedAt: { gte: start, lt: end } } }),
        ]);

        results.push({
            week: `W${weeks - i}`,
            start: start.toISOString().split('T')[0],
            submitted,
            resolved,
        });
    }

    return results;
};

const getHeatmapData = async () => {
    const complaints = await prisma.complaint.findMany({
        select: { latitude: true, longitude: true, priorityScore: true },
        where: { status: { notIn: ['CLOSED', 'MERGED'] } },
    });

    return complaints.map((c) => ({
        lat: c.latitude,
        lng: c.longitude,
        intensity: c.priorityScore ? c.priorityScore / 100 : 0.5,
    }));
};

const getPublicStats = async () => {
    const [total, resolved, critical] = await Promise.all([
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
        prisma.complaint.count({ where: { priorityLevel: 'CRITICAL' } }),
    ]);

    return {
        total,
        resolved,
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
        critical,
    };
};

module.exports = { getDashboardStats, getByDepartment, getByCategory, getTrends, getHeatmapData, getPublicStats };
