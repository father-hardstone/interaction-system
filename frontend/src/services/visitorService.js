import api from './api';

export const visitorService = {
    getByEntity: async (entityId) => {
        const response = await api.get(`/visitors/entity/${entityId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/visitors', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/visitors/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/visitors/${id}`);
        return response.data;
    }
};
