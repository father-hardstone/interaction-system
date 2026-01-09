const BaseService = require('./BaseService');

const INTERACTION_HEADERS = [
    'id', // UUID
    'interactionSerial', // Composite: E1-V1-I1
    'entityId',
    'entitySerial',
    'visitorId',
    'visitorSerial',
    'officerId', // assigned officer's id
    'officerSerial', // assigned officer's serial
    'createdAt',
    'editedAt',
    'deletedAt'
];

class InteractionService extends BaseService {
    constructor() {
        super('interactions.csv', INTERACTION_HEADERS);
    }

    // Get next serial for a specific entity (composite format: E1-V1-I1, E1-V1-I2, etc.)
    async getNextSerialForEntity(entitySerial, visitorSerial) {
        const all = await this.getAll();
        let max = 0;
        const prefix = `${entitySerial}-${visitorSerial}-I`;
        
        all.forEach(item => {
            if (item.interactionSerial && item.interactionSerial.startsWith(prefix)) {
                // Extract number from composite serial (e.g., "E1-V1-I1" -> 1)
                const numPart = parseInt(item.interactionSerial.replace(prefix, ''));
                if (!isNaN(numPart) && numPart > max) {
                    max = numPart;
                }
            }
        });
        return `${prefix}${max + 1}`;
    }
}

module.exports = new InteractionService();