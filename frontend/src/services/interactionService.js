import api from './api';

export const interactionService = {
    getByEntity: async (entityId) => {
        const response = await api.get(`/interactions/entity/${entityId}`);
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
    }
};
