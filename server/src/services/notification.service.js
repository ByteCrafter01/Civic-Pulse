const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const emailService = require('./email.service');

const prisma = new PrismaClient();
let io; // Shared Socket.IO instance injected at startup

const setIO = (socketIO) => { io = socketIO; };

/**
 * Emit a notification to a specific user's room
 */
const notifyUser = (userId, event, data) => {
    if (!io) return;
    io.to(`user:${userId}`).emit(event, data);
    logger.debug('Socket notification sent', { userId, event });
};

/**
 * Broadcast to all admin sockets
 */
const notifyAdmins = (event, data) => {
    if (!io) return;
    io.to('role:ADMIN').emit(event, data);
};

/**
 * Broadcast global events (e.g., new complaint for officer queue refresh)
 */
const broadcastToRole = (role, event, data) => {
    if (!io) return;
    io.to(`role:${role}`).emit(event, data);
};

/**
 * Send status-change notification to complaint citizen + relevant admins
 */
const notifyStatusChange = async ({ complaintId, citizenId, fromStatus, toStatus }) => {
    const message = getStatusMessage(toStatus);

    // Socket.IO notification
    notifyUser(citizenId, 'complaint:status_changed', {
        complaintId,
        fromStatus,
        toStatus,
        message,
        timestamp: new Date().toISOString(),
    });

    notifyAdmins('complaint:status_changed', { complaintId, fromStatus, toStatus });

    // Email notification
    try {
        const citizen = await prisma.user.findUnique({
            where: { id: citizenId },
            select: { email: true, name: true, emailNotifications: true },
        });
        if (citizen && citizen.emailNotifications !== false) {
            const complaint = await prisma.complaint.findUnique({
                where: { id: complaintId },
                select: { title: true },
            });
            await emailService.sendStatusChangeEmail({
                to: citizen.email,
                citizenName: citizen.name,
                complaintTitle: complaint?.title || 'Your complaint',
                complaintId,
                fromStatus,
                toStatus,
            });

            // Send verification email when status moves to VERIFICATION
            if (toStatus === 'VERIFICATION') {
                await emailService.sendResolutionVerifyEmail({
                    to: citizen.email,
                    citizenName: citizen.name,
                    complaintTitle: complaint?.title || 'Your complaint',
                    complaintId,
                });
            }
        }
    } catch (err) {
        logger.error('Email notification failed', { complaintId, error: err.message });
    }
};

/**
 * Send SLA warning email to assigned officer
 */
const notifySLAWarning = async ({ complaintId, officerId, deadline }) => {
    // Socket.IO
    notifyUser(officerId, 'sla:warning', { complaintId, deadline });
    notifyAdmins('sla:warning', { complaintId, officerId, deadline });

    try {
        const officer = await prisma.user.findUnique({
            where: { id: officerId },
            select: { email: true, name: true },
        });
        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            select: { title: true },
        });
        if (officer) {
            await emailService.sendSLAWarningEmail({
                to: officer.email,
                officerName: officer.name,
                complaintTitle: complaint?.title || 'Complaint',
                complaintId,
                deadline,
            });
        }
    } catch (err) {
        logger.error('SLA warning email failed', { complaintId, error: err.message });
    }
};

const getStatusMessage = (status) => {
    const messages = {
        TRIAGED: 'Your complaint has been reviewed and prioritized.',
        ASSIGNED: 'An officer has been assigned to your complaint.',
        IN_PROGRESS: 'Work on your complaint has begun.',
        VERIFICATION: 'Your complaint has been resolved. Please verify.',
        RESOLVED: 'Your complaint has been marked resolved.',
        CLOSED: 'Your complaint has been closed.',
        REOPENED: 'Your complaint has been reopened for review.',
        ESCALATED: 'Your complaint has been escalated to a senior officer.',
        MERGED: 'Your complaint has been merged with a similar report.',
    };
    return messages[status] || `Your complaint status changed to ${status}.`;
};

module.exports = { setIO, notifyUser, notifyAdmins, broadcastToRole, notifyStatusChange, notifySLAWarning };
