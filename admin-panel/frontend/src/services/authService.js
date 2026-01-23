import api from './api';
import CryptoJS from 'crypto-js';

// Use environment variable or fallback to a default key (must match backend)
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key';

const encryptPassword = (password) => {
    if (!password) return password;
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

export const authService = {
    register: async (userData) => {
        const payload = { ...userData };
        if (payload.password) {
            payload.password = encryptPassword(payload.password);
        }
        const response = await api.post('/auth/register', payload);
        return response.data;
    },

    login: async (credentials) => {
        const payload = { ...credentials };
        if (payload.password) {
            payload.password = encryptPassword(payload.password);
        }
        const response = await api.post('/auth/login', payload);
        return response.data;
    },

    verifyOtp: async (data) => {
        const response = await api.post('/auth/verify-otp', data);
        return response.data;
    }
};
