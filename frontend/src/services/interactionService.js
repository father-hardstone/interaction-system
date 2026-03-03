import api from './api';

export const interactionService = {
    getByEntity: async (entityId, filter = 'this_week') => {
        const response = await api.get(`/interactions/entity/${entityId}?filter=${filter}`);
        return response.data;
    },

    /** Get daily stats (counts only) for dashboard chart. Returns [{ date, registered, completed }, ...]. */
    getDailyStats: async (entityId, days = 7) => {
        const response = await api.get(`/interactions/entity/${entityId}/daily-stats?days=${days}`);
        return Array.isArray(response.data) ? response.data : [];
    },

    /** Get status counts for pie chart. Returns { total, cancelled, closed, billed, active }. */
    getStatusCounts: async (entityId, days = null) => {
        const url = days != null
            ? `/interactions/entity/${entityId}/status-counts?days=${days}`
            : `/interactions/entity/${entityId}/status-counts`;
        const response = await api.get(url);
        return response.data || {};
    },

    /** Get revenue for entity dashboard (sum of billed serviceLines in period). */
    getRevenue: async (entityId, days = 7) => {
        const response = await api.get(`/interactions/entity/${entityId}/revenue?days=${days}`);
        return response.data?.revenue ?? 0;
    },

    /** Get all interactions for a visitor (no time filter; for patient history). */
    getByVisitor: async (entityId, visitorId) => {
        const response = await api.get(`/interactions/entity/${entityId}/visitor/${visitorId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/interactions', data);
        return response.data;
    },
    // create accepts: entityId, entitySerial, visitorId, visitorSerial, reasonForVisit

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

    cancel: async (interactionId) => {
        const response = await api.put(`/interactions/${interactionId}/cancel`);
        return response.data;
    },

    saveDetails: async (interactionId, details) => {
        const response = await api.put(`/interactions/${interactionId}/details`, details);
        return response.data;
    }
};
