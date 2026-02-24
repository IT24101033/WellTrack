import api from './api';

/**
 * services/authService.js
 * API calls for authentication (register + login).
 */

export const register = (data) => api.post('/users/register', data);

export const login = (data) => api.post('/users/login', data);
