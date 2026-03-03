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

    /** Get status counts for entity dashboard pie chart (efficient - no document fetch).
     * @param {string} entityId
     * @param {number} [days] - If provided, only count interactions created in the last N days.
     */
    async getStatusCountsByEntity(entityId, days = null) {
        const base = { entityId, deletedAt: '' };
        if (days != null && days > 0) {
            const now = new Date();
            const start = new Date(now);
            start.setDate(start.getDate() - (days - 1));
            start.setUTCHours(0, 0, 0, 0);
            const startStr = start.toISOString().slice(0, 10);
            base.createdAt = { $gte: startStr, $lte: now.toISOString() };
        }
        const notBilled = { billed: { $nin: [true, 'true'] } };
        const closedQuery = {
            ...base,
            ...notBilled,
            $or: [
                { closed: true },
                { closed: 'true' },
                { interactionStatus: 'closed' },
            ],
        };
        const [total, cancelled, billed, closedNotBilled] = await Promise.all([
            Interaction.countDocuments(base),
            Interaction.countDocuments({ ...base, cancelled: { $in: [true, 'true'] } }),
            Interaction.countDocuments({ ...base, billed: { $in: [true, 'true'] } }),
            Interaction.countDocuments(closedQuery),
        ]);
        const active = Math.max(0, total - cancelled - billed - closedNotBilled);
        return { total, cancelled, billed, closed: closedNotBilled, active };
    }

    /** Get revenue (sum of serviceLines.totalFee) for billed interactions in the last N days.
     * @param {string} entityId
     * @param {number} days - e.g. 7 for last 7 days including today
     */
    async getRevenueByEntity(entityId, days = 7) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - (days - 1));
        start.setUTCHours(0, 0, 0, 0);
        const startStr = start.toISOString().slice(0, 10);
        const docs = await Interaction.find({
            entityId,
            deletedAt: '',
            billed: true,
            billedAt: { $exists: true, $ne: '', $gte: startStr, $lte: now.toISOString() },
        })
            .select('serviceLines')
            .lean();
        let total = 0;
        for (const doc of docs) {
            if (Array.isArray(doc.serviceLines)) {
                for (const line of doc.serviceLines) {
                    total += parseFloat(line.totalFee) || 0;
                }
            }
        }
        return Math.round(total * 100) / 100;
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

    /**
     * Get daily counts of registered and completed interactions for the last N days.
     * Returns only aggregated numbers (no full documents).
     * @param {string} entityId
     * @param {number} days - e.g. 7 for last 7 days including today
     * @returns {Promise<Array<{ date: string, registered: number, completed: number }>>}
     */
    async getDailyStats(entityId, days = 7) {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - (days - 1));
        start.setUTCHours(0, 0, 0, 0);
        const startStr = start.toISOString().slice(0, 10); // YYYY-MM-DD

        const matchBase = { entityId, deletedAt: '' };

        // Registered: count by createdAt date (only documents created in range)
        const registeredAgg = await Interaction.aggregate([
            { $match: { ...matchBase, createdAt: { $gte: startStr, $lte: now.toISOString() } } },
            { $project: { date: { $substr: ['$createdAt', 0, 10] } } },
            { $group: { _id: '$date', count: { $sum: 1 } } },
        ]);
        const registeredByDate = {};
        registeredAgg.forEach((r) => { registeredByDate[r._id] = r.count; });

        // Completed: count by completedAt date (only completed in range)
        const completedAgg = await Interaction.aggregate([
            { $match: { ...matchBase, completed: true, completedAt: { $exists: true, $ne: '' } } },
            { $match: { completedAt: { $gte: startStr, $lte: now.toISOString() } } },
            { $project: { date: { $substr: ['$completedAt', 0, 10] } } },
            { $group: { _id: '$date', count: { $sum: 1 } } },
        ]);
        const completedByDate = {};
        completedAgg.forEach((r) => { completedByDate[r._id] = r.count; });

        // Build ordered list of dates (last N days)
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            result.push({
                date: dateStr,
                registered: registeredByDate[dateStr] || 0,
                completed: completedByDate[dateStr] || 0,
            });
        }
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
