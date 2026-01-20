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

    async getByVisitor(visitorId) {
        const reports = await Report.find({ visitorId, deletedAt: '' }).sort({ uploadedAt: -1 });
        return reports.map(r => r.toObject());
    }

    async getByEntity(entityId) {
        const reports = await Report.find({ entityId, deletedAt: '' }).sort({ uploadedAt: -1 });
        return reports.map(r => r.toObject());
    }

    async getByInteraction(interactionId) {
        const reports = await Report.find({ interactionId, deletedAt: '' }).sort({ uploadedAt: -1 });
        return reports.map(r => r.toObject());
    }

    // Get next report number for a visitor (R1, R2, etc.)
    async getNextReportNumber(entityId, visitorId, interactionId = null) {
        try {
            const query = { 
                entityId, 
                visitorId, 
                deletedAt: '' 
            };
            
            // If interactionId is provided, count reports for that interaction
            // Otherwise, count all reports for the visitor
            if (interactionId) {
                query.interactionId = interactionId;
            }
            
            const reports = await Report.find(query);
            let max = 0;
            
            reports.forEach(report => {
                if (report.reportNumber && report.reportNumber > max) {
                    max = report.reportNumber;
                }
            });
            
            return max + 1;
        } catch (error) {
            console.error('getNextReportNumber error:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();
