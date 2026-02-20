const winston = require('winston');
const config = require('../config/env');

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const logger = winston.createLogger({
    level: config.isDev ? 'debug' : 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (config.isDev) {
    logger.add(new winston.transports.Console({
        format: combine(colorize(), simple()),
    }));
}

module.exports = logger;
