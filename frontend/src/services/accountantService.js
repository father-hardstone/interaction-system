import api from './api';

export const accountantService = {
    getByEntity: async (entityId) => {
        const response = await api.get(`/accountants/entity/${entityId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/accountants', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/accountants/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/accountants/${id}`);
        return response.data;
    }
};
