const express = require('express');
const router = express.Router();
const InteractionController = require('../controllers/InteractionController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const READ_ROLES = ['entity', 'officer', 'receptionist', 'accountant'];
const WRITE_ROLES = ['entity', 'officer', 'receptionist'];

router.use(authenticateToken);

// Get daily stats (counts only) for entity dashboard chart (must be before generic entity route)
router.get('/entity/:entityId/daily-stats', requireRoles(READ_ROLES), InteractionController.getDailyStats);

// Get status counts for pie chart (must be before generic entity route)
router.get('/entity/:entityId/status-counts', requireRoles(READ_ROLES), InteractionController.getStatusCounts);

// Get revenue for entity dashboard (must be before generic entity route)
router.get('/entity/:entityId/revenue', requireRoles(READ_ROLES), InteractionController.getRevenue);

// Get next available accounting number for an entity (must be before generic entity route)
router.get('/entity/:entityId/next-accounting-number', requireRoles(READ_ROLES), InteractionController.getNextAccountingNumber);

// Get all interactions for an entity
router.get('/entity/:entityId', requireRoles(READ_ROLES), InteractionController.getInteractionsByEntity);

// Get all interactions for a visitor (no time filter; for patient history)
router.get('/entity/:entityId/visitor/:visitorId', requireRoles(READ_ROLES), InteractionController.getInteractionsByVisitor);

// Get one interaction by id (full document)
router.get('/:id', requireRoles(READ_ROLES), InteractionController.getInteractionById);

// Create a new interaction (register patient)
router.post('/', requireRoles(WRITE_ROLES), InteractionController.createInteraction);

// Assign officer to interaction (receptionist only)
router.put('/:id/assign-officer', requireRoles(WRITE_ROLES), InteractionController.assignOfficer);

// Save interaction details (notes, service lines, etc.) — accountants may add billing lines
router.put('/:id/details', requireRoles(READ_ROLES), InteractionController.saveInteractionDetails);

// Delete an interaction (unregister)
router.delete('/:id', requireRoles(WRITE_ROLES), InteractionController.deleteInteraction);

// Cancel an interaction (set cancelled; only before start)
router.put('/:id/cancel', requireRoles(WRITE_ROLES), InteractionController.cancelInteraction);

module.exports = router;
