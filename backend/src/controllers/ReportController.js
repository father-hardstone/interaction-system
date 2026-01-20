const ReportService = require('../services/ReportService');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ReportController {
    // Get all reports for a visitor
    async getReportsByVisitor(req, res) {
        try {
            const { visitorId } = req.params;
            const reports = await ReportService.getByVisitor(visitorId);
            res.json(reports);
        } catch (error) {
            console.error('getReportsByVisitor error:', error);
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
                entitySerial, 
                visitorId, 
                visitorSerial, 
                interactionId, 
                interactionSerial,
                instituteName,
                fileData,
                fileName,
                fileType
            } = req.body;

            // Validate required fields
            if (!entityId || !entitySerial || !visitorId || !visitorSerial || !instituteName || !fileData || !fileName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Get next report number
            const reportNumber = await ReportService.getNextReportNumber(
                entityId, 
                visitorId, 
                interactionId || null
            );

            // Clean serials for filename (same logic as ImageController)
            const cleanEntitySerial = entitySerial.split('-')[0].replace(/^[A-Za-z]+/i, '').toLowerCase();
            const cleanVisitorSerial = visitorSerial.includes('-') 
                ? visitorSerial.split('-').pop().replace(/^[A-Za-z]+/i, '').toLowerCase()
                : visitorSerial.replace(/^[A-Za-z]+/i, '').toLowerCase();
            
            let filename;
            let fileExtension = path.extname(fileName).toLowerCase() || (fileType === 'pdf' ? '.pdf' : '.png');
            
            if (interactionId && interactionSerial) {
                // Associated with interaction: e2-v3-i2-R1.pdf
                const cleanInteractionSerial = interactionSerial.includes('-')
                    ? interactionSerial.split('-').pop().replace(/^[A-Za-z]+/i, '').toLowerCase()
                    : interactionSerial.replace(/^[A-Za-z]+/i, '').toLowerCase();
                filename = `${cleanEntitySerial}-${cleanVisitorSerial}-${cleanInteractionSerial}-R${reportNumber}${fileExtension}`;
            } else {
                // Independent upload: e2-v3-R1.pdf
                filename = `${cleanEntitySerial}-${cleanVisitorSerial}-R${reportNumber}${fileExtension}`;
            }

            // Create reports directory if it doesn't exist
            const reportsDir = path.join(__dirname, '../../uploads/reports');
            await fs.mkdir(reportsDir, { recursive: true });

            // Handle file data (base64)
            let buffer;
            if (fileData.startsWith('data:')) {
                // Base64 data URL
                const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                // Assume it's already base64
                buffer = Buffer.from(fileData, 'base64');
            }

            // Save file
            const filePath = path.join(reportsDir, filename);
            await fs.writeFile(filePath, buffer);

            // Create report record
            const reportId = uuidv4();
            const reportData = {
                id: reportId,
                entityId,
                entitySerial,
                visitorId,
                visitorSerial,
                interactionId: interactionId || '',
                interactionSerial: interactionSerial || '',
                instituteName,
                filePath: `uploads/reports/${filename}`,
                fileName: filename,
                fileType: fileType || (fileExtension === '.pdf' ? 'pdf' : 'image'),
                reportNumber,
                uploadedAt: new Date().toISOString()
            };

            const report = await ReportService.create(reportData);

            console.log('Report uploaded:', report.filePath);
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
