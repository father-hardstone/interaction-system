import api from './api';

export const receptionistService = {
    // Get all receptionists for an entity
    getByEntity: async (entityId) => {
        const response = await api.get(`/receptionists/entity/${entityId}`);
        return response.data;
    },

    // Create a new receptionist
    create: async (data) => {
        const response = await api.post('/receptionists', data);
        return response.data;
    },

    // Update a receptionist
    update: async (id, data) => {
        const response = await api.put(`/receptionists/${id}`, data);
        return response.data;
    },

    // Delete a receptionist
    delete: async (id) => {
        const response = await api.delete(`/receptionists/${id}`);
        return response.data;
    }
};

