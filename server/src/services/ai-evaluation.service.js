const { PrismaClient } = require('@prisma/client');
const { scoreToPriority } = require('../utils/helpers');

const prisma = new PrismaClient();

const PRIORITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/**
 * Compute accuracy metrics from AIFeedback (officer corrections)
 */
const getAccuracyMetrics = async () => {
    const feedbacks = await prisma.aIFeedback.findMany({
        include: { complaint: { select: { priorityLevel: true } } },
    });

    if (feedbacks.length === 0) {
        return { mae: 0, overrideRate: 0, totalFeedbacks: 0, priorityAccuracy: 0, confusionMatrix: {} };
    }

    // MAE between original and corrected scores
    const totalError = feedbacks.reduce((sum, f) => sum + Math.abs(f.originalScore - f.correctedScore), 0);
    const mae = totalError / feedbacks.length;

    // Confusion matrix: predicted priority vs corrected priority
    const matrix = {};
    PRIORITY_LEVELS.forEach((p) => {
        matrix[p] = {};
        PRIORITY_LEVELS.forEach((c) => { matrix[p][c] = 0; });
    });

    let correctCount = 0;
    feedbacks.forEach((f) => {
        const predicted = scoreToPriority(f.originalScore);
        const corrected = f.correctedPriority || scoreToPriority(f.correctedScore);
        if (matrix[predicted] && matrix[predicted][corrected] !== undefined) {
            matrix[predicted][corrected]++;
        }
        if (predicted === corrected) correctCount++;
    });

    const priorityAccuracy = (correctCount / feedbacks.length) * 100;

    // Override rate: feedbacks vs total scored complaints
    const totalScored = await prisma.complaint.count({ where: { priorityScore: { not: null } } });
    const overrideRate = totalScored > 0 ? (feedbacks.length / totalScored) * 100 : 0;

    return {
        mae: parseFloat(mae.toFixed(2)),
        priorityAccuracy: parseFloat(priorityAccuracy.toFixed(1)),
        overrideRate: parseFloat(overrideRate.toFixed(1)),
        totalFeedbacks: feedbacks.length,
        totalScored,
        confusionMatrix: matrix,
    };
};

/**
 * Routing accuracy: compare suggestedDeptId vs actual department
 */
const getRoutingAccuracy = async () => {
    const complaints = await prisma.complaint.findMany({
        where: { suggestedDeptId: { not: null } },
        include: { category: { select: { departmentId: true } } },
    });

    if (complaints.length === 0) return { accuracy: 0, total: 0, correct: 0 };

    const correct = complaints.filter((c) => c.suggestedDeptId === c.category.departmentId).length;

    return {
        accuracy: parseFloat(((correct / complaints.length) * 100).toFixed(1)),
        total: complaints.length,
        correct,
    };
};

/**
 * Priority score distribution (histogram bins)
 */
const getScoringDistribution = async () => {
    const complaints = await prisma.complaint.findMany({
        where: { priorityScore: { not: null } },
        select: { priorityScore: true },
    });

    const bins = [
        { label: '0-20', min: 0, max: 20, count: 0 },
        { label: '20-40', min: 20, max: 40, count: 0 },
        { label: '40-60', min: 40, max: 60, count: 0 },
        { label: '60-80', min: 60, max: 80, count: 0 },
        { label: '80-100', min: 80, max: 100, count: 0 },
    ];

    complaints.forEach((c) => {
        const bin = bins.find((b) => c.priorityScore >= b.min && (c.priorityScore < b.max || (b.max === 100 && c.priorityScore <= 100)));
        if (bin) bin.count++;
    });

    return bins.map(({ label, count }) => ({ label, count }));
};

/**
 * Sentiment label distribution
 */
const getSentimentDistribution = async () => {
    const complaints = await prisma.complaint.findMany({
        where: { sentimentLabel: { not: null } },
        select: { sentimentLabel: true },
    });

    const dist = {};
    complaints.forEach((c) => {
        dist[c.sentimentLabel] = (dist[c.sentimentLabel] || 0) + 1;
    });

    return Object.entries(dist).map(([label, count]) => ({ label, count }));
};

/**
 * Extract average SHAP feature importance from aiExplanation JSON
 */
