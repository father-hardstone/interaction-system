const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    interactionSerial: {
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
    visitorId: {
        type: String,
        required: true
    },
    visitorSerial: {
        type: String,
        required: true
    },
    officerId: {
        type: String,
        default: ''
    },
    officerSerial: {
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
    collection: 'interactions'
});

interactionSchema.index({ entityId: 1 });
interactionSchema.index({ visitorId: 1 });
interactionSchema.index({ officerId: 1 });
interactionSchema.index({ interactionSerial: 1 });

const Interaction = mongoose.model('Interaction', interactionSchema);

module.exports = Interaction;
