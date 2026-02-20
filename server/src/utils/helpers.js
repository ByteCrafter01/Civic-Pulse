/**
 * Shared utility helpers for CivicPulse server
 */

const PRIORITY_THRESHOLDS = {
    CRITICAL: 80,
    HIGH: 60,
    MEDIUM: 40,
    LOW: 0,
};

/**
 * Derive priority level enum from numeric score (0-100)
 */
const scoreToPriority = (score) => {
    if (score >= PRIORITY_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (score >= PRIORITY_THRESHOLDS.HIGH) return 'HIGH';
    if (score >= PRIORITY_THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
};

/**
 * Calculate SLA deadlines from SLAConfig and a start time
 */
const calculateSLADates = (slaConfig, startTime = new Date()) => {
    const start = new Date(startTime);
    const deadline = new Date(start.getTime() + slaConfig.resolutionHours * 60 * 60 * 1000);
    const warningAt = new Date(start.getTime() + slaConfig.warningHours * 60 * 60 * 1000);
    return { slaDeadline: deadline, slaWarningAt: warningAt };
};

/**
 * Haversine distance in meters between two lat/lng points
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dphi = ((lat2 - lat1) * Math.PI) / 180;
    const dlam = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Paginate a Prisma query result set
 */
const paginate = (page = 1, limit = 20) => ({
    skip: (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit)),
    take: Math.min(100, parseInt(limit)),
});

/**
 * Build a standard API response envelope
 */
const apiResponse = (res, statusCode, data, message = 'Success') =>
    res.status(statusCode).json({ success: true, message, data });

const apiError = (res, statusCode, message, details = null) =>
    res.status(statusCode).json({ success: false, message, ...(details && { details }) });

module.exports = { scoreToPriority, calculateSLADates, haversineDistance, paginate, apiResponse, apiError };
