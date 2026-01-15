const express = require('express');
const router = express.Router();
const DiagnosticController = require('../controllers/DiagnosticController');

// Get all diagnostics
router.get('/', DiagnosticController.getAllDiagnostics);

// Seed initial diagnostics
router.post('/seed', DiagnosticController.seedDiagnostics);

// Get diagnostics by code
router.get('/code/:code', DiagnosticController.getDiagnosticsByCode);

// Create a new diagnostic
router.post('/', DiagnosticController.createDiagnostic);

// Update a diagnostic
router.put('/:id', DiagnosticController.updateDiagnostic);

// Delete a diagnostic
router.delete('/:id', DiagnosticController.deleteDiagnostic);

module.exports = router;
