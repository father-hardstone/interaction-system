const Officer = require('../models/Officer');

class OfficerService {
    async getAll() {
        const officers = await Officer.find({ deletedAt: '' });
        return officers.map(o => o.toObject());
    }

    async create(data) {
        const officer = new Officer(data);
        await officer.save();
        return officer.toObject();
    }

    async findOne(query) {
        // Support both function predicate (for backward compatibility) and object query
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const officer = await Officer.findOne({ ...query, deletedAt: '' });
        return officer ? officer.toObject() : null;
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const officer = await Officer.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return officer ? officer.toObject() : null;
    }

    async delete(id) {
        const officer = await Officer.findOneAndUpdate(
            { id },
            { 
                deletedAt: new Date().toISOString(),
                active: 'false'
            },
            { new: true }
        );
        return officer ? officer.toObject() : null;
    }

    async getByEntity(entityId) {
        const officers = await Officer.find({ entityId, deletedAt: '' });
        return officers.map(o => o.toObject());
    }

    async getNextSerial(prefix) {
        const all = await this.getAll();
        let max = 0;
        all.forEach(item => {
            if (item.serial && item.serial.startsWith(prefix)) {
                const numPart = parseInt(item.serial.replace(prefix, ''));
                if (!isNaN(numPart) && numPart > max) {
                    max = numPart;
                }
            }
        });
        return `${prefix}${max + 1}`;
    }
}

module.exports = new OfficerService();
