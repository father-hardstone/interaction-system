const express = require('express');
const router = express.Router();
const ImageController = require('../controllers/ImageController');

// Save interaction image
router.post('/interaction', ImageController.saveInteractionImage);

module.exports = router;
