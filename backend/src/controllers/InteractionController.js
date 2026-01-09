const InteractionService = require('../services/InteractionService');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

class InteractionController {
    // Get all interactions for a specific entity
    async getInteractionsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            console.log('getInteractionsByEntity - entityId:', entityId);
            const all = await InteractionService.getAll();
            console.log('getInteractionsByEntity - total interactions:', all.length);
            const filtered = all.filter(
                i => i.entityId === entityId && (!i.deletedAt || i.deletedAt === '')
            );
            console.log('getInteractionsByEntity - filtered interactions:', filtered.length);

            res.json(filtered);
        } catch (e) {
            console.error('getInteractionsByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Update interaction to assign/unassign officer (receptionist only)
    async assignOfficer(req, res) {
        try {
            const { id } = req.params;
            const { officerId, officerSerial } = req.body;

            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);
            let decoded;
            try {
                decoded = jwt.verify(token, SECRET_KEY);
            } catch (e) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user is a receptionist
            if (decoded.role !== 'receptionist') {
                return res.status(403).json({ error: 'Only receptionists can assign interactions to officers' });
            }

            // Allow unassigning by passing empty strings
            // Update interaction
            const updates = {
                officerId: officerId || '',
                officerSerial: officerSerial || ''
            };

            const updated = await InteractionService.update(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            console.log('assignOfficer - Updated interaction:', {
                id,
                officerId,
                officerSerial
            });

            res.json(updated);
        } catch (e) {
            console.error('assignOfficer error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new interaction
    async createInteraction(req, res) {
        try {
            const interactionData = req.body;
            const created = await InteractionService.create(interactionData);
            res.status(201).json(created);
        } catch (e) {
            console.error('createInteraction error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new InteractionController();
