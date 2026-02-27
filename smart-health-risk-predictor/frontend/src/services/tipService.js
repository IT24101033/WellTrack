import api from './api';

const API_URL = '/tips';

const tipService = {
    // Admin only
    createTip: async (tipData) => {
        const response = await api.post(API_URL, tipData);
        return response.data;
    },

    updateTip: async (id, tipData) => {
        const response = await api.put(`${API_URL}/${id}`, tipData);
        return response.data;
    },

    deleteTip: async (id) => {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    },

    // Public/Student
    getAllTips: async () => {
        const response = await api.get(API_URL);
        return response.data;
    },

    getTipById: async (id) => {
        const response = await api.get(`${API_URL}/${id}`);
        return response.data;
    },

    getTipsByCategory: async (category) => {
        const response = await api.get(`${API_URL}/category/${category}`);
        return response.data;
    },

    getPersonalizedTips: async (studentId) => {
        const response = await api.get(`${API_URL}/student/${studentId}`);
        return response.data;
    }
};

export default tipService;
