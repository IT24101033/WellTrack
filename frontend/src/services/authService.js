import api from './api';

/**
 * services/authService.js
 * API calls for authentication (register + login + password reset).
 */

export const register = (data) => api.post('/users/register', data);

export const sendAdminPin = (data) => api.post('/users/send-pin', data);

export const login = (data) => api.post('/users/login', data);

export const forgotPassword = (data) => api.post('/users/forgot-password', data);

export const resetPassword = (token, data) => api.post(`/users/reset-password/${token}`, data);
