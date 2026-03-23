import api from './api';

/**
 * services/authService.js
 * API calls for authentication (register + login).
 */

export const register = (data) => api.post('/users/register', data);

export const sendAdminPin = (data) => api.post('/users/send-pin', data);

export const login = (data) => api.post('/users/login', data);
