import api from './api';

export const getUserReports = (userId, page = 1, limit = 20) =>
    api.get(`/reports/user/${userId}?page=${page}&limit=${limit}`);

export const getUserDashboard = (userId) =>
    api.get(`/dashboard/${userId}`);

export const createReport = (data) =>
    api.post('/reports', data);
