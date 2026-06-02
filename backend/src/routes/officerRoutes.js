const express = require('express');
const router = express.Router();
const OfficerController = require('../controllers/OfficerController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Internal login for officers
router.post('/login', OfficerController.login);

// Internal user profile (officer or receptionist)
router.get(
    '/me',
    authenticateToken,
    requireRoles(['officer', 'receptionist', 'accountant']),
    OfficerController.getMe
);
router.put(
    '/me',
    authenticateToken,
    requireRoles(['officer', 'receptionist', 'accountant']),
    OfficerController.updateMe
);

// Read: allow entity + internal users to fetch officer list
router.get(
    '/entity/:entityId',
    authenticateToken,
    requireRoles(['entity', 'officer', 'receptionist', 'accountant']),
    OfficerController.getOfficersByEntity
);

// Mutations: entity manages officers
router.use(authenticateToken, requireRoles(['entity']));

// Create a new officer
router.post('/', OfficerController.createOfficer);

// Update an officer
router.put('/:id', OfficerController.updateOfficer);

// Delete an officer
router.delete('/:id', OfficerController.deleteOfficer);

module.exports = router;

