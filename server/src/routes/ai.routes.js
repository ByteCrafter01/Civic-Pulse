const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { groqChat, groqSuggestCategory, groqEnabled } = require('../services/ai.service');
const { PrismaClient } = require('@prisma/client');
const { apiResponse } = require('../utils/helpers');

const prisma = new PrismaClient();

// POST /api/ai/chat — AI chatbot
router.post('/chat', authenticate, async (req, res, next) => {
    try {
        if (!groqEnabled) {
            return res.status(503).json({ success: false, message: 'AI service not configured' });
        }
        const { messages, context } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: 'Messages array required' });
        }
        const result = await groqChat(messages, context || {});
        apiResponse(res, 200, result);
    } catch (err) { next(err); }
});

// POST /api/ai/suggest-category — AI category suggestion
router.post('/suggest-category', authenticate, async (req, res, next) => {
    try {
        if (!groqEnabled) {
            return res.status(503).json({ success: false, message: 'AI service not configured' });
        }
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description required' });
        }
        const categories = await prisma.category.findMany({
            include: { department: { select: { name: true } } },
        });
        const result = await groqSuggestCategory({ title, description, categories });
        apiResponse(res, 200, result);
    } catch (err) { next(err); }
});

// GET /api/ai/status — AI service status
router.get('/status', async (req, res) => {
    res.json({
        success: true,
        data: {
            groq: groqEnabled ? 'active' : 'disabled',
            model: groqEnabled ? 'llama-3.3-70b-versatile' : null,
        },
    });
});

module.exports = router;
