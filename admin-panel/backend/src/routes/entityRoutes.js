const express = require('express');
const router = express.Router();
const EntityController = require('../controllers/EntityController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

// Admin-only entity management
router.use(authenticateToken, requireRoles(['admin']));

router.get('/', EntityController.getAllEntities);
router.post('/', EntityController.createEntityByAdmin);
router.put('/:id', EntityController.updateEntity);
router.put('/:id/approve', EntityController.approveEntity);
router.delete('/:id', EntityController.deleteEntity);

module.exports = router;

