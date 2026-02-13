const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/InteractionController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Interactions are used by entity + internal users (officer/receptionist)
router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Get all interactions for an entity
router.get('/entity/:entityId', InteractionController.getInteractionsByEntity);

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