const getFeatureImportance = async () => {
    const complaints = await prisma.complaint.findMany({
        where: { aiExplanation: { not: null } },
        select: { aiExplanation: true },
        take: 200,
        orderBy: { createdAt: 'desc' },
    });

    const featureSums = {};
    const featureCounts = {};

    complaints.forEach((c) => {
        const explanation = c.aiExplanation;
        if (!explanation || typeof explanation !== 'object') return;

        // Handle both {feature: value} and {features: {feature: value}} formats
        const features = explanation.features || explanation.breakdown || explanation;
        if (typeof features !== 'object') return;

        Object.entries(features).forEach(([key, value]) => {
            if (typeof value === 'number') {
                featureSums[key] = (featureSums[key] || 0) + Math.abs(value);
                featureCounts[key] = (featureCounts[key] || 0) + 1;
            }
        });
    });

    return Object.entries(featureSums)
        .map(([feature, sum]) => ({
            feature,
            importance: parseFloat((sum / featureCounts[feature]).toFixed(3)),
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10);
};

/**
 * MAE trend over time (grouped by week)
 */
const getMetricsOverTime = async () => {
    const feedbacks = await prisma.aIFeedback.findMany({
        orderBy: { createdAt: 'asc' },
        select: { originalScore: true, correctedScore: true, createdAt: true },
    });

    if (feedbacks.length === 0) return [];

    const weeklyData = {};
    feedbacks.forEach((f) => {
        const date = new Date(f.createdAt);
        // Group by ISO week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const key = weekStart.toISOString().split('T')[0];

        if (!weeklyData[key]) weeklyData[key] = { errors: [], count: 0 };
        weeklyData[key].errors.push(Math.abs(f.originalScore - f.correctedScore));
        weeklyData[key].count++;
    });

    return Object.entries(weeklyData).map(([week, data]) => ({
        week,
        mae: parseFloat((data.errors.reduce((s, e) => s + e, 0) / data.errors.length).toFixed(2)),
        feedbackCount: data.count,
    }));
};

/**
 * Duplicate detection stats
 */
const getDuplicateStats = async () => {
    const [totalDuplicates, totalComplaints, mergedCount] = await Promise.all([
        prisma.complaint.count({ where: { isDuplicate: true } }),
        prisma.complaint.count(),
        prisma.complaint.count({ where: { status: 'MERGED' } }),
    ]);

    return {
        totalDuplicates,
        mergedCount,
        duplicateRate: totalComplaints > 0 ? parseFloat(((totalDuplicates / totalComplaints) * 100).toFixed(1)) : 0,
    };
};

/**
 * Aggregate all AI evaluation metrics
 */
const getAllMetrics = async () => {
    const [accuracy, routing, distribution, sentiment, features, timeline, duplicates] = await Promise.all([
        getAccuracyMetrics(),
        getRoutingAccuracy(),
        getScoringDistribution(),
        getSentimentDistribution(),
        getFeatureImportance(),
        getMetricsOverTime(),
        getDuplicateStats(),
    ]);

    return { accuracy, routing, distribution, sentiment, features, timeline, duplicates };
};

/**
 * Export metrics as CSV string
 */
const exportMetricsCSV = async () => {
    const metrics = await getAllMetrics();
    const lines = ['Metric,Value'];

    lines.push(`MAE,${metrics.accuracy.mae}`);
    lines.push(`Priority Accuracy (%),${metrics.accuracy.priorityAccuracy}`);
    lines.push(`Override Rate (%),${metrics.accuracy.overrideRate}`);
    lines.push(`Total Feedbacks,${metrics.accuracy.totalFeedbacks}`);
    lines.push(`Total Scored Complaints,${metrics.accuracy.totalScored}`);
    lines.push(`Routing Accuracy (%),${metrics.routing.accuracy}`);
    lines.push(`Routing Total,${metrics.routing.total}`);
    lines.push(`Duplicate Rate (%),${metrics.duplicates.duplicateRate}`);
    lines.push(`Total Duplicates,${metrics.duplicates.totalDuplicates}`);
    lines.push('');

    lines.push('Confusion Matrix');
    lines.push(',CRITICAL,HIGH,MEDIUM,LOW');
    PRIORITY_LEVELS.forEach((predicted) => {
        const row = PRIORITY_LEVELS.map((actual) => metrics.accuracy.confusionMatrix[predicted]?.[actual] || 0);
        lines.push(`${predicted},${row.join(',')}`);
    });
    lines.push('');

    lines.push('Score Distribution');
    lines.push('Bin,Count');
    metrics.distribution.forEach((b) => lines.push(`${b.label},${b.count}`));
    lines.push('');

    lines.push('Sentiment Distribution');
    lines.push('Label,Count');
    metrics.sentiment.forEach((s) => lines.push(`${s.label},${s.count}`));
    lines.push('');

    lines.push('Feature Importance');
    lines.push('Feature,Importance');
    metrics.features.forEach((f) => lines.push(`${f.feature},${f.importance}`));

    return lines.join('\n');
};

module.exports = {
    getAccuracyMetrics,
    getRoutingAccuracy,
    getScoringDistribution,
    getSentimentDistribution,
    getFeatureImportance,
    getMetricsOverTime,
    getDuplicateStats,
    getAllMetrics,
    exportMetricsCSV,
};
