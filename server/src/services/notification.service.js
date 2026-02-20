const logger = require('../utils/logger');

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

    notifyUser(citizenId, 'complaint:status_changed', {
        complaintId,
        fromStatus,
        toStatus,
        message,
        timestamp: new Date().toISOString(),
    });

    notifyAdmins('complaint:status_changed', { complaintId, fromStatus, toStatus });
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

module.exports = { setIO, notifyUser, notifyAdmins, broadcastToRole, notifyStatusChange };
