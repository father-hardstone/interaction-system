const express = require('express');
const router = express.Router();
const ReceptionistController = require('../controllers/ReceptionistController');

// Get all receptionists for an entity
router.get('/entity/:entityId', ReceptionistController.getReceptionistsByEntity);

// Create a new receptionist
router.post('/', ReceptionistController.createReceptionist);

// Update a receptionist
router.put('/:id', ReceptionistController.updateReceptionist);

// Delete a receptionist
router.delete('/:id', ReceptionistController.deleteReceptionist);

module.exports = router;

