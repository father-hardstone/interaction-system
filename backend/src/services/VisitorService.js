const Visitor = require('../models/Visitor');

class VisitorService {
    async getAll() {
        const visitors = await Visitor.find({ deletedAt: '' });
        return visitors.map(v => v.toObject());
    }


    async create(data) {
        const visitor = new Visitor(data);
        await visitor.save();
        return visitor.toObject();
    }

    async findOne(query) {
        // Support both function predicate (for backward compatibility) and object query
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const visitor = await Visitor.findOne({ ...query, deletedAt: '' });
        return visitor ? visitor.toObject() : null;
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const visitor = await Visitor.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return visitor ? visitor.toObject() : null;
    }

    /** Update only lastVisitAt (e.g. when an interaction is completed). Does not change editedAt. */
    async updateLastVisitAt(visitorId, lastVisitAt) {
        if (!visitorId || !lastVisitAt) return null;
        const visitor = await Visitor.findOneAndUpdate(
            { id: visitorId, deletedAt: '' },
            { lastVisitAt },
            { new: true }
        );
        return visitor ? visitor.toObject() : null;
    }

    async delete(id) {
        const visitor = await Visitor.findOneAndUpdate(
            { id },
            {
                deletedAt: new Date().toISOString()
            },
            { new: true }
        );
        return visitor ? visitor.toObject() : null;
    }

    /** Get count of patients for an entity (efficient - no document fetch). */
    async getCountByEntity(entityId) {
        return Visitor.countDocuments({ entityId, deletedAt: '' });
    }

    async getByEntity(entityId) {
        const visitors = await Visitor.find({ entityId, deletedAt: '' });
        return visitors.map(v => v.toObject());
    }

    // Get next serial for a specific entity (6-digit number)
    async getNextSerialForEntity(entityId) {
        const visitors = await Visitor.find({ entityId, deletedAt: '' });
        let max = 0;
        visitors.forEach(v => {
            const num = parseInt(v.serial, 10);
            if (!isNaN(num) && num > max) {
                max = num;
            }
        });
        return (max + 1).toString().padStart(6, '0');
    }
}

module.exports = new VisitorService();
