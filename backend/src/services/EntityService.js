const Entity = require('../models/Entity');

class EntityService {
    async getAll() {
        const entities = await Entity.find({ deletedAt: '' });
        return entities.map(e => e.toObject());
    }

    async create(data) {
        const entity = new Entity(data);
        await entity.save();
        return entity.toObject();
    }

    async findOne(query) {
        // Support both function predicate (for backward compatibility) and object query
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const entity = await Entity.findOne({ ...query, deletedAt: '' });
        return entity ? entity.toObject() : null;
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const entity = await Entity.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return entity ? entity.toObject() : null;
    }

    async delete(id) {
        const entity = await Entity.findOneAndUpdate(
            { id },
            { 
                deletedAt: new Date().toISOString(),
                active: 'false'
            },
            { new: true }
        );
        return entity ? entity.toObject() : null;
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

    async getByEntity(entityId) {
        const entities = await Entity.find({ entityId, deletedAt: '' });
        return entities.map(e => e.toObject());
    }
}

module.exports = new EntityService();
