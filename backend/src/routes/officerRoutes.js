const express = require('express');
const router = express.Router();
const OfficerController = require('../controllers/OfficerController');

// Get all officers for an entity
router.get('/entity/:entityId', OfficerController.getOfficersByEntity);

// Create a new officer
router.post('/', OfficerController.createOfficer);

// Update an officer
router.put('/:id', OfficerController.updateOfficer);

// Delete an officer
router.delete('/:id', OfficerController.deleteOfficer);

// Internal login for officers
router.post('/login', OfficerController.login);

module.exports = router;

