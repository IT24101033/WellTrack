import api from './api';

/**
 * services/activityService.js
 * API helpers for the Schedule & Activity Management module.
 */

// ── Activities ────────────────────────────────────────────────────────────────

/** Fetch activities list with optional filters { date, category, status, weekStart } */
export const fetchActivities = (params = {}) =>
    api.get('/activities', { params });

/** Fetch a single activity by ID */
export const fetchActivity = (id) =>
    api.get(`/activities/${id}`);

/** Create a new activity */
export const createActivity = (data) =>
    api.post('/activities', data);

/** Update an activity (full update) */
export const updateActivity = (id, data) =>
    api.put(`/activities/${id}`, data);

/** Patch only the status (Pending / Completed) */
export const patchActivityStatus = (id, status) =>
    api.patch(`/activities/${id}/status`, { status });

/** Delete an activity */
export const deleteActivity = (id) =>
    api.delete(`/activities/${id}`);

// ── Reminders ─────────────────────────────────────────────────────────────────

/** Fetch pending/upcoming reminders for the current user */
export const fetchReminders = () =>
    api.get('/reminders');

/** Acknowledge (mark sent) a reminder so it won't re-appear */
export const acknowledgeReminder = (id) =>
    api.patch(`/reminders/${id}/acknowledge`);

/** Delete a reminder */
export const cancelReminder = (id) =>
    api.delete(`/reminders/${id}`);
