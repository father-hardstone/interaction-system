const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/InteractionController');

// Get all interactions for an entity
router.get('/entity/:entityId', InteractionController.getInteractionsByEntity);

// Create a new interaction
router.post('/', InteractionController.createInteraction);

// Assign officer to interaction (receptionist only)
router.put('/:id/assign-officer', InteractionController.assignOfficer);

// Delete an interaction
router.delete('/:id', InteractionController.deleteInteraction);

module.exports = router;
