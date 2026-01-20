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
    entitySerial: {
        type: String,
        required: true
    },
    visitorId: {
        type: String,
        required: true
    },
    visitorSerial: {
        type: String,
        required: true
    },
    interactionId: {
        type: String,
        default: '' // Optional - can be empty if uploaded independently
    },
    interactionSerial: {
        type: String,
        default: '' // Optional - can be empty if uploaded independently
    },
    instituteName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true // 'pdf', 'image', etc.
    },
    reportNumber: {
        type: Number,
        required: true // R1, R2, etc. - the suffix number
    },
    uploadedAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    uploadedBy: {
        type: String,
        default: '' // Can store user ID or role
    },
    deletedAt: {
        type: String,
        default: ''
    }
}, {
    timestamps: false,
    collection: 'reports'
});

reportSchema.index({ entityId: 1 });
reportSchema.index({ visitorId: 1 });
reportSchema.index({ interactionId: 1 });
reportSchema.index({ visitorId: 1, entityId: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
