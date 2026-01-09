const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
    timestamps: false, // We're using custom createdAt/editedAt fields
    collection: 'admins'
});

// Indexes for better query performance
// Note: phone and serial already have unique indexes, so we only add non-unique indexes here
adminSchema.index({ active: 1 });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
