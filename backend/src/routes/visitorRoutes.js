const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/VisitorController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Visitors are used by entity + internal users (officer/receptionist)
// Protected routes are handled below with router.use(authenticateToken...)

// --- Public Routes ---
router.get('/onboarding/:entitySerial/:token', VisitorController.getVisitorByToken);
router.post('/onboarding/:entitySerial/:token/submit', VisitorController.submitOnboarding);

// --- Protected Routes ---
router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Get next serial for an entity (must be before /entity/:entityId)
router.get('/entity/:entityId/next-serial', VisitorController.getNextSerial);

// Get patient count for an entity (must be before generic /entity/:entityId)
router.get('/entity/:entityId/count', VisitorController.getCountByEntity);

// Onboarding: Generate link
router.post('/onboarding-link', VisitorController.createOnboardingLink);

// Get all visitors for an entity
router.get('/entity/:entityId', VisitorController.getVisitorsByEntity);

// Create a new visitor
router.post('/', VisitorController.createVisitor);

// Update a visitor
router.put('/:id', VisitorController.updateVisitor);

// Approve visitor
router.post('/:id/approve', VisitorController.approveVisitor);

// Delete a visitor
router.delete('/:id', VisitorController.deleteVisitor);

module.exports = router;
