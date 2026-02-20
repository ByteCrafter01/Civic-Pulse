const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

const aiClient = axios.create({
    baseURL: config.aiServiceUrl,
    timeout: 30000,
});

/**
 * Score a complaint via the AI microservice
 */
const scoreComplaint = async ({ title, description, categoryName, categoryWeight, latitude, longitude }) => {
    try {
        const { data } = await aiClient.post('/score', {
            title, description,
            category_name: categoryName,
            category_weight: categoryWeight,
            lat: latitude,
            lng: longitude,
        });
        return data;
    } catch (err) {
        logger.warn('AI scoring failed, using defaults', { error: err.message });
        // Graceful fallback — don't block complaint creation
        return {
            priority_score: 50,
            priority_level: 'MEDIUM',
            sentiment_label: 'NEUTRAL',
            sentiment_score: 0,
            urgency_keywords: [],
            explanation: {},
        };
    }
};

/**
 * Check for semantic duplicates
 */
const checkDuplicate = async ({ title, description, latitude, longitude, categoryId }) => {
    try {
        const { data } = await aiClient.post('/check-duplicate', {
            title, description, lat: latitude, lng: longitude, category_id: categoryId,
        });
        return data;
    } catch (err) {
        logger.warn('Duplicate check failed', { error: err.message });
        return { is_duplicate: false };
    }
};

/**
 * Route complaint to a department
 */
const routeComplaint = async ({ title, description }) => {
    try {
        const { data } = await aiClient.post('/route', { title, description });
        return data;
    } catch (err) {
        logger.warn('AI routing failed', { error: err.message });
        return { department: null, confidence: 0, alternatives: [] };
    }
};

/**
 * Health check for AI service
 */
const healthCheck = async () => {
    const { data } = await aiClient.get('/health');
    return data;
};

module.exports = { scoreComplaint, checkDuplicate, routeComplaint, healthCheck };
