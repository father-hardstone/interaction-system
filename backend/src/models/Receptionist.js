const mongoose = require('mongoose');

const receptionistSchema = new mongoose.Schema({
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
    collection: 'receptionists'
});

receptionistSchema.index({ entityId: 1 });
receptionistSchema.index({ serial: 1 });
receptionistSchema.index({ phone: 1 });
receptionistSchema.index({ active: 1 });

const Receptionist = mongoose.model('Receptionist', receptionistSchema);

module.exports = Receptionist;
