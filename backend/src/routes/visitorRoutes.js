const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/VisitorController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const READ_ROLES = ['entity', 'officer', 'receptionist', 'accountant'];
const WRITE_ROLES = ['entity', 'officer', 'receptionist'];

// --- Public Routes ---
router.get('/onboarding/:entitySerial/:token', VisitorController.getVisitorByToken);
router.post('/onboarding/:entitySerial/:token/submit', VisitorController.submitOnboarding);

// --- Protected Routes ---
router.use(authenticateToken);

router.get('/entity/:entityId/next-serial', requireRoles(READ_ROLES), VisitorController.getNextSerial);
router.get('/entity/:entityId/count', requireRoles(READ_ROLES), VisitorController.getCountByEntity);
router.get('/entity/:entityId', requireRoles(READ_ROLES), VisitorController.getVisitorsByEntity);

router.post('/onboarding-link', requireRoles(WRITE_ROLES), VisitorController.createOnboardingLink);
router.post('/', requireRoles(WRITE_ROLES), VisitorController.createVisitor);
router.put('/:id', requireRoles(WRITE_ROLES), VisitorController.updateVisitor);
router.post('/:id/approve', requireRoles(WRITE_ROLES), VisitorController.approveVisitor);
router.delete('/:id', requireRoles(WRITE_ROLES), VisitorController.deleteVisitor);

module.exports = router;
