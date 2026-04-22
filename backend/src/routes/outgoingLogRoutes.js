const express = require('express');
const router = express.Router();
const OutgoingLogController = require('../controllers/OutgoingLogController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// List logs for an entity
router.get('/entity/:entityId', OutgoingLogController.listByEntity);

// Create new outgoing log entry
router.post('/', OutgoingLogController.create);

module.exports = router;

