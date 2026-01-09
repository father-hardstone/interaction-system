const ReceptionistService = require('../services/ReceptionistService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class ReceptionistController {
    // Get all receptionists for a specific entity
    async getReceptionistsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            console.log('getReceptionistsByEntity - entityId:', entityId);
            const all = await ReceptionistService.getAll();
            console.log('getReceptionistsByEntity - total receptionists:', all.length);
            all.forEach(r => {
                console.log(`Receptionist: id=${r.id}, serial=${r.serial}, entityId=${r.entityId}, entitySerial=${r.entitySerial}, name=${r.name}`);
            });
            const filtered = all.filter(
                r => r.entityId === entityId && (!r.deletedAt || r.deletedAt === '')
            );
            console.log('getReceptionistsByEntity - filtered receptionists:', filtered.length);

            const safe = filtered.map(({ password, ...rest }) => rest);
            res.json(safe);
        } catch (e) {
            console.error('getReceptionistsByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new receptionist
    async createReceptionist(req, res) {
        try {
            const { entityId, entitySerial, name, phone, email, password } = req.body;

            console.log('createReceptionist - Received data:', {
                entityId,
                entitySerial,
                name,
                phone,
                email: email ? email.substring(0, 10) + '...' : 'missing'
            });

            if (!entityId || !entitySerial || !name || !phone || !email || !password) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            // Validate that entitySerial starts with 'E' (entity serial format)
            if (!entitySerial.startsWith('E')) {
                console.error('createReceptionist - Invalid entitySerial format:', entitySerial);
                return res.status(400).json({ error: "Invalid entity serial format. Must start with 'E'" });
            }

            const existing = await ReceptionistService.findOne(
                r => (r.phone === phone || r.email === email) && r.entityId === entityId
            );
            if (existing) {
                return res.status(400).json({ error: "Receptionist with this phone or email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date().toISOString();
            const serial = await ReceptionistService.getNextSerial('R'); // R1, R2...

            const newReceptionist = {
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

            console.log('createReceptionist - Creating receptionist:', {
                serial,
                entityId,
                entitySerial,
                name
            });

            await ReceptionistService.create(newReceptionist);
            const { password: _, ...safe } = newReceptionist;
            res.status(201).json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Update a receptionist
    async updateReceptionist(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            delete updates.password;
            delete updates.id;
            delete updates.serial;
            delete updates.entityId;
            delete updates.entitySerial;

            const updated = await ReceptionistService.update(id, updates);
            if (!updated) return res.status(404).json({ error: "Receptionist not found" });

            const { password: _, ...safe } = updated;
            res.json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Delete a receptionist (soft delete)
    async deleteReceptionist(req, res) {
        try {
            const { id } = req.params;
            const success = await ReceptionistService.delete(id);
            if (!success) return res.status(404).json({ error: "Receptionist not found" });
            res.json({ message: "Receptionist deleted" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new ReceptionistController();

