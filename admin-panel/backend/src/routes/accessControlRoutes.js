const express = require('express');
const router = express.Router();
const AccessControlController = require('../controllers/AccessControlController');

// Admin auth (public)
router.post('/register', AccessControlController.register);
router.post('/login', AccessControlController.login);
router.post('/verify-otp', AccessControlController.verifyOtp);

module.exports = router;

