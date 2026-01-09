const Receptionist = require('../models/Receptionist');

class ReceptionistService {
    async getAll() {
        const receptionists = await Receptionist.find({ deletedAt: '' });
        return receptionists.map(r => r.toObject());
    }

    async create(data) {
        const receptionist = new Receptionist(data);
        await receptionist.save();
        return receptionist.toObject();
    }

    async findOne(query) {
        // Support both function predicate (for backward compatibility) and object query
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const receptionist = await Receptionist.findOne({ ...query, deletedAt: '' });
        return receptionist ? receptionist.toObject() : null;
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const receptionist = await Receptionist.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return receptionist ? receptionist.toObject() : null;
    }

    async delete(id) {
        const receptionist = await Receptionist.findOneAndUpdate(
            { id },
            { 
                deletedAt: new Date().toISOString(),
                active: 'false'
            },
            { new: true }
        );
        return receptionist ? receptionist.toObject() : null;
    }

    async getByEntity(entityId) {
        const receptionists = await Receptionist.find({ entityId, deletedAt: '' });
        return receptionists.map(r => r.toObject());
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

module.exports = new ReceptionistService();
