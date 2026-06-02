const express = require('express');
const router = express.Router();
const AccountantController = require('../controllers/AccountantController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken, requireRoles(['entity']));

router.get('/entity/:entityId', AccountantController.getAccountantsByEntity);
router.post('/', AccountantController.createAccountant);
router.put('/:id', AccountantController.updateAccountant);
router.delete('/:id', AccountantController.deleteAccountant);

module.exports = router;
