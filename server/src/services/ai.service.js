const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

const groqEnabled = !!config.groqApiKey;
let Groq;
let groqClient;

if (groqEnabled) {
    Groq = require('groq-sdk');
    groqClient = new Groq({ apiKey: config.groqApiKey });
    logger.info('Groq AI enabled — using Llama for complaint analysis');
}

// ─── Groq-powered scoring via Llama ───────────────────────────────────────────

const groqScore = async ({ title, description, categoryName }) => {
    const prompt = `You are a municipal complaint triage AI. Analyze this civic complaint and return a JSON object.
The complaint may be in English or Hindi — process it in whichever language it is written in.
If the complaint is in Hindi, provide the reasoning field in Hindi as well.

Complaint Title: ${title}
Description: ${description}
Category: ${categoryName || 'Unknown'}

Return ONLY valid JSON with these fields:
{
  "priority_score": <number 0-100, higher = more urgent>,
  "priority_level": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "sentiment_label": <"POSITIVE" | "NEUTRAL" | "NEGATIVE">,
  "sentiment_score": <number -1 to 1>,
  "urgency_keywords": <array of urgent words found, e.g. ["flood", "danger", "children"]>,
  "explanation": {
    "severity": <number 0-10>,
    "public_safety_risk": <number 0-10>,
    "affected_population": <"individual" | "neighborhood" | "district" | "city">,
    "time_sensitivity": <"low" | "moderate" | "high" | "immediate">,
    "reasoning": "<one sentence explaining the priority score>"
  }
}`;

    const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
};

// ─── Groq-powered chatbot ─────────────────────────────────────────────────────

const groqChat = async (messages, context = {}) => {
    if (!groqEnabled) return { reply: 'AI assistant is not configured.' };

    const systemPrompt = `You are CivicPulse AI, a helpful municipal complaint assistant for a government portal. You help citizens with:
- Understanding the complaint process
- Drafting better complaint descriptions
- Explaining complaint statuses and timelines
- Providing general civic information

Be concise, professional, and helpful. Keep responses under 150 words.
${context.complaintTitle ? `\nContext — the user is viewing complaint: "${context.complaintTitle}" (Status: ${context.complaintStatus})` : ''}`;

    const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-6), // keep last 6 messages for context
        ],
        temperature: 0.7,
        max_tokens: 300,
    });

    return { reply: response.choices[0].message.content };
};

// ─── Groq-powered smart suggest ───────────────────────────────────────────────

const groqSuggestCategory = async ({ title, description, categories }) => {
    if (!groqEnabled) return { suggestedCategory: null, confidence: 0 };

    const catList = categories.map(c => `${c.id}: ${c.name} (${c.department?.name || 'Unknown dept'})`).join('\n');

    const prompt = `Given this civic complaint, suggest the best category from the list.

Complaint: ${title}. ${description}

Categories:
${catList}

Return ONLY valid JSON: {"category_id": "<id>", "confidence": <0-1>, "reason": "<brief reason>"}`;

    const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
};

// ─── Original microservice-based functions (fallback) ─────────────────────────

const aiClient = axios.create({
    baseURL: config.aiServiceUrl,
    timeout: 30000,
});

const DEFAULTS = {
    priority_score: 50,
    priority_level: 'MEDIUM',
    sentiment_label: 'NEUTRAL',
    sentiment_score: 0,
    urgency_keywords: [],
    explanation: {},
};

const scoreComplaint = async ({ title, description, categoryName, categoryWeight, latitude, longitude }) => {
    // Try Groq first if enabled
    if (groqEnabled) {
        try {
            const result = await groqScore({ title, description, categoryName });
            logger.info('Groq AI scored complaint', { score: result.priority_score, level: result.priority_level });
            return result;
        } catch (err) {
            logger.warn('Groq scoring failed, trying microservice', { error: err.message });
        }
    }

    // Fallback to Python microservice
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
        return DEFAULTS;
    }
};

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

const routeComplaint = async ({ title, description }) => {
    try {
        const { data } = await aiClient.post('/route', { title, description });
        return data;
    } catch (err) {
        logger.warn('AI routing failed', { error: err.message });
        return { department: null, confidence: 0, alternatives: [] };
    }
};

const healthCheck = async () => {
    const status = { groq: groqEnabled ? 'connected' : 'disabled' };
    try {
        const { data } = await aiClient.get('/health');
        status.microservice = data;
    } catch {
        status.microservice = 'offline';
    }
    return status;
};

module.exports = {
    scoreComplaint,
    checkDuplicate,
    routeComplaint,
    healthCheck,
    groqChat,
    groqSuggestCategory,
    groqEnabled,
};
