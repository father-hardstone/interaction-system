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
    /** Unique billing serial per entity (1, 2, 3...). Set when interaction becomes closed. */
    accountingNumber: {
        type: String,
        default: ''
    },
    /** Fee type used when billing (hcp, t_fee, etc.). */
    billingType: {
        type: String,
        default: ''
    },
    // Interaction notes fields
    ccReason: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false },
        addedLaterSheetIndices: { type: [Number], default: undefined }
    },
    subjective: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false },
        addedLaterSheetIndices: { type: [Number], default: undefined }
    },
    objective: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false },
        addedLaterSheetIndices: { type: [Number], default: undefined }
    },
    assessmentPlan: {
        text: { type: String, default: '' },
        scratchpad: { type: String, default: '' },
        hasScratchpad: { type: Boolean, default: false },
        addedLaterSheetIndices: { type: [Number], default: undefined }
    },
    // Service lines array
    serviceLines: [{
        serialNumber: { type: Number, default: 1 },
        serviceDate: { type: String, default: '' },
        service: { type: String, default: '' },
        suffix: { type: String, default: 'A' },
        diagnostic: { type: String, default: '' },
        numberOf: { type: Number, default: 1 },
        totalFee: { type: Number, default: 0 },
        accountingNumber: { type: String, default: '' }
    }],
    referral: {
        type: { type: String, default: '' },
        reason: { type: String, default: '' },
        to: { type: String, default: '' },
        date: { type: String, default: '' },
        addedLater: { type: Boolean, default: false }
    },
    medications: [{
        name: { type: String, default: '' },
        dosage: { type: String, default: '' },
        suspension: { type: String, default: '' },
        frequency: { type: String, default: '' },
        duration: { type: String, default: '' },
        refills: { type: Number, default: 0 },
        instructions: { type: String, default: '' },
        addedLater: { type: Boolean, default: false }
    }],
    // Parent interaction: "does this require followup?" + link to child when registered
    followupRequired: {
        required: { type: Boolean, default: false },
        date: { type: String, default: '' },
        followupInteractionId: { type: String, default: '' },
        addedLater: { type: Boolean, default: false },
        intervalWeeks: { type: Number, default: null },
        intervalMonths: { type: Number, default: null }
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
    vitals: {
        systolic: { type: String, default: '' },
        diastolic: { type: String, default: '' },
        pulse: { type: String, default: '' },
        temperature: { type: String, default: '' }
    },
    /** Number of times this completed interaction was edited (for Notes "Edit (n)" heading). */
    editCount: {
        type: Number,
        default: 0
    },
    // Status flags and their timestamps (set when flag becomes true)
    started: {
        type: Boolean,
        default: false
    },
    startedAt: {
        type: String,
        default: ''
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: String,
        default: ''
    },
    closed: {
        type: Boolean,
        default: false
    },
    closedAt: {
        type: String,
        default: ''
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
    },
    billedAt: {
        type: String,
        default: ''
    },
    /** When true, billed claim has been submitted/filed for ministry (shown under Filed Claims). */
    ministryClaimFiled: {
        type: Boolean,
        default: false
    },
    /** Queue number for the day (resets at 8 AM). Deprecated: serial is now derived from queue order at display time. */
    temporarySerial: {
        type: Number,
        default: 0
    },
    /** When this registration was assigned to an officer (queued). Used for queue order. */
    queuedAt: {
        type: String,
        default: ''
    },
    /** Current status: registered | queued | ongoing | incomplete | complete | closed | billed | cancelled. Kept in sync with flags for easy filtering. */
    interactionStatus: {
        type: String,
        default: 'registered'
    },
    reasonForVisit: {
        type: String,
        default: ''
    },
    reasonForVisitNotes: {
        type: String,
        default: ''
    },
    /** Visit mode: 'physical' (in person) or 'on_phone'. */
    visitMode: {
        type: String,
        default: 'physical'
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    cancelledAt: {
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
