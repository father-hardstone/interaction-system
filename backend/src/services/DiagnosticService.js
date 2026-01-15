const Diagnostic = require('../models/Diagnostic');

class DiagnosticService {
    async getAll() {
        const diagnostics = await Diagnostic.find({});
        return diagnostics.map(d => d.toObject());
    }

    async create(data) {
        const diagnostic = new Diagnostic(data);
        await diagnostic.save();
        return diagnostic.toObject();
    }

    async findOne(query) {
        const diagnostic = await Diagnostic.findOne(query);
        return diagnostic ? diagnostic.toObject() : null;
    }

    async findByCode(code) {
        const diagnostics = await Diagnostic.find({ code });
        return diagnostics.map(d => d.toObject());
    }

    async update(id, updates) {
        updates.editedAt = new Date().toISOString();
        const diagnostic = await Diagnostic.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        );
        return diagnostic ? diagnostic.toObject() : null;
    }

    async delete(id) {
        const diagnostic = await Diagnostic.findByIdAndDelete(id);
        return diagnostic ? diagnostic.toObject() : null;
    }

    // Seed initial diagnostics (first 10 entries, codes up to 010)
    async seedInitialDiagnostics() {
        const existingDiagnostics = await this.getAll();
        if (existingDiagnostics.length > 0) {
            console.log('Diagnostics already seeded, skipping...');
            return existingDiagnostics;
        }

        const initialDiagnostics = [
            {
                code: '002',
                description: 'TYPHOID AND PARATYPHOID FEVERS'
            },
            {
                code: '002',
                description: 'PARATYPHOID FEVER'
            },
            {
                code: '003',
                description: 'SALMONELLA INFECTIONS, OTHER'
            },
            {
                code: '005',
                description: 'FOOD POISONING'
            },
            {
                code: '006',
                description: 'AMEBIASIS, AMEBIC DYSENTRY'
            },
            {
                code: '006',
                description: 'AMEBIASIS'
            },
            {
                code: '006',
                description: 'AMOEBIASIS, AMOEBIC DYSENTERY'
            },
            {
                code: '006',
                description: 'DYSENTERY'
            },
            {
                code: '009',
                description: 'DIARRHEA, GASTRO-ENTERITIS, VIRAL GASTRO-ENTERITIS'
            },
            {
                code: '010',
                description: 'PRIMARY TUBERCULOUS INFECTION INCLUDING RECENT POSITIVE TB SKIN TEST'
            }
        ];

        const created = [];
        for (const diagnosticData of initialDiagnostics) {
            const diagnostic = await this.create(diagnosticData);
            created.push(diagnostic);
        }

        console.log(`Seeded ${created.length} initial diagnostics`);
        return created;
    }
}

module.exports = new DiagnosticService();
