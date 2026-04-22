const { v4: uuidv4 } = require('uuid');
const Institute = require('../models/Institute');

function getEntityIdFromUser(user) {
    if (!user) return '';
    if (user.role === 'entity') return user.id || '';
    return user.entityId || '';
}

class InstituteController {
    async getByEntity(req, res) {
        try {
            const { entityId } = req.params;
            const userEntityId = getEntityIdFromUser(req.user);
            if (!userEntityId || userEntityId !== entityId) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const institutes = await Institute.find({ entityId }).sort({ name: 1 }).lean();
            res.json(institutes || []);
        } catch (e) {
            console.error('InstituteController.getByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async create(req, res) {
        try {
            const userEntityId = getEntityIdFromUser(req.user);
            if (!userEntityId) return res.status(401).json({ error: 'Unauthenticated' });

            const {
                name,
                type = 'other',
                email = '',
                fax = '',
                phone = '',
                address = ''
            } = req.body || {};

            if (!name || !String(name).trim()) {
                return res.status(400).json({ error: 'Institute name is required' });
            }

            const now = new Date().toISOString();
            const doc = await Institute.create({
                id: uuidv4(),
                entityId: userEntityId,
                name: String(name).trim(),
                type: String(type || 'other').trim(),
                email: String(email || '').trim(),
                fax: String(fax || '').trim(),
                phone: String(phone || '').trim(),
                address: String(address || '').trim(),
                createdAt: now,
                updatedAt: now
            });

            res.status(201).json(doc.toObject());
        } catch (e) {
            console.error('InstituteController.create error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const userEntityId = getEntityIdFromUser(req.user);
            if (!userEntityId) return res.status(401).json({ error: 'Unauthenticated' });

            const existing = await Institute.findOne({ id, entityId: userEntityId });
            if (!existing) return res.status(404).json({ error: 'Institute not found' });

            const updates = { ...(req.body || {}) };
            delete updates.id;
            delete updates.entityId;
            updates.updatedAt = new Date().toISOString();

            const updated = await Institute.findOneAndUpdate(
                { id, entityId: userEntityId },
                updates,
                { new: true }
            );

            res.json(updated ? updated.toObject() : null);
        } catch (e) {
            console.error('InstituteController.update error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const userEntityId = getEntityIdFromUser(req.user);
            if (!userEntityId) return res.status(401).json({ error: 'Unauthenticated' });

            const deleted = await Institute.findOneAndDelete({ id, entityId: userEntityId });
            if (!deleted) return res.status(404).json({ error: 'Institute not found' });

            res.json({ message: 'Institute deleted' });
        } catch (e) {
            console.error('InstituteController.delete error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new InstituteController();

