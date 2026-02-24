import api from './api';

/**
 * services/userService.js
 * API calls for profile management and admin user operations.
 */

// ── Own profile ───────────────────────────────────────────────────────────────
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const changePassword = (data) => api.put('/users/profile/password', data);
export const deleteProfile = () => api.delete('/users/profile');

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAllUsers = (params) => api.get('/users/admin/users', { params });
export const getUserById = (id) => api.get(`/users/admin/users/${id}`);
export const updateUserStatus = (id, isActive) => api.patch(`/users/admin/users/${id}/status`, { isActive });
export const updateUserRole = (id, role) => api.patch(`/users/admin/users/${id}/role`, { role });
export const permanentDelete = (id) => api.delete(`/users/admin/users/${id}`);
