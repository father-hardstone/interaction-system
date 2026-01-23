const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    entityId: {
        type: String,
        required: true
    },
    patientId: {
        type: String,
        required: true
    },
    interactionId: {
        type: String,
        default: '' // Optional
    },
    reportType: {
        type: String,
        required: true // blood test, x-ray, ultrasound, CT, MRI, ECG, pathology, etc.
    },
    procedureDate: {
        type: String,
        required: true
    },
    reportGeneratedDate: {
        type: String,
        required: true
    },
    fileMetadata: {
        localPath: { type: String, required: true },
        filename: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true }
    },
    labMetadata: {
        labName: { type: String, default: '' },
        labAddress: { type: String, default: '' },
        externalReportId: { type: String, default: '' }
    },
    notes: {
        type: String,
        default: ''
    },
    uploadedBy: {
        type: String,
        default: ''
    },
    deletedAt: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    collection: 'reports'
});

reportSchema.index({ entityId: 1 });
reportSchema.index({ patientId: 1 });
reportSchema.index({ interactionId: 1 });
reportSchema.index({ patientId: 1, entityId: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
