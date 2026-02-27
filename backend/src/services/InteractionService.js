const Interaction = require('../models/Interaction');

/** Derive interactionStatus from flags. One of: registered | queued | ongoing | incomplete | complete | closed | billed | cancelled. */
function computeInteractionStatus(interaction) {
    if (!interaction) return 'registered';
    if (interaction.cancelled) return 'cancelled';
    if (interaction.billed) return 'billed';
    if (interaction.closed) return 'closed';
    if (interaction.completed) return 'complete';
    if (interaction.started) {
        if (interaction.incomplete) return 'incomplete';
        if (interaction.ongoing) return 'ongoing';
        return 'ongoing';
    }
    const hasOfficer = interaction.officerId && String(interaction.officerId).trim() !== '';
    if (hasOfficer) return 'queued';
    return 'registered';
}

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

    async findMany(query) {
        const interactions = await Interaction.find({ ...query, deletedAt: '' });
        return interactions.map(i => i.toObject());
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

    async cancel(id) {
        const now = new Date().toISOString();
        const interaction = await Interaction.findOneAndUpdate(
            { id, deletedAt: '' },
            { cancelled: true, cancelledAt: now, editedAt: now, interactionStatus: 'cancelled' },
            { new: true }
        );
        return interaction ? interaction.toObject() : null;
    }

    /** Derive interactionStatus from flags. Exposed on the exported instance so controller can call it. */
    computeInteractionStatus(interaction) {
        return computeInteractionStatus(interaction);
    }

    async getByEntity(entityId) {
        const interactions = await Interaction.find({ entityId, deletedAt: '' });
        return interactions.map(i => i.toObject());
    }

    /**
     * Get next accountingNumber (integer as string) for an entity.
     * Uses top-level accountingNumber when present; else first service line's accountingNumber.
     */
    async getNextAccountingNumber(entityId) {
        const docs = await Interaction.find({ entityId, deletedAt: '' })
            .select('accountingNumber serviceLines')
            .lean();
        let max = 0;
        for (const doc of docs) {
            let val = doc.accountingNumber;
            if (!val && Array.isArray(doc.serviceLines) && doc.serviceLines.length > 0) {
                val = doc.serviceLines[0].accountingNumber;
            }
            const n = parseInt(val, 10);
            if (!isNaN(n) && n > max) max = n;
        }
        return String(max + 1);
    }

    /**
     * Get the last completed interaction per visitor for the given entity.
     * Used for "last visit" display regardless of time filter. Does not apply any date filter.
     * @param {string} entityId
     * @param {string[]} [visitorIds] - If provided, only return last visit for these visitors; otherwise all visitors with completed interactions.
     * @returns {Promise<Object>} Map of visitorId -> last completed interaction (plain object).
     */
    async getLastCompletedByVisitor(entityId, visitorIds = null) {
        const match = {
            entityId,
            deletedAt: '',
            completed: true
        };
        if (Array.isArray(visitorIds) && visitorIds.length > 0) {
            match.visitorId = { $in: visitorIds };
        }
        const pipeline = [
            { $match: match },
            { $sort: { completedAt: -1, editedAt: -1 } },
            { $group: { _id: '$visitorId', doc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$doc' } }
        ];
        const docs = await Interaction.aggregate(pipeline);
        const result = {};
        docs.forEach(doc => {
            result[doc.visitorId] = doc;
        });
        return result;
    }

    // Get next serial for a specific entity (composite format: E1-V1-I1, E1-V1-I2, etc.)
    async getNextSerialForEntity(entitySerial, visitorSerial) {
        try {
            console.log('getNextSerialForEntity - Input:', { entitySerial, visitorSerial });

            // visitorSerial should be just the serial number (e.g., "1"), not composite
            // If it's composite (e.g., "E1-1"), extract just the serial part
            let serialNumber = visitorSerial;
            if (visitorSerial && visitorSerial.includes('-')) {
                // Extract the last part after the last dash
                const parts = visitorSerial.split('-');
                serialNumber = parts[parts.length - 1];
            }

            const all = await this.getAll();
            let max = 0;
            const prefix = `${entitySerial}-${serialNumber}-I`;
            console.log('getNextSerialForEntity - Prefix:', prefix);

            all.forEach(item => {
                if (item.interactionSerial && item.interactionSerial.startsWith(prefix)) {
                    // Extract number from composite serial (e.g., "E1-V1-I1" -> 1)
                    const numPart = parseInt(item.interactionSerial.replace(prefix, ''));
                    if (!isNaN(numPart) && numPart > max) {
                        max = numPart;
                    }
                }
            });

            const result = `${prefix}${max + 1}`;
            console.log('getNextSerialForEntity - Result:', result);
            return result;
        } catch (error) {
            console.error('getNextSerialForEntity error:', error);
            throw error;
        }
    }
}

module.exports = new InteractionService();
