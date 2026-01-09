const BaseService = require('./BaseService');

const RECEPTIONIST_HEADERS = [
    'id', 'serial', 'entityId', 'entitySerial', 'name', 'phone', 'email', 'password',
    'active', 'approved', 'createdAt', 'editedAt', 'deletedAt'
];

class ReceptionistService extends BaseService {
    constructor() {
        super('receptionists.csv', RECEPTIONIST_HEADERS);
    }
}

module.exports = new ReceptionistService();

