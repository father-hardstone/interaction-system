const express = require('express');
const router = express.Router();
const EntityController = require('../controllers/EntityController');

// Entity Auth (public)
router.post('/register', EntityController.register);
router.post('/login', EntityController.login);
router.post('/verify-otp', EntityController.verifyOtp);

module.exports = router;

