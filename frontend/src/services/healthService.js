import api from './api';

/**
 * services/healthService.js
 * API helpers for student health data.
 * All calls go through the shared Axios instance (JWT auto-attached).
 */

/**
 * Create a new health entry for today (or a specific date).
 * @param {object} payload - { date?, physiological, lifestyle, activity, psychological }
 */
export const createHealthEntry = (payload) =>
    api.post('/health', payload);

/**
 * Fetch health entries for the current user.
 * @param {object} params - { limit?, from?, to? }
 */
export const fetchHealthEntries = (params = {}) =>
    api.get('/health', { params });

/**
 * Fetch a single health entry by ID.
 */
export const fetchHealthEntry = (id) =>
    api.get(`/health/${id}`);

/**
 * Update an existing health entry.
 * @param {string} id
 * @param {object} payload - partial or full update body
 */
export const updateHealthEntry = (id, payload) =>
    api.put(`/health/${id}`, payload);

/**
 * Delete a health entry.
 */
export const deleteHealthEntry = (id) =>
    api.delete(`/health/${id}`);

/**
 * Get AI-ready aggregated input for the last 30 days.
 */
export const fetchAIInput = () =>
    api.get('/health/ai-input');
