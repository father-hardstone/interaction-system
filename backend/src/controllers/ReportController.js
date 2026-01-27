const ReportService = require('../services/ReportService');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ReportController {
    // Get all reports for a patient
    async getReportsByPatient(req, res) {
        try {
            const { visitorId } = req.params; // Using visitorId as patientId
            const reports = await ReportService.getByPatient(visitorId);
            res.json(reports);
        } catch (error) {
            console.error('getReportsByPatient error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get all reports for an entity
    async getReportsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            const reports = await ReportService.getByEntity(entityId);
            res.json(reports);
        } catch (error) {
            console.error('getReportsByEntity error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get all reports for an interaction
    async getReportsByInteraction(req, res) {
        try {
            const { interactionId } = req.params;
            const reports = await ReportService.getByInteraction(interactionId);
            res.json(reports);
        } catch (error) {
            console.error('getReportsByInteraction error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Upload a report
    async uploadReport(req, res) {
        try {
            const {
                entityId,
                patientId,
                interactionId,
                reportType,
                procedureDate,
                reportGeneratedDate,
                labMetadata,
                notes,
                supabasePath, // Supabase storage path
                fileName,
                mimeType,
                fileSize,
                reportId, // Report ID from frontend
                uploadedBy
            } = req.body;

            // Validate required fields
            if (!entityId || !patientId || !reportType || !procedureDate || !reportGeneratedDate || !supabasePath || !fileName || !mimeType || !reportId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Create report record with Supabase path
            const reportData = {
                id: reportId,
                entityId,
                patientId,
                interactionId: interactionId || '',
                reportType,
                procedureDate,
                reportGeneratedDate,
                fileMetadata: {
                    supabasePath: supabasePath, // Supabase storage path
                    filename: fileName,
                    mimeType: mimeType,
                    size: fileSize || 0
                },
                labMetadata: labMetadata || {},
                notes: notes || '',
                uploadedBy: uploadedBy || ''
            };

            const report = await ReportService.create(reportData);

            console.log('Report uploaded to Supabase:', report.fileMetadata.supabasePath);
            res.json(report);
        } catch (error) {
            console.error('uploadReport error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Delete a report
    async deleteReport(req, res) {
        try {
            const { id } = req.params;
            const report = await ReportService.findOne({ id });

            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }

            // Soft delete
            await ReportService.delete(id);

            res.json({ message: 'Report deleted successfully' });
        } catch (error) {
            console.error('deleteReport error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ReportController();
