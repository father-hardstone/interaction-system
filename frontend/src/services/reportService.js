import api from './api';

export const reportService = {
    // Get all reports for a patient
    getByPatient: async (visitorId) => {
        const response = await api.get(`/reports/patient/${visitorId}`);
        return response.data;
    },

    // Get all reports for an entity
    getByEntity: async (entityId) => {
        const response = await api.get(`/reports/entity/${entityId}`);
        return response.data;
    },

    // Get unreviewed reports for an entity (report reviews tab)
    getForReview: async (entityId, resultFilter = 'all') => {
        const response = await api.get(`/reports/entity/${entityId}/review`, {
            params: { result: resultFilter }
        });
        return response.data;
    },

    // Update report (e.g. set reviewed: true, action)
    updateReport: async (id, updates) => {
        const response = await api.patch(`/reports/${id}`, updates);
        return response.data;
    },

    // Get all reports for an interaction
    getByInteraction: async (interactionId) => {
        const response = await api.get(`/reports/interaction/${interactionId}`);
        return response.data;
    },

    // Upload a report
    upload: async (data) => {
        const response = await api.post('/reports/upload', data);
        return response.data;
    },

    // Delete a report
    delete: async (id) => {
        const response = await api.delete(`/reports/${id}`);
        return response.data;
    }
};
