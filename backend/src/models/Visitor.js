const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true // 6-digit numeric string
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
    province: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
        default: ''
    },
    allergies: {
        type: String,
        default: 'N/A'
    },
    drugReactions: {
        type: String,
        default: 'N/A'
    },
    ongoingHealthConditions: {
        type: String,
        default: 'N/A'
    },
    specialNotes: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    phoneH: {
        type: String,
        default: ''
    },
    phoneM: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    healthCardNumber: {
        type: String,
        required: true
    },
    healthCardVersion: {
        type: String,
        default: ''
    },
    healthCardEffectivityDate: {
        type: String,
        default: ''
    },
    healthCardExpiryDate: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    memo: {
        type: String,
        default: ''
    },
    guardianName: {
        type: String,
        default: ''
    },
    guardianId: {
        type: String,
        default: ''
    },
    guardianPhone: {
        type: String,
        default: ''
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
visitorSchema.index({ healthCardNumber: 1 }, { unique: true });

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
