import api from './api';

export const outgoingLogService = {
    listByEntity: async (entityId, { limit = 50, offset = 0 } = {}) => {
        const res = await api.get(`/outgoing-logs/entity/${entityId}?limit=${limit}&offset=${offset}`);
        return res.data;
    },
    create: async (payload) => {
        const res = await api.post('/outgoing-logs', payload);
        return res.data;
    }
};

