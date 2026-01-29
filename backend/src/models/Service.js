const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    suffix: {
        type: String,
        default: ''
    },
    hcpFee: {
        type: Number,
        default: 0.00
    },
    tFee: {
        type: Number,
        default: 0.00
    },
    pFee: {
        type: Number,
        default: 0.00
    },
    sFee: {
        type: Number,
        default: 0.00
    },
    nFeePercent: {
        type: Number,
        default: 0.00
    },
    diagReq: {
        type: String,
        default: 'N'
    },
    refD: {
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
    }
}, {
    timestamps: false,
    collection: 'services'
});

serviceSchema.index({ code: 1 });

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
