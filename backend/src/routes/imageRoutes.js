const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/ImageController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Save interaction image
router.post('/interaction', ImageController.saveInteractionImage);

module.exports = router;
