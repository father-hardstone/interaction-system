const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    entityId: { type: String, required: true, index: true },

    name: { type: String, required: true },
    type: { type: String, default: 'other' }, // pharmacy | lab | other

    email: { type: String, default: '' },
    fax: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },

    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
    timestamps: false,
    collection: 'institutes'
});

instituteSchema.index({ entityId: 1, name: 1 });

const Institute = mongoose.model('Institute', instituteSchema);

module.exports = Institute;

