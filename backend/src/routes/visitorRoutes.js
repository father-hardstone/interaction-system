const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/VisitorController');

// Get all visitors for an entity
router.get('/entity/:entityId', VisitorController.getVisitorsByEntity);

// Create a new visitor
router.post('/', VisitorController.createVisitor);

// Update a visitor
router.put('/:id', VisitorController.updateVisitor);

// Delete a visitor
router.delete('/:id', VisitorController.deleteVisitor);

module.exports = router;
