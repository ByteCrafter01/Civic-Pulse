require('dotenv').config();
const Joi = require('joi');

const schema = Joi.object({
    PORT: Joi.number().default(5000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().default('redis://localhost:6379'),
    JWT_SECRET: Joi.string().min(16).required(),
    JWT_REFRESH_SECRET: Joi.string().min(16).required(),
    JWT_EXPIRES_IN: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    AI_SERVICE_URL: Joi.string().uri().default('http://localhost:8000'),
    MAX_FILE_SIZE: Joi.number().default(5 * 1024 * 1024),
    UPLOAD_DIR: Joi.string().default('./uploads'),
    CLIENT_URL: Joi.string().default('http://localhost:5173'),
    SMTP_HOST: Joi.string().optional(),
    SMTP_PORT: Joi.number().optional(),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    EMAIL_FROM: Joi.string().optional(),
}).unknown(true);

const { error, value } = schema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    port: value.PORT,
    nodeEnv: value.NODE_ENV,
    isDev: value.NODE_ENV === 'development',
    databaseUrl: value.DATABASE_URL,
    redisUrl: value.REDIS_URL,
    jwt: {
        secret: value.JWT_SECRET,
        refreshSecret: value.JWT_REFRESH_SECRET,
        expiresIn: value.JWT_EXPIRES_IN,
        refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
    },
    aiServiceUrl: value.AI_SERVICE_URL,
    maxFileSize: value.MAX_FILE_SIZE,
    uploadDir: value.UPLOAD_DIR,
    clientUrl: value.CLIENT_URL,
    smtp: {
        host: value.SMTP_HOST,
        port: value.SMTP_PORT,
        user: value.SMTP_USER,
        pass: value.SMTP_PASS,
        from: value.EMAIL_FROM,
    },
};
