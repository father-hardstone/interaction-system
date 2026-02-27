const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/InteractionController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Interactions are used by entity + internal users (officer/receptionist)
router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Get all interactions for an entity
router.get('/entity/:entityId', InteractionController.getInteractionsByEntity);

// Get all interactions for a visitor (no time filter; for patient history)
router.get('/entity/:entityId/visitor/:visitorId', InteractionController.getInteractionsByVisitor);

// Get one interaction by id (full document)
router.get('/:id', InteractionController.getInteractionById);

// Create a new interaction
router.post('/', InteractionController.createInteraction);

// Assign officer to interaction (receptionist only)
router.put('/:id/assign-officer', InteractionController.assignOfficer);

// Save interaction details (notes, service lines, etc.)
router.put('/:id/details', InteractionController.saveInteractionDetails);

// Delete an interaction (unregister)
router.delete('/:id', InteractionController.deleteInteraction);

// Cancel an interaction (set cancelled; only before start)
router.put('/:id/cancel', InteractionController.cancelInteraction);

module.exports = router;
