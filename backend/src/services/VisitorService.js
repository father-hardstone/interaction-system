const BaseService = require('./BaseService');

const VISITOR_HEADERS = [
    'id', 'serial', 'entityId', 'entitySerial', 'firstName', 'middleName', 'lastName',
    'dateOfBirth', 'addressLine', 'city', 'state', 'gender', 'phone', 'email', 'idCardNumber',
    'createdAt', 'editedAt', 'deletedAt'
];

class VisitorService extends BaseService {
    constructor() {
        super('visitors.csv', VISITOR_HEADERS);
    }

    // Get next serial for a specific entity (composite format: entitySerial-V1, entitySerial-V2, etc.)
    async getNextSerialForEntity(entitySerial) {
        const all = await this.getAll();
        let max = 0;
        all.forEach(item => {
            if (item.serial) {
                // Handle both composite (E1-V1) and simple (V1) formats
                let baseSerial = item.serial;
                // If it's composite format (contains dash), extract the base part
                if (item.serial.includes('-') && item.serial.startsWith(entitySerial + '-')) {
                    // Extract base serial after entitySerial- (e.g., "E1-V1" -> "V1")
                    baseSerial = item.serial.substring(entitySerial.length + 1);
                }
                // Check if it starts with 'V' and extract number
                if (baseSerial.startsWith('V')) {
                    const numPart = parseInt(baseSerial.replace('V', ''));
                    if (!isNaN(numPart) && numPart > max) {
                        max = numPart;
                    }
                }
            }
        });
        return `${entitySerial}-V${max + 1}`;
    }
}

module.exports = new VisitorService();
