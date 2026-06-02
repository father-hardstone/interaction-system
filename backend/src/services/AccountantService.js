const Accountant = require('../models/Accountant');

class AccountantService {
    async getAll() {
        const accountants = await Accountant.find({ deletedAt: '' });
        return accountants.map((a) => a.toObject());
    }

    async create(data) {
        const accountant = new Accountant(data);
        await accountant.save();
        return accountant.toObject();
    }

    async findOne(query) {
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const accountant = await Accountant.findOne({ ...query, deletedAt: '' });
        return accountant ? accountant.toObject() : null;
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const accountant = await Accountant.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return accountant ? accountant.toObject() : null;
    }

    async delete(id) {
        const accountant = await Accountant.findOneAndUpdate(
            { id },
            {
                deletedAt: new Date().toISOString(),
                active: 'false'
            },
            { new: true }
        );
        return accountant ? accountant.toObject() : null;
    }

    async getByEntity(entityId) {
        const accountants = await Accountant.find({ entityId, deletedAt: '' });
        return accountants.map((a) => a.toObject());
    }

    async getNextSerial(prefix) {
        const all = await this.getAll();
        let max = 0;
        all.forEach((item) => {
            if (item.serial && item.serial.startsWith(prefix)) {
                const numPart = parseInt(item.serial.replace(prefix, ''), 10);
                if (!isNaN(numPart) && numPart > max) {
                    max = numPart;
                }
            }
        });
        return `${prefix}${max + 1}`;
    }
}

module.exports = new AccountantService();
