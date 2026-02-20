/**
 * Workflow FSM — validates status transitions and role permissions
 */

const TRANSITION_MAP = {
    SUBMITTED: ['TRIAGED'],
    TRIAGED: ['ASSIGNED', 'MERGED'],
    ASSIGNED: ['IN_PROGRESS', 'ESCALATED'],
    IN_PROGRESS: ['VERIFICATION', 'ESCALATED'],
    VERIFICATION: ['RESOLVED', 'REOPENED'],
    RESOLVED: ['CLOSED', 'REOPENED'],
    REOPENED: ['IN_PROGRESS'],
    ESCALATED: ['ASSIGNED'],
    MERGED: [],
    CLOSED: [],
};

const ROLE_PERMISSIONS = {
    CITIZEN: ['REOPENED'],
    OFFICER: ['IN_PROGRESS', 'VERIFICATION', 'RESOLVED'],
    ADMIN: ['TRIAGED', 'ASSIGNED', 'MERGED', 'ESCALATED', 'CLOSED', 'IN_PROGRESS', 'VERIFICATION', 'RESOLVED'],
    SYSTEM: ['TRIAGED', 'ESCALATED', 'CLOSED'],
};

/**
 * Check if a status transition is valid for a given role
 */
const validateTransition = (fromStatus, toStatus, role) => {
    const allowedNext = TRANSITION_MAP[fromStatus] || [];
    const allowedRoles = ROLE_PERMISSIONS[role] || [];

    if (!allowedNext.includes(toStatus)) {
        return {
            valid: false,
            reason: `Cannot transition from ${fromStatus} to ${toStatus}`,
        };
    }
    if (!allowedRoles.includes(toStatus)) {
        return {
            valid: false,
            reason: `Role ${role} cannot set status to ${toStatus}`,
        };
    }
    return { valid: true };
};

/**
 * Get allowable next statuses for a given current status and role
 */
const getAllowedTransitions = (currentStatus, role) => {
    const allowedNext = TRANSITION_MAP[currentStatus] || [];
    const allowedRoles = ROLE_PERMISSIONS[role] || [];
    return allowedNext.filter((s) => allowedRoles.includes(s));
};

module.exports = { validateTransition, getAllowedTransitions, TRANSITION_MAP, ROLE_PERMISSIONS };
