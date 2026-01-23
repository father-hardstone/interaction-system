const Report = require('../models/Report');

class ReportService {
    async getAll() {
        const reports = await Report.find({ deletedAt: '' });
        return reports.map(r => r.toObject());
    }

    async create(data) {
        const report = new Report(data);
        await report.save();
        return report.toObject();
    }

    async findOne(query) {
        if (typeof query === 'function') {
            const all = await this.getAll();
            return all.find(query);
        }
        const report = await Report.findOne({ ...query, deletedAt: '' });
        return report ? report.toObject() : null;
    }

    async update(id, updates) {
        const report = await Report.findOneAndUpdate(
            { id, deletedAt: '' },
            updates,
            { new: true }
        );
        return report ? report.toObject() : null;
    }

    async delete(id) {
        const report = await Report.findOneAndUpdate(
            { id },
            {
                deletedAt: new Date().toISOString()
            },
            { new: true }
        );
        return report ? report.toObject() : null;
    }

    async getByPatient(patientId) {
        const reports = await Report.find({ patientId, deletedAt: '' }).sort({ createdAt: -1 });
        return reports.map(r => r.toObject());
    }

    async getByEntity(entityId) {
        const reports = await Report.find({ entityId, deletedAt: '' }).sort({ createdAt: -1 });
        return reports.map(r => r.toObject());
    }

    async getByInteraction(interactionId) {
        const reports = await Report.find({ interactionId, deletedAt: '' }).sort({ createdAt: -1 });
        return reports.map(r => r.toObject());
    }
}

module.exports = new ReportService();
