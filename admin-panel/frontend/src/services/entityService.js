import api from './api';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key';
const encryptPassword = (password) => {
    if (!password) return password;
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

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
        const payload = { ...data };
        if (payload.password) {
            payload.password = encryptPassword(payload.password);
        }
        const response = await api.post('/entities', payload);
        return response.data;
    },

    update: async (id, data) => {
        const payload = { ...data };
        if (payload.password) {
            payload.password = encryptPassword(payload.password);
        }
        const response = await api.put(`/entities/${id}`, payload);
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
