require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const config = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { registerSocketHandlers } = require('./socket/handler');

// Ensure uploads + logs dirs exist
['uploads', 'logs'].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Express ────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(hpp());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(generalLimiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/complaints', require('./routes/complaint.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/public', require('./routes/public.routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found` }));

// Global error handler
app.use(errorHandler);

// ── HTTP Server + Socket.IO ────────────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: config.clientUrl, credentials: true },
    transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

// ── Start Workers (conditional — skip in test env) ─────────────────────────
if (config.nodeEnv !== 'test') {
    try {
        const { startScoringWorker, startDuplicateWorker, startSLAWorker, startNotificationWorker } = require('./jobs/scoring.job');
        const { startSLACheckWorker } = require('./jobs/slaCheck.job');

        startScoringWorker();
        startDuplicateWorker();
        startSLAWorker();
        startNotificationWorker();
        startSLACheckWorker();

        logger.info('BullMQ workers started');
    } catch (err) {
        logger.warn('BullMQ workers could not start (Redis may be unavailable)', { err: err.message });
    }
}

// ── Listen ─────────────────────────────────────────────────────────────────
server.listen(config.port, () => {
    logger.info(`CivicPulse API running`, { port: config.port, env: config.nodeEnv });
    console.log(`\n🏙️  CivicPulse v2 API ready at http://localhost:${config.port}`);
});

module.exports = { app, server };
