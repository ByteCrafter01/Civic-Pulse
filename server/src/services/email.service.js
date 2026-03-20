const nodemailer = require('nodemailer');
const config = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Initialize the email transporter.
 * Uses configured SMTP if available, otherwise creates an Ethereal test account.
 */
const initTransporter = async () => {
    if (transporter) return transporter;

    if (config.smtp.host && config.smtp.user) {
        transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port || 587,
            secure: config.smtp.port === 465,
            auth: { user: config.smtp.user, pass: config.smtp.pass },
        });
        logger.info('Email transporter initialized with SMTP config');
    } else {
        // Fallback to Ethereal for demo/dev
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        logger.info('Email transporter initialized with Ethereal test account', {
            user: testAccount.user,
            webUrl: 'https://ethereal.email',
        });
    }

    return transporter;
};

/**
 * Send an email. Gracefully skips if transporter fails to initialize.
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        const t = await initTransporter();
        const info = await t.sendMail({
            from: config.smtp.from || '"CivicPulse" <noreply@civicpulse.app>',
            to,
            subject,
            html,
        });
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            logger.info('Email preview URL', { previewUrl });
        }
        logger.info('Email sent', { to, subject, messageId: info.messageId });
        return info;
    } catch (err) {
        logger.error('Email send failed', { to, subject, error: err.message });
        return null;
    }
};

// ── Email Templates ──────────────────────────────────────────────────────────

const STATUS_MESSAGES = {
    TRIAGED: 'Your complaint has been reviewed and prioritized by our AI system.',
    ASSIGNED: 'A municipal officer has been assigned to handle your complaint.',
    IN_PROGRESS: 'Work on your complaint has officially begun.',
    VERIFICATION: 'Your complaint has been addressed. Please verify the resolution.',
    RESOLVED: 'Your complaint has been marked as resolved.',
    CLOSED: 'Your complaint has been closed. Thank you for your feedback.',
    REOPENED: 'Your complaint has been reopened for further review.',
    ESCALATED: 'Your complaint has been escalated to a senior officer for urgent attention.',
    MERGED: 'Your complaint has been merged with a similar existing report.',
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#2563eb;padding:20px 24px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">CivicPulse</h1>
    </div>
    <div style="padding:24px;">
      ${content}
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">CivicPulse — Intelligent Municipal Complaint Management</p>
    </div>
  </div>
</body>
</html>`;

const sendStatusChangeEmail = async ({ to, citizenName, complaintTitle, complaintId, fromStatus, toStatus }) => {
    const message = STATUS_MESSAGES[toStatus] || `Your complaint status has changed to ${toStatus}.`;
    const html = baseTemplate(`
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">Status Update</h2>
        <p style="color:#64748b;margin:0 0 16px;">Hi ${citizenName},</p>
        <p style="color:#334155;margin:0 0 16px;">${message}</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:0 0 16px;">
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Complaint: <strong style="color:#1e293b;">${complaintTitle}</strong></p>
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Status: <span style="color:#94a3b8;">${fromStatus}</span> → <strong style="color:#2563eb;">${toStatus}</strong></p>
            <p style="margin:0;color:#64748b;font-size:12px;">ID: ${complaintId}</p>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0;">You can track your complaint on the CivicPulse dashboard or the public portal.</p>
    `);

    return sendEmail({ to, subject: `CivicPulse: Complaint ${toStatus}`, html });
};

const sendSLAWarningEmail = async ({ to, officerName, complaintTitle, complaintId, deadline }) => {
    const html = baseTemplate(`
        <h2 style="margin:0 0 8px;color:#dc2626;font-size:18px;">SLA Deadline Warning</h2>
        <p style="color:#64748b;margin:0 0 16px;">Hi ${officerName},</p>
        <p style="color:#334155;margin:0 0 16px;">A complaint assigned to you is approaching its SLA deadline.</p>
        <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:0 0 16px;border:1px solid #fecaca;">
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Complaint: <strong style="color:#1e293b;">${complaintTitle}</strong></p>
            <p style="margin:0 0 6px;color:#64748b;font-size:13px;">Deadline: <strong style="color:#dc2626;">${new Date(deadline).toLocaleString()}</strong></p>
            <p style="margin:0;color:#64748b;font-size:12px;">ID: ${complaintId}</p>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0;">Please take action to resolve this complaint before the deadline.</p>
    `);

    return sendEmail({ to, subject: `CivicPulse: SLA Warning — ${complaintTitle}`, html });
};

const sendWelcomeEmail = async ({ to, name }) => {
    const html = baseTemplate(`
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:18px;">Welcome to CivicPulse!</h2>
        <p style="color:#64748b;margin:0 0 16px;">Hi ${name},</p>
        <p style="color:#334155;margin:0 0 16px;">Your account has been created successfully. You can now submit complaints, track their progress in real-time, and receive AI-powered priority updates.</p>
        <p style="color:#64748b;font-size:13px;margin:0;">Thank you for helping improve your community.</p>
    `);

    return sendEmail({ to, subject: 'Welcome to CivicPulse', html });
};

const sendResolutionVerifyEmail = async ({ to, citizenName, complaintTitle, complaintId }) => {
    const html = baseTemplate(`
        <h2 style="margin:0 0 8px;color:#059669;font-size:18px;">Resolution Verification Required</h2>
        <p style="color:#64748b;margin:0 0 16px;">Hi ${citizenName},</p>
        <p style="color:#334155;margin:0 0 16px;">Your complaint "<strong>${complaintTitle}</strong>" has been resolved by the assigned officer. Please verify the resolution.</p>
        <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 16px;border:1px solid #bbf7d0;">
            <p style="margin:0;color:#64748b;font-size:13px;">If the issue has been satisfactorily resolved, you can close the complaint. Otherwise, you can reopen it for further attention.</p>
        </div>
        <p style="color:#64748b;font-size:12px;margin:0;">Complaint ID: ${complaintId}</p>
    `);

    return sendEmail({ to, subject: `CivicPulse: Please verify resolution — ${complaintTitle}`, html });
};

module.exports = {
    initTransporter,
    sendEmail,
    sendStatusChangeEmail,
    sendSLAWarningEmail,
    sendWelcomeEmail,
    sendResolutionVerifyEmail,
};
