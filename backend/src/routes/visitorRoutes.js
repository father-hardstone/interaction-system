const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/VisitorController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Visitors are used by entity + internal users (officer/receptionist)
router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Get next serial for an entity (must be before /entity/:entityId)
router.get('/entity/:entityId/next-serial', VisitorController.getNextSerial);

// Get all visitors for an entity
router.get('/entity/:entityId', VisitorController.getVisitorsByEntity);

// Create a new visitor
router.post('/', VisitorController.createVisitor);

// Update a visitor
router.put('/:id', VisitorController.updateVisitor);

// Delete a visitor
router.delete('/:id', VisitorController.deleteVisitor);

module.exports = router;
