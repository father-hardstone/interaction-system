const express = require('express');
const router = express.Router();
const OfficerController = require('../controllers/OfficerController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Internal login for officers
router.post('/login', OfficerController.login);

// Everything else requires ENTITY auth (entity manages officers)
router.use(authenticateToken, requireRoles(['entity']));

// Get all officers for an entity
router.get('/entity/:entityId', OfficerController.getOfficersByEntity);

// Create a new officer
router.post('/', OfficerController.createOfficer);

// Update an officer
router.put('/:id', OfficerController.updateOfficer);

// Delete an officer
router.delete('/:id', OfficerController.deleteOfficer);

module.exports = router;

