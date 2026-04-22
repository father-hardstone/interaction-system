import api from './api';

export const instituteService = {
    getByEntity: async (entityId) => {
        const res = await api.get(`/institutes/entity/${entityId}`);
        return Array.isArray(res.data) ? res.data : [];
    },
    create: async (payload) => {
        const res = await api.post('/institutes', payload);
        return res.data;
    },
    update: async (id, payload) => {
        const res = await api.patch(`/institutes/${id}`, payload);
        return res.data;
    },
    delete: async (id) => {
        const res = await api.delete(`/institutes/${id}`);
        return res.data;
    }
};

