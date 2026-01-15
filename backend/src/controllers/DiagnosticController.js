const DiagnosticService = require('../services/DiagnosticService');

class DiagnosticController {
    // Get all diagnostics
    async getAllDiagnostics(req, res) {
        try {
            const diagnostics = await DiagnosticService.getAll();
            res.json(diagnostics);
        } catch (e) {
            console.error('getAllDiagnostics error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get diagnostics by code
    async getDiagnosticsByCode(req, res) {
        try {
            const { code } = req.params;
            const diagnostics = await DiagnosticService.findByCode(code);
            res.json(diagnostics);
        } catch (e) {
            console.error('getDiagnosticsByCode error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new diagnostic
    async createDiagnostic(req, res) {
        try {
            const { code, description } = req.body;

            if (!code || !description) {
                return res.status(400).json({ error: 'Code and description are required' });
            }

            const now = new Date().toISOString();
            const newDiagnostic = {
                code: code.trim(),
                description: description.trim(),
                createdAt: now,
                editedAt: now
            };

            const created = await DiagnosticService.create(newDiagnostic);
            res.status(201).json(created);
        } catch (e) {
            console.error('createDiagnostic error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Update a diagnostic
    async updateDiagnostic(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Don't allow changing createdAt
            delete updates.createdAt;

            const updated = await DiagnosticService.update(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Diagnostic not found' });
            }

            res.json(updated);
        } catch (e) {
            console.error('updateDiagnostic error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Delete a diagnostic
    async deleteDiagnostic(req, res) {
        try {
            const { id } = req.params;
            const deleted = await DiagnosticService.delete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Diagnostic not found' });
            }
            res.json({ message: 'Diagnostic deleted' });
        } catch (e) {
            console.error('deleteDiagnostic error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Seed initial diagnostics
    async seedDiagnostics(req, res) {
        try {
            const diagnostics = await DiagnosticService.seedInitialDiagnostics();
            res.json({ message: 'Diagnostics seeded successfully', count: diagnostics.length, diagnostics });
        } catch (e) {
            console.error('seedDiagnostics error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new DiagnosticController();
