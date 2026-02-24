import axios from 'axios';

/**
 * services/api.js
 * Axios instance pre-configured with base URL and JWT interceptor.
 * All service files import from here.
 */

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('healthPredict_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors globally ─────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — force logout
            localStorage.removeItem('healthPredict_token');
            localStorage.removeItem('healthPredict_user');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
