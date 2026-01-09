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
            const { entityId, entitySerial, visitorId, visitorSerial } = req.body;
            
            console.log('createInteraction - Received data:', {
                entityId,
                entitySerial,
                visitorId,
                visitorSerial
            });
            
            if (!entityId || !entitySerial || !visitorId || !visitorSerial) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Generate interaction serial
            const interactionSerial = await InteractionService.getNextSerialForEntity(entitySerial, visitorSerial);
            console.log('createInteraction - Generated interactionSerial:', interactionSerial);
            
            if (!interactionSerial) {
                return res.status(500).json({ error: 'Failed to generate interaction serial' });
            }

            const { v4: uuidv4 } = require('uuid');
            const interactionId = uuidv4();
            console.log('createInteraction - Generated id:', interactionId);
            
            const now = new Date().toISOString();

            const interactionData = {
                id: interactionId,
                interactionSerial: interactionSerial,
                entityId: entityId,
                entitySerial: entitySerial,
                visitorId: visitorId,
                visitorSerial: visitorSerial,
                officerId: '',
                officerSerial: '',
                createdAt: now,
                editedAt: now,
                deletedAt: ''
            };

            console.log('createInteraction - Interaction data to save:', interactionData);

            const created = await InteractionService.create(interactionData);
            console.log('createInteraction - Created interaction:', created);
            res.status(201).json(created);
        } catch (e) {
            console.error('createInteraction error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Delete an interaction
    async deleteInteraction(req, res) {
        try {
            const { id } = req.params;
            const deleted = await InteractionService.delete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Interaction not found' });
            }
            res.json({ message: 'Interaction deleted successfully' });
        } catch (e) {
            console.error('deleteInteraction error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new InteractionController();
