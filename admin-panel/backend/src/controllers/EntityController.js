const EntityService = require('../services/EntityService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class EntityController {
    // --- Admin Management Routes (admin-panel only) ---

    async getAllEntities(req, res) {
        try {
            // Need filtering? Client side or here? 
            // "searchable with name, id, phone" -> let's send all and filter on frontend for barebones, 
            // or implement basic query params.
            const all = await EntityService.getAll();
            // Filter out soft deleted? "deletedAt" flag exists. Usually admin wants to see them or not? 
            // Let's hide deleted by default unless requested.
            const activeOnly = all.filter(e => !e.deletedAt);

            // Mask passwords
            const safe = activeOnly.map(({ password, ...rest }) => rest);
            res.json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async createEntityByAdmin(req, res) {
        try {
            const { name, email, phone, password } = req.body;
            // Validation
            const existing = await EntityService.findOne(e => e.phone === phone);
            if (existing) return res.status(400).json({ error: "Entity exists" });

            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date().toISOString();
            const serial = await EntityService.getNextSerial('E');

            // Admin created -> Auto Approved
            const newEntity = {
                id: uuidv4(),
                serial,
                name,
                email: email || '',
                phone,
                password: hashedPassword,
                otp: '123456',
                active: 'true',
                approved: 'true',
                createdAt: now,
                editedAt: now,
                deletedAt: ''
            };

            await EntityService.create(newEntity);
            const { password: _, ...safe } = newEntity;
            res.status(201).json(safe);

        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async updateEntity(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            // Prevent changing id, serial directly usually, but flexible here.

            // If approving
            if (updates.approved) {
                // updates.approved = String(updates.approved); // Ensure string 'true'/'false' matches CSV
            }

            // Removing sensitive fields from updates just in case
            delete updates.password; // editing password should be separate flow usually, but ok for now

            const updated = await EntityService.update(id, updates);
            if (!updated) return res.status(404).json({ error: "Entity not found" });

            res.json(updated);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async approveEntity(req, res) {
        try {
            const { id } = req.params;
            const updated = await EntityService.update(id, { approved: 'true' });
            if (!updated) return res.status(404).json({ error: "Entity not found" });
            res.json(updated);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async deleteEntity(req, res) {
        try {
            const { id } = req.params;
            const success = await EntityService.delete(id);
            if (!success) return res.status(404).json({ error: "Entity not found" });
            res.json({ message: "Entity deleted" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new EntityController();
