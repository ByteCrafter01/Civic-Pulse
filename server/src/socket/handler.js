const logger = require('../utils/logger');
const notificationService = require('../services/notification.service');

/**
 * Register Socket.IO event handlers
 */
const registerSocketHandlers = (io) => {
    // Inject IO reference into notification service
    notificationService.setIO(io);

    io.on('connection', (socket) => {
        logger.info('Socket connected', { socketId: socket.id });

        // Client sends their JWT user data on 'join'
        socket.on('join', ({ userId, role }) => {
            if (userId) {
                socket.join(`user:${userId}`);
                logger.debug('Socket joined user room', { userId, socketId: socket.id });
            }
            if (role) {
                socket.join(`role:${role}`);
                logger.debug('Socket joined role room', { role, socketId: socket.id });
            }
            socket.emit('joined', { status: 'ok', userId, role });
        });

        // Leave all rooms on disconnect
        socket.on('disconnect', (reason) => {
            logger.info('Socket disconnected', { socketId: socket.id, reason });
        });

        // Ping/pong for connection health
        socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));
    });
};

module.exports = { registerSocketHandlers };
