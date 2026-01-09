const BaseService = require('./BaseService');

const ENTITY_HEADERS = [
    'id', 'serial', 'name', 'email', 'phone', 'password', 'otp',
    'active', 'approved', 'createdAt', 'editedAt', 'deletedAt'
];

class EntityService extends BaseService {
    constructor() {
        super('entities.csv', ENTITY_HEADERS);
    }
}

module.exports = new EntityService();
