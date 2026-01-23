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
                fileData, // base64
                fileName,
                mimeType,
                uploadedBy
            } = req.body;

            // Validate required fields
            if (!entityId || !patientId || !reportType || !procedureDate || !reportGeneratedDate || !fileData || !fileName || !mimeType) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const reportId = uuidv4();
            const year = new Date(procedureDate).getFullYear().toString();
            const reportDateStr = procedureDate.replace(/-/g, ''); // yyyymmdd
            const fileExtension = path.extname(fileName).toLowerCase();
            const storageFilename = `${reportId}_${reportDateStr}${fileExtension}`;

            // storage path: backend/uploads/{entityId}/{patientId}/reports/{year}/{filename}
            const relativeDir = path.join('uploads', entityId, patientId, 'reports', year);
            const absoluteDir = path.join(__dirname, '../../', relativeDir);
            await fs.mkdir(absoluteDir, { recursive: true });

            // Handle file data (base64)
            let buffer;
            if (fileData.startsWith('data:')) {
                const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                buffer = Buffer.from(fileData, 'base64');
            }

            // Save file
            const absoluteFilePath = path.join(absoluteDir, storageFilename);
            const relativeFilePath = path.join(relativeDir, storageFilename).replace(/\\/g, '/');
            await fs.writeFile(absoluteFilePath, buffer);

            // Create report record
            const reportData = {
                id: reportId,
                entityId,
                patientId,
                interactionId: interactionId || '',
                reportType,
                procedureDate,
                reportGeneratedDate,
                fileMetadata: {
                    localPath: relativeFilePath,
                    filename: fileName,
                    mimeType: mimeType,
                    size: buffer.length
                },
                labMetadata: labMetadata || {},
                notes: notes || '',
                uploadedBy: uploadedBy || ''
            };

            const report = await ReportService.create(reportData);

            console.log('Report uploaded:', report.fileMetadata.localPath);
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
