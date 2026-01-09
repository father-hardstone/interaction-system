const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
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
    firstName: {
        type: String,
        required: true
    },
    middleName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: String,
        required: true
    },
    addressLine: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    gender: {
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
    idCardNumber: {
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
    },
    deletedAt: {
        type: String,
        default: ''
    }
}, {
    timestamps: false,
    collection: 'visitors'
});

visitorSchema.index({ entityId: 1 });
visitorSchema.index({ serial: 1 });
visitorSchema.index({ phone: 1 });
visitorSchema.index({ idCardNumber: 1 });

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
