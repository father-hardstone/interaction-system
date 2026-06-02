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
        default: ''
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
    profilePicture: {
        type: String,
        default: ''
    },
    icon: {
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
    collection: 'entities'
});

// Note: serial already has a unique index; phone is optional and not unique
entitySchema.index({ active: 1 });
entitySchema.index({ approved: 1 });

const Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;
