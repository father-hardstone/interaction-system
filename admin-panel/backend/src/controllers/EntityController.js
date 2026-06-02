const EntityService = require('../services/EntityService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

const decryptPassword = (ciphertext) => {
    if (!ciphertext) return ciphertext;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText || originalText.length === 0) {
            throw new Error('Password decryption failed');
        }
        if (originalText.startsWith('U2FsdGVkX1')) {
            throw new Error('Password decryption failed');
        }
        return originalText;
    } catch (e) {
        // Fallback: assume plaintext for backward compatibility
        return ciphertext;
    }
};

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
            let { name, email, phone, password } = req.body;

            if (!name || !password) {
                return res.status(400).json({ error: 'Name and password are required' });
            }

            const normalizedPhone = (phone || '').trim();
            const normalizedEmail = (email || '').trim().toLowerCase();

            if (normalizedPhone) {
                const existingByPhone = await EntityService.findOne(e => e.phone === normalizedPhone);
                if (existingByPhone) return res.status(400).json({ error: 'An entity with this phone already exists' });
            }

            if (normalizedEmail) {
                const existingByEmail = await EntityService.findOne(
                    e => e.email && e.email.toLowerCase() === normalizedEmail
                );
                if (existingByEmail) return res.status(400).json({ error: 'An entity with this email already exists' });
            }

            password = decryptPassword(password).trim();
            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date().toISOString();
            const serial = await EntityService.getNextSerial('E');

            const newEntity = {
                id: uuidv4(),
                serial,
                name,
                email: normalizedEmail,
                phone: normalizedPhone,
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
            const updates = { ...req.body };
            // Prevent changing id, serial directly usually, but flexible here.

            // If approving
            if (updates.approved) {
                // updates.approved = String(updates.approved); // Ensure string 'true'/'false' matches CSV
            }

            // Handle password change if provided
            if (updates.password) {
                updates.password = decryptPassword(updates.password).trim();
                updates.password = await bcrypt.hash(updates.password, 10);
            } else {
                delete updates.password;
            }

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
