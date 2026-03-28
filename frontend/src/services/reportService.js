import api from './api';

export const getUserReports = (userId, page = 1, limit = 20) =>
    api.get(`/reports/user/${userId}?page=${page}&limit=${limit}`);

export const getUserDashboard = (userId) =>
    api.get(`/dashboard/${userId}`);

export const createReport = (data) =>
    api.post('/reports', data);

export const getAnalyticsSummary = () =>
    api.get('/reports/analytics-summary');

export const getAllReports = (page = 1, limit = 20, search = '') =>
    api.get(`/reports/all?page=${page}&limit=${limit}&search=${search}`);

export const deleteReport = (id) =>
    api.delete(`/reports/${id}`);
