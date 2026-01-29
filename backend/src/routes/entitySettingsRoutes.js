const express = require('express');
const router = express.Router();
const EntityController = require('../controllers/EntityController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Entity Settings Routes (Protected - Entity role only)
router.get('/settings', authenticateToken, requireRoles(['entity']), EntityController.getEntitySettings);
router.put('/settings', authenticateToken, requireRoles(['entity']), EntityController.updateEntitySettings);

// Get entity by ID (for authenticated users - officers/receptionists can access their entity info)
router.get('/:id', authenticateToken, EntityController.getEntityById);

module.exports = router;
