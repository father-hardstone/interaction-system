const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { authenticateToken, requireRoles } = require('../middleware/auth');

router.use(authenticateToken, requireRoles(['entity', 'officer', 'receptionist']));

// Get all reports for a patient
router.get('/patient/:visitorId', ReportController.getReportsByPatient);

// Get all reports for an entity
router.get('/entity/:entityId', ReportController.getReportsByEntity);

// Get unreviewed reports for an entity (report reviews tab)
router.get('/entity/:entityId/review', ReportController.getReportsForReview);

// Update a report (e.g. reviewed, action)
router.patch('/:id', ReportController.updateReport);

// Get all reports for an interaction
router.get('/interaction/:interactionId', ReportController.getReportsByInteraction);

// Upload a report
router.post('/upload', ReportController.uploadReport);

// Delete a report
router.delete('/:id', ReportController.deleteReport);

module.exports = router;
