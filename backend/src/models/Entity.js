const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    serial: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        default: '123456'
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
    patientIds: {
        type: [String],
        default: []
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
    collection: 'entities'
});

// Note: phone and serial already have unique indexes, so we only add non-unique indexes here
entitySchema.index({ active: 1 });
entitySchema.index({ approved: 1 });

const Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;
