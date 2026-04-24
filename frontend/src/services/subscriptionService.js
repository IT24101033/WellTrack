import api from './api';

/**
 * services/subscriptionService.js
 * API calls for subscription management and admin verification.
 */

// ── User Endpoints ─────────────────────────────────────────────────────────────

export const getSubscription = () => api.get('/subscription');

export const updateSubscription = (formData) => api.put('/subscription', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

export const cancelSubscription = () => api.delete('/subscription');

export const createPaymentIntent = (planName) => api.post('/subscription/create-payment-intent', { planName });

// ── Admin Endpoints ────────────────────────────────────────────────────────────

export const getPendingSubscriptions = () => api.get('/admin/subscriptions/pending');

export const verifySubscription = (id, action) => api.patch(`/admin/subscriptions/${id}/verify`, { action });

export default {
    getSubscription,
    updateSubscription,
    cancelSubscription,
    createPaymentIntent,
    getPendingSubscriptions,
    verifySubscription
};
