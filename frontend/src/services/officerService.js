import api from './api';

export const officerService = {
    // Get all officers for an entity
    getByEntity: async (entityId) => {
        const response = await api.get(`/officers/entity/${entityId}`);
        return response.data;
    },

    // Create a new officer
    create: async (data) => {
        const response = await api.post('/officers', data);
        return response.data;
    },

    // Update an officer
    update: async (id, data) => {
        const response = await api.put(`/officers/${id}`, data);
        return response.data;
    },

    // Delete an officer
    delete: async (id) => {
        const response = await api.delete(`/officers/${id}`);
        return response.data;
    },

    // Internal login for officers
    login: async (credentials) => {
        const response = await api.post('/officers/login', credentials);
        return response.data;
    }
};

