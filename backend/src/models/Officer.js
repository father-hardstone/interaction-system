const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    serial: {
        type: String,
        required: true
    },
    entityId: {
        type: String,
        required: true
    },
    entitySerial: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    billingNumber: {
        type: String,
        default: ''
    },
    cpsoNumber: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    active: {
        type: String,
        default: 'true',
        enum: ['true', 'false']
    },
    approved: {
        type: String,
        default: 'false',
        enum: ['true', 'false']
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    editedAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    deletedAt: {
        type: String,
        default: ''
    }
}, {
    timestamps: false,
    collection: 'officers'
});

officerSchema.index({ entityId: 1 });
officerSchema.index({ serial: 1 });
officerSchema.index({ phone: 1 });
officerSchema.index({ active: 1 });

const Officer = mongoose.model('Officer', officerSchema);

module.exports = Officer;
