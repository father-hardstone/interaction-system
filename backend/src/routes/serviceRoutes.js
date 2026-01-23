const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/ServiceController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Get all services
router.get('/', ServiceController.getAllServices);

// Seed initial services
router.post('/seed', ServiceController.seedServices);

// Get service by code
router.get('/:code', ServiceController.getServiceByCode);

// Create a new service
router.post('/', ServiceController.createService);

// Update a service
router.put('/:code', ServiceController.updateService);

// Delete a service
router.delete('/:code', ServiceController.deleteService);

module.exports = router;
