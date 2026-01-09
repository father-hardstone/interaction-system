import api from './api';

export const entityService = {
    // Auth
    login: async (credentials) => {
        // credentials can contain either email or phone (or both)
        const response = await api.post('/entities/login', credentials);
        return response.data;
    },

    verifyOtp: async (data) => {
        // data can contain either email or phone (or both)
        const response = await api.post('/entities/verify-otp', data);
        return response.data;
    },

    // CRUD (Admin side usually)
    getAll: async () => {
        const response = await api.get('/entities');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/entities', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/entities/${id}`, data);
        return response.data;
    },

    approve: async (id) => {
        const response = await api.put(`/entities/${id}/approve`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/entities/${id}`);
        return response.data;
    }
};
