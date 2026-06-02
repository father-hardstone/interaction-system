const OfficerService = require('../services/OfficerService');
const ReceptionistService = require('../services/ReceptionistService');
const AccountantService = require('../services/AccountantService');
const EntityService = require('../services/EntityService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

const decryptPassword = (ciphertext) => {
    if (!ciphertext) return ciphertext;
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText || originalText.length === 0) {
            console.error('Password decryption failed: empty result');
            throw new Error('Password decryption failed');
        }
        if (originalText.startsWith('U2FsdGVkX1')) {
            console.error('Password decryption failed: result still appears encrypted');
            throw new Error('Password decryption failed');
        }
        return originalText;
    } catch (e) {
        console.error('Password decryption error:', e.message);
        throw new Error('Password decryption failed');
    }
};

class OfficerController {
    // Get all officers for a specific entity
    async getOfficersByEntity(req, res) {
        try {
            const { entityId } = req.params;
            console.log('getOfficersByEntity - entityId:', entityId);
            const allOfficers = await OfficerService.getAll();
            console.log('getOfficersByEntity - total officers:', allOfficers.length);
            const entityOfficers = allOfficers.filter(
                o => o.entityId === entityId && (!o.deletedAt || o.deletedAt === '')
            );
            console.log('getOfficersByEntity - filtered officers:', entityOfficers.length);

            // Remove passwords from response
            const safe = entityOfficers.map(({ password, ...rest }) => rest);
            res.json(safe);
        } catch (e) {
            console.error('getOfficersByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new officer
    async createOfficer(req, res) {
        try {
            const { entityId, entitySerial, name, phone, email, password } = req.body;

            console.log('createOfficer - Received data:', {
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
                console.error('createOfficer - Invalid entitySerial format:', entitySerial);
                return res.status(400).json({ error: "Invalid entity serial format. Must start with 'E'" });
            }

            // Check if phone or email already exists for this entity
            const existing = await OfficerService.findOne(
                o => (o.phone === phone || o.email === email) && o.entityId === entityId
            );
            if (existing) {
                return res.status(400).json({ error: "Officer with this phone or email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date().toISOString();
            const serial = await OfficerService.getNextSerial('O'); // O1, O2...

            const newOfficer = {
                id: uuidv4(),
                serial,
                entityId,
                entitySerial,
                name,
                phone,
                email,
                password: hashedPassword,
                active: 'true',
                approved: 'true', // Auto-approved when created by entity
                createdAt: now,
                editedAt: now,
                deletedAt: ''
            };

            await OfficerService.create(newOfficer);
            const { password: _, ...safe } = newOfficer;
            res.status(201).json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Update an officer
    async updateOfficer(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Don't allow changing password through this endpoint (should be separate)
            delete updates.password;
            delete updates.id;
            delete updates.serial;
            delete updates.entityId;
            delete updates.entitySerial;

            const updated = await OfficerService.update(id, updates);
            if (!updated) return res.status(404).json({ error: "Officer not found" });

            const { password: _, ...safe } = updated;
            res.json(safe);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Delete an officer (soft delete)
    async deleteOfficer(req, res) {
        try {
            const { id } = req.params;
            const success = await OfficerService.delete(id);
            if (!success) return res.status(404).json({ error: "Officer not found" });
            res.json({ message: "Officer deleted" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Internal login for officers and receptionists
    async login(req, res) {
        try {
            let { email, phone, password, entityKey } = req.body;

            // Validate required fields first
            if (!password || !entityKey || (!email && !phone)) {
                return res.status(400).json({ error: "Please provide email or phone, password, and entity key" });
            }

            // Decrypt password if it was sent encrypted
            try {
                password = decryptPassword(password);
                password = password.trim();
            } catch (e) {
                // If decryption fails, assume password is already plain text (for backward compatibility)
                console.log('Password decryption failed, assuming plain text');
            }

            let user = null;
            let role = null;

            const findByEmail = async (value) => {
                let u = await OfficerService.findOne((o) => o.email === value && o.active === 'true');
                if (u) return { user: u, role: 'officer' };
                u = await ReceptionistService.findOne((r) => r.email === value && r.active === 'true');
                if (u) return { user: u, role: 'receptionist' };
                u = await AccountantService.findOne((a) => a.email === value && a.active === 'true');
                if (u) return { user: u, role: 'accountant' };
                return { user: null, role: null };
            };

            const findByPhone = async (value) => {
                let u = await OfficerService.findOne((o) => o.phone === value && o.active === 'true');
                if (u) return { user: u, role: 'officer' };
                u = await ReceptionistService.findOne((r) => r.phone === value && r.active === 'true');
                if (u) return { user: u, role: 'receptionist' };
                u = await AccountantService.findOne((a) => a.phone === value && a.active === 'true');
                if (u) return { user: u, role: 'accountant' };
                return { user: null, role: null };
            };

            if (email) {
                ({ user, role } = await findByEmail(email));
            } else {
                ({ user, role } = await findByPhone(phone));
            }

            // Check if user exists and is not deleted
            if (!user || user.deletedAt) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            // Validate password first (before entity key check)
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            // Then validate entity key (only after password matches)
            if (user.entitySerial !== entityKey) {
                return res.status(403).json({ error: "Invalid entity key" });
            }

            // Fetch entity name for the token
            const entity = await EntityService.findOne({ id: user.entityId });

            const token = jwt.sign({
                id: user.id,
                serial: user.serial,
                entityId: user.entityId,
                entitySerial: user.entitySerial,
                entityName: entity ? entity.name : user.entitySerial,
                name: user.name,
                phone: user.phone,
                email: user.email,
                billingNumber: user.billingNumber || '',
                cpsoNumber: user.cpsoNumber || '',
                profilePicture: user.profilePicture || '',
                role: role || 'officer'
            }, SECRET_KEY, { expiresIn: '1d' });

            res.json({ message: "Login success", token });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Get current internal user profile (officer or receptionist)
    async getMe(req, res) {
        try {
            const { id, role } = req.user || {};
            if (!id || !role) return res.status(401).json({ error: 'Unauthenticated' });

            let record;
            if (role === 'receptionist') {
                record = await ReceptionistService.findOne({ id });
            } else if (role === 'accountant') {
                record = await AccountantService.findOne({ id });
            } else {
                record = await OfficerService.findOne({ id });
            }

            if (!record) return res.status(404).json({ error: 'User not found' });

            const { password, ...safe } = record;
            res.json({
                user: {
                    ...safe,
                    billingNumber: safe.billingNumber || '',
                    cpsoNumber: safe.cpsoNumber || '',
                    profilePicture: safe.profilePicture || ''
                }
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Update current internal user profile (officer or receptionist)
    async updateMe(req, res) {
        try {
            const { id, role, entityName, entitySerial, entityId, serial } = req.user || {};
            if (!id || !role) return res.status(401).json({ error: 'Unauthenticated' });

            const body = req.body || {};
            const updates = {};

            if (body.name !== undefined) updates.name = String(body.name || '').trim();
            if (body.billingNumber !== undefined) updates.billingNumber = String(body.billingNumber || '').trim();
            if (body.cpsoNumber !== undefined) updates.cpsoNumber = String(body.cpsoNumber || '').trim();
            if (body.profilePicture !== undefined) {
                const v = String(body.profilePicture || '');
                // Basic size guard: prevent huge base64 payloads
                if (v && v.length > 700000) return res.status(413).json({ error: 'Profile image is too large' });
                updates.profilePicture = v;
            }

            // Email is intentionally not editable right now
            delete updates.email;

            let updated;
            if (role === 'receptionist') {
                updated = await ReceptionistService.update(id, updates);
            } else if (role === 'accountant') {
                updated = await AccountantService.update(id, updates);
            } else {
                updated = await OfficerService.update(id, updates);
            }

            if (!updated) return res.status(404).json({ error: 'User not found' });

            const { password, ...safe } = updated;

            const token = jwt.sign({
                id: safe.id,
                serial: safe.serial || serial,
                entityId: safe.entityId || entityId,
                entitySerial: safe.entitySerial || entitySerial,
                entityName: entityName || safe.entitySerial || entitySerial,
                name: safe.name,
                phone: safe.phone,
                email: safe.email,
                billingNumber: safe.billingNumber || '',
                cpsoNumber: safe.cpsoNumber || '',
                profilePicture: safe.profilePicture || '',
                role
            }, SECRET_KEY, { expiresIn: '1d' });

            res.json({
                user: {
                    ...safe,
                    billingNumber: safe.billingNumber || '',
                    cpsoNumber: safe.cpsoNumber || '',
                    profilePicture: safe.profilePicture || ''
                },
                token
            });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new OfficerController();

