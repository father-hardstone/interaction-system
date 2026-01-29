import api from './api';

export const interactionService = {
    getByEntity: async (entityId, filter = 'this_week') => {
        const response = await api.get(`/interactions/entity/${entityId}?filter=${filter}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/interactions', data);
        return response.data;
    },

    assignOfficer: async (interactionId, officerId, officerSerial) => {
        const response = await api.put(`/interactions/${interactionId}/assign-officer`, {
            officerId,
            officerSerial
        });
        return response.data;
    },

    delete: async (interactionId) => {
        const response = await api.delete(`/interactions/${interactionId}`);
        return response.data;
    },

    saveDetails: async (interactionId, details) => {
        const response = await api.put(`/interactions/${interactionId}/details`, details);
        return response.data;
    }
};
