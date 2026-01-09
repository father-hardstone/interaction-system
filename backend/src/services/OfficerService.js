const BaseService = require('./BaseService');

const OFFICER_HEADERS = [
    'id', 'serial', 'entityId', 'entitySerial', 'name', 'phone', 'email', 'password', 
    'active', 'approved', 'createdAt', 'editedAt', 'deletedAt'
];

class OfficerService extends BaseService {
    constructor() {
        super('officers.csv', OFFICER_HEADERS);
    }
}

module.exports = new OfficerService();

