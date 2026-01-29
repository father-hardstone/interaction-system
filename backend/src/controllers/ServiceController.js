const ServiceService = require('../services/ServiceService');

class ServiceController {
    // Get all services
    async getAllServices(req, res) {
        try {
            const services = await ServiceService.getAll();
            res.json(services);
        } catch (e) {
            console.error('getAllServices error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get service by code
    async getServiceByCode(req, res) {
        try {
            const { code } = req.params;
            const service = await ServiceService.findByCode(code);
            if (!service) {
                return res.status(404).json({ error: 'Service not found' });
            }
            res.json(service);
        } catch (e) {
            console.error('getServiceByCode error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new service
    async createService(req, res) {
        try {
            const {
                code,
                description,
                hcpFee,
                tFee,
                pFee,
                sFee,
                nFeePercent,
                diagReq,
                refD
            } = req.body;

            if (!code) {
                return res.status(400).json({ error: 'Code is required' });
            }

            // Check if service with this code already exists
            const existing = await ServiceService.findByCode(code);
            if (existing) {
                return res.status(400).json({ error: 'Service with this code already exists' });
            }

            const now = new Date().toISOString();
            const newService = {
                code: code.trim(),
                description: description ? description.trim() : '',
                hcpFee: parseFloat(hcpFee) || 0.00,
                tFee: parseFloat(tFee) || 0.00,
                pFee: parseFloat(pFee) || 0.00,
                sFee: parseFloat(sFee) || 0.00,
                nFeePercent: parseFloat(nFeePercent) || 0.00,
                diagReq: diagReq || 'N',
                refD: refD || '',
                createdAt: now,
                editedAt: now
            };

            const created = await ServiceService.create(newService);
            res.status(201).json(created);
        } catch (e) {
            console.error('createService error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Update a service
    async updateService(req, res) {
        try {
            const { code } = req.params;
            const updates = req.body;

            // Don't allow changing code
            delete updates.code;
            delete updates.createdAt;

            const updated = await ServiceService.update(code, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Service not found' });
            }

            res.json(updated);
        } catch (e) {
            console.error('updateService error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Delete a service
    async deleteService(req, res) {
        try {
            const { code } = req.params;
            const deleted = await ServiceService.delete(code);
            if (!deleted) {
                return res.status(404).json({ error: 'Service not found' });
            }
            res.json({ message: 'Service deleted' });
        } catch (e) {
            console.error('deleteService error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Seed initial services
    async seedServices(req, res) {
        try {
            const services = await ServiceService.seedInitialServices();
            res.json({ message: 'Services seeded successfully', count: services.length, services });
        } catch (e) {
            console.error('seedServices error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Migrate service codes (upsert missing, update fees)
    async migrateServices(req, res) {
        try {
            const { inserted, updated } = await ServiceService.migrateServiceCodes();
            res.json({ message: 'Service codes migrated', inserted, updated });
        } catch (e) {
            console.error('migrateServices error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new ServiceController();
