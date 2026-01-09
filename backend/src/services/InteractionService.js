const Interaction = require('../models/Interaction');

class InteractionService {
    async getAll() {
        const interactions = await Interaction.find({ deletedAt: '' });
        return interactions.map(i => i.toObject());
    }

    async create(data) {
        const interaction = new Interaction(data);
        await interaction.save();
        return interaction.toObject();
    }

    async findOne(query) {
        // Support both function predicate (for backward compatibility) and object query
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const interaction = await Interaction.findOne({ ...query, deletedAt: '' });
        return interaction ? interaction.toObject() : null;
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const interaction = await Interaction.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return interaction ? interaction.toObject() : null;
    }

    async delete(id) {
        const interaction = await Interaction.findOneAndUpdate(
            { id },
            { 
                deletedAt: new Date().toISOString()
            },
            { new: true }
        );
        return interaction ? interaction.toObject() : null;
    }

    async getByEntity(entityId) {
        const interactions = await Interaction.find({ entityId, deletedAt: '' });
        return interactions.map(i => i.toObject());
    }

    async assignOfficer(interactionId, officerId, officerSerial) {
        const interaction = await Interaction.findOneAndUpdate(
            { id: interactionId, deletedAt: '' },
            {
                officerId: officerId || '',
                officerSerial: officerSerial || '',
                editedAt: new Date().toISOString()
            },
            { new: true }
        );
        return interaction ? interaction.toObject() : null;
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
