const Service = require('../models/Service');

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

    async delete(code) {
        const service = await Service.findOneAndDelete({ code });
        return service ? service.toObject() : null;
    }

    // Seed initial services
    async seedInitialServices() {
        const existingServices = await this.getAll();
        if (existingServices.length > 0) {
            console.log('Services already seeded, skipping...');
            return existingServices;
        }

        const initialServices = [
            {
                code: 'A001',
                description: 'Minor Assessment: Office',
                hcpFee: 23.75,
                tFee: 0.00,
                pFee: 0.00,
                sFee: 0.00,
                nFeePercent: 0.00,
                diagReq: 'Y',
                refD: ''
            },
            {
                code: 'A002',
                description: '',
                hcpFee: 0.00,
                tFee: 0.00,
                pFee: 0.00,
                sFee: 0.00,
                nFeePercent: 0.00,
                diagReq: 'Y',
                refD: ''
            },
            {
                code: 'A003',
                description: 'General Assessment: Office',
                hcpFee: 87.35,
                tFee: 0.00,
                pFee: 0.00,
                sFee: 0.00,
                nFeePercent: 0.00,
                diagReq: 'Y',
                refD: ''
            },
            {
                code: 'A004',
                description: '',
                hcpFee: 0.00,
                tFee: 0.00,
                pFee: 0.00,
                sFee: 0.00,
                nFeePercent: 0.00,
                diagReq: 'Y',
                refD: ''
            }
        ];

        const created = [];
        for (const serviceData of initialServices) {
            const service = await this.create(serviceData);
            created.push(service);
        }

        console.log(`Seeded ${created.length} initial services`);
        return created;
    }
}

module.exports = new ServiceService();
