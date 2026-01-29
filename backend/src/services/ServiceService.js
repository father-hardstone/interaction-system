const Service = require('../models/Service');

// Complete service codes from reference (Hcp Fee, TFee, PFee, SFee)
const FULL_SERVICE_CODES = [
    { code: 'A001', description: 'Minor Assessment: Office', hcpFee: 23.75, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A002', description: '', hcpFee: 62.20, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A003', description: 'General Assessment: Office', hcpFee: 87.35, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A004', description: 'General Re-Assessment: Office', hcpFee: 38.35, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A005', description: 'Consultation: Office', hcpFee: 87.90, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A006', description: 'Repeat Consultation: Office', hcpFee: 45.90, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A007', description: 'Intermediate Assessment', hcpFee: 37.95, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A008', description: 'Mini Assessment', hcpFee: 13.05, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A010', description: '', hcpFee: 87.90, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A011', description: '', hcpFee: 45.90, tFee: 0, pFee: 0, sFee: 0, diagReq: 'Y' },
    { code: 'A013', description: 'General Assessment: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 64.65, diagReq: 'Y' },
    { code: 'A014', description: 'General Re-Assessment: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 31.45, diagReq: 'Y' },
    { code: 'A015', description: 'Consultation: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 109.70, diagReq: 'Y' },
    { code: 'A016', description: 'Repeat Consultation: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 52.15, diagReq: 'Y' },
    { code: 'A020', description: '', hcpFee: 0, tFee: 0, pFee: 0, sFee: 60.00, diagReq: 'Y' },
    { code: 'A021', description: '', hcpFee: 0, tFee: 0, pFee: 0, sFee: 164.90, diagReq: 'Y' },
    { code: 'A023', description: 'General Assessment: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 43.00, diagReq: 'Y' },
    { code: 'A024', description: 'General Re-Assessment: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 21.90, diagReq: 'Y' },
    { code: 'A025', description: 'Consultation: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 72.15, diagReq: 'Y' },
    { code: 'A026', description: 'Repeat Consultation: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 44.45, diagReq: 'Y' },
    { code: 'A027', description: '', hcpFee: 0, tFee: 0, pFee: 0, sFee: 147.30, diagReq: 'Y' },
    { code: 'A033', description: 'General Assessment: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 47.30, diagReq: 'Y' },
    { code: 'A034', description: 'General Re-Assessment: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 28.60, diagReq: 'Y' },
    { code: 'A035', description: 'Consultation: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 96.20, diagReq: 'Y' },
    { code: 'A036', description: 'Repeat Consultation: Office', hcpFee: 0, tFee: 0, pFee: 0, sFee: 64.10, diagReq: 'Y' }
];

class ServiceService {
    async getAll() {
        const services = await Service.find({});
        return services.map(s => s.toObject());
    }

    async create(data) {
        const service = new Service(data);
        await service.save();
        return service.toObject();
    }

    async findOne(query) {
        const service = await Service.findOne(query);
        return service ? service.toObject() : null;
    }

    async findByCode(code) {
        const service = await Service.findOne({ code });
        return service ? service.toObject() : null;
    }

    async update(code, updates) {
        updates.editedAt = new Date().toISOString();
        const service = await Service.findOneAndUpdate(
            { code },
            updates,
            { new: true }
        );
        return service ? service.toObject() : null;
    }

    async upsert(data) {
        const existing = await Service.findOne({ code: data.code });
        const payload = {
            description: data.description ?? '',
            hcpFee: data.hcpFee ?? 0,
            tFee: data.tFee ?? 0,
            pFee: data.pFee ?? 0,
            sFee: data.sFee ?? 0,
            nFeePercent: data.nFeePercent ?? 0,
            diagReq: data.diagReq ?? 'N',
            refD: data.refD ?? '',
            suffix: data.suffix ?? '',
            editedAt: new Date().toISOString()
        };
        if (existing) {
            return (await this.update(data.code, payload)) || existing;
        }
        return await this.create({ ...data, ...payload });
    }

    async delete(code) {
        const service = await Service.findOneAndDelete({ code });
        return service ? service.toObject() : null;
    }

    // Seed initial services (only when collection is empty)
    async seedInitialServices() {
        const existingServices = await this.getAll();
        if (existingServices.length > 0) {
            console.log('Services already seeded, skipping...');
            return existingServices;
        }

        const created = [];
        for (const serviceData of FULL_SERVICE_CODES) {
            const service = await this.create({
                ...serviceData,
                nFeePercent: 0,
                refD: ''
            });
            created.push(service);
        }

        console.log(`Seeded ${created.length} initial services`);
        return created;
    }

    // Migrate/upsert: add missing service codes and update existing ones with correct fees
    async migrateServiceCodes() {
        let inserted = 0;
        let updated = 0;
        for (const data of FULL_SERVICE_CODES) {
            const payload = {
                description: data.description ?? '',
                hcpFee: data.hcpFee ?? 0,
                tFee: data.tFee ?? 0,
                pFee: data.pFee ?? 0,
                sFee: data.sFee ?? 0,
                nFeePercent: 0,
                diagReq: data.diagReq ?? 'Y',
                refD: '',
                editedAt: new Date().toISOString()
            };
            const existing = await Service.findOne({ code: data.code });
            await Service.findOneAndUpdate(
                { code: data.code },
                {
                    $set: payload,
                    $setOnInsert: { code: data.code, createdAt: new Date().toISOString() }
                },
                { upsert: true, new: true }
            );
            if (existing) {
                updated++;
            } else {
                inserted++;
            }
        }
        console.log(`Service migration: ${inserted} inserted, ${updated} updated`);
        return { inserted, updated };
    }

    // Force reload: delete all services and insert fresh from FULL_SERVICE_CODES
    async forceReloadServiceCodes() {
        const deleted = await Service.deleteMany({});
        console.log(`Deleted ${deleted.deletedCount} existing services`);
        const created = [];
        for (const data of FULL_SERVICE_CODES) {
            const service = await this.create({
                code: data.code,
                description: data.description ?? '',
                hcpFee: data.hcpFee ?? 0,
                tFee: data.tFee ?? 0,
                pFee: data.pFee ?? 0,
                sFee: data.sFee ?? 0,
                nFeePercent: 0,
                diagReq: data.diagReq ?? 'Y',
                refD: ''
            });
            created.push(service);
        }
        console.log(`Inserted ${created.length} services`);
        return { deleted: deleted.deletedCount, inserted: created.length };
    }
}

module.exports = new ServiceService();
