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

    async getByEntity(entityId) {
        const visitors = await Visitor.find({ entityId, deletedAt: '' });
        return visitors.map(v => v.toObject());
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
