const AccountantService = require('../services/AccountantService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class AccountantController {
    async getAccountantsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            const all = await AccountantService.getAll();
            const filtered = all.filter(
                (a) => a.entityId === entityId && (!a.deletedAt || a.deletedAt === '')
            );
            const safe = filtered.map(({ password, ...rest }) => rest);
            res.json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async createAccountant(req, res) {
        try {
            const { entityId, entitySerial, name, phone, email, password } = req.body;

            if (!entityId || !entitySerial || !name || !phone || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (!entitySerial.startsWith('E')) {
                return res.status(400).json({ error: "Invalid entity serial format. Must start with 'E'" });
            }

            const existing = await AccountantService.findOne(
                (a) => (a.phone === phone || a.email === email) && a.entityId === entityId
            );
            if (existing) {
                return res.status(400).json({ error: 'Accountant with this phone or email already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date().toISOString();
            const serial = await AccountantService.getNextSerial('AC');

            const newAccountant = {
                id: uuidv4(),
                serial,
                entityId,
                entitySerial,
                name,
                phone,
                email,
                password: hashedPassword,
                active: 'true',
                approved: 'true',
                createdAt: now,
                editedAt: now,
                deletedAt: ''
            };

            await AccountantService.create(newAccountant);
            const { password: _, ...safe } = newAccountant;
            res.status(201).json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async updateAccountant(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            delete updates.password;
            const updated = await AccountantService.update(id, updates);
            if (!updated) return res.status(404).json({ error: 'Accountant not found' });
            const { password, ...safe } = updated;
            res.json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async deleteAccountant(req, res) {
        try {
            const { id } = req.params;
            const success = await AccountantService.delete(id);
            if (!success) return res.status(404).json({ error: 'Accountant not found' });
            res.json({ message: 'Accountant deleted' });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new AccountantController();
