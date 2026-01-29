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
    },
    // Interaction notes fields
    ccReason: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false }
    },
    subjective: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false }
    },
    objective: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false }
    },
    assessmentPlan: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false }
    },
    // Service lines array
    serviceLines: [{
        serialNumber: { type: Number, default: 1 },
        service: { type: String, default: '' },
        suffix: { type: String, default: '' },
        diagnostic: { type: String, default: '' },
        totalFee: { type: Number, default: 0 },
        accountingNumber: { type: String, default: '' }
    }],
    referral: {
        type: { type: String, default: '' },
        reason: { type: String, default: '' },
        to: { type: String, default: '' },
        date: { type: String, default: '' }
    },
    medications: [{
        name: { type: String, default: '' },
        dosage: { type: String, default: '' },
        suspension: { type: String, default: '' },
        frequency: { type: String, default: '' },
        duration: { type: String, default: '' },
        refills: { type: Number, default: 0 },
        instructions: { type: String, default: '' }
    }],
    // Parent interaction: "does this require followup?" + link to child when registered
    followupRequired: {
        required: { type: Boolean, default: false },
        date: { type: String, default: '' },
        followupInteractionId: { type: String, default: '' }
    },
    // Child (followup) interaction: "this is a followup" + link to parent
    followup: {
        isFollowup: { type: Boolean, default: false },
        parentInteractionId: { type: String, default: '' }
    },
    savedNotes: [{
        text: { type: String, default: '' },
        timestamp: { type: String, default: '' }
    }],
    // Status flags
    started: {
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    closed: {
        type: Boolean,
        default: false
    },
    ongoing: {
        type: Boolean,
        default: false
    },
    incomplete: {
        type: Boolean,
        default: false
    },
    billed: {
        type: Boolean,
        default: false
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
