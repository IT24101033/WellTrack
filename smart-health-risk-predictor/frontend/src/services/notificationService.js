import api from './api';

/**
 * services/notificationService.js
 * API helpers for the Notifications module.
 * All calls go through the shared Axios instance (JWT auto-attached).
 */

/** Fetch notifications with optional ?status= or ?type= filters */
export const fetchNotifications = (params = {}) =>
    api.get('/notifications', { params });

/** Mark a single notification as read */
export const markNotificationRead = (id) =>
    api.put(`/notifications/${id}`);

/** Mark ALL notifications as read */
export const markAllNotificationsRead = () =>
    api.put('/notifications/read-all');

/** Delete a single notification */
export const deleteNotification = (id) =>
    api.delete(`/notifications/${id}`);

/** Clear all notifications for the current user */
export const clearAllNotifications = () =>
    api.delete('/notifications/all');
