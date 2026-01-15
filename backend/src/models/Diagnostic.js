const mongoose = require('mongoose');

const diagnosticSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    editedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
}, {
    timestamps: false,
    collection: 'diagnostics'
});

diagnosticSchema.index({ code: 1 });

const Diagnostic = mongoose.model('Diagnostic', diagnosticSchema);

module.exports = Diagnostic;
