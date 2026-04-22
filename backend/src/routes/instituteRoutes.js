const express = require('express');
const router = express.Router();
const InstituteController = require('../controllers/InstituteController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Read access for entity + internal users (officer/receptionist)
router.get(
    '/entity/:entityId',
    authenticateToken,
    requireRoles(['entity', 'officer', 'receptionist']),
    InstituteController.getByEntity
);

// Mutations: managed by entity
router.use(authenticateToken, requireRoles(['entity']));

router.post('/', InstituteController.create);
router.patch('/:id', InstituteController.update);
router.delete('/:id', InstituteController.delete);

module.exports = router;

