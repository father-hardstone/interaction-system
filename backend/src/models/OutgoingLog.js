const mongoose = require('mongoose');

const outgoingLogSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    entityId: { type: String, required: true, index: true },

    // Human-friendly serial per entity (incrementing). Keep both numeric + display for sorting/display.
    serialNumber: { type: Number, default: 0, index: true },
    serial: { type: String, default: '' },

    createdAt: { type: String, default: () => new Date().toISOString() },
    createdByUserId: { type: String, default: '' },
    createdByRole: { type: String, default: '' },

    interactionId: { type: String, default: '' },

    patientId: { type: String, default: '' },
    patientNameSnapshot: { type: String, default: '' },

    documentType: { type: String, default: 'prescription' }, // report | prescription | referral

    mode: { type: String, required: true }, // print | email | fax
    status: { type: String, default: 'logged' }, // queued | logged

    recipients: {
        patient: {
            email: { type: String, default: '' },
            fax: { type: String, default: '' }
        },
        institute: {
            instituteId: { type: String, default: '' },
            nameSnapshot: { type: String, default: '' },
            email: { type: String, default: '' },
            fax: { type: String, default: '' }
        }
    },

    prescription: {
        supabasePath: { type: String, default: '' }
    },

    referral: {
        supabasePath: { type: String, default: '' },
        formType: { type: String, default: '' } // e.g. 'lab_requisition'
    },

    notes: { type: String, default: '' }
}, {
    timestamps: false,
    collection: 'outgoing_logs'
});

outgoingLogSchema.index({ entityId: 1, createdAt: -1 });
outgoingLogSchema.index({ patientId: 1, createdAt: -1 });
outgoingLogSchema.index({ entityId: 1, serialNumber: -1 });

const OutgoingLog = mongoose.model('OutgoingLog', outgoingLogSchema);

module.exports = OutgoingLog;

