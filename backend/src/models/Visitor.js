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
        default: ''
    },
    middleName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    dateOfBirth: {
        type: String,
        default: ''
    },
    addressLine: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    province: {
        type: String,
        default: ''
    },
    postalCode: {
        type: String,
        default: ''
    },
    allergies: {
        type: String,
        default: ''
    },
    drugReactions: {
        type: String,
        default: ''
    },
    ongoingHealthConditions: {
        type: String,
        default: ''
    },
    specialNotes: {
        type: String,
        default: ''
    },
    highBloodPressure: { type: String, default: '' },
    heartDisease: { type: String, default: '' },
    diabetes: { type: String, default: '' },
    cholesterol: { type: String, default: '' },
    smoke: { type: String, default: '' },
    gender: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    phoneM: {
        type: String,
        default: ''
    },
    phoneB: {
        type: String,
        default: ''
    },
    phoneH: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    healthCardNumber: {
        type: String,
        default: ''
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
    emergencyName: {
        type: String,
        default: ''
    },
    emergencyRelation: {
        type: String,
        default: ''
    },
    emergencyPhone: {
        type: String,
        default: ''
    },
    /** ISO date of the visitor's most recent completed interaction (updated when an interaction is completed/closed). */
    lastVisitAt: {
        type: String,
        default: ''
    },
    isConfirmed: {
        type: Boolean,
        default: true
    },
    onboardingToken: {
        token: { type: String, default: '' },
        expiresAt: { type: String, default: '' },
        used: { type: Boolean, default: false }
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
// Remove the unique constraint on healthCardNumber because onboarding profiles might not have it yet.
// We will handle uniqueness in the service logic during confirmation/save.
visitorSchema.index({ healthCardNumber: 1 });

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
