const { v4: uuidv4 } = require('uuid');
const OutgoingLog = require('../models/OutgoingLog');
const Institute = require('../models/Institute');

function getEntityIdFromUser(user) {
    if (!user) return '';
    if (user.role === 'entity') return user.id || '';
    return user.entityId || '';
}

function normalizeStr(v) {
    if (v == null) return '';
    return String(v).trim();
}

async function getNextOutgoingSerial(entityId) {
    // Find max serialNumber for entity; fallback to 0.
    const last = await OutgoingLog.findOne({ entityId })
        .sort({ serialNumber: -1, createdAt: -1 })
        .select('serialNumber')
        .lean();
    const max = last?.serialNumber ? parseInt(last.serialNumber, 10) : 0;
    const next = isNaN(max) ? 1 : max + 1;
    const serial = String(next).padStart(6, '0');
    return { serialNumber: next, serial };
}

class OutgoingLogController {
    async listByEntity(req, res) {
        try {
            const { entityId } = req.params;
            const userEntityId = getEntityIdFromUser(req.user);
            if (!userEntityId || userEntityId !== entityId) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
            const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

            const [items, total] = await Promise.all([
                OutgoingLog.find({ entityId })
                    .sort({ createdAt: -1 })
                    .skip(offset)
                    .limit(limit)
                    .lean(),
                OutgoingLog.countDocuments({ entityId })
            ]);

            res.json({
                items: items || [],
                total,
                limit,
                offset
            });
        } catch (e) {
            console.error('OutgoingLogController.listByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    async create(req, res) {
        try {
            const userEntityId = getEntityIdFromUser(req.user);
            if (!userEntityId) return res.status(401).json({ error: 'Unauthenticated' });

            const {
                interactionId = '',
                patientId = '',
                patientNameSnapshot = '',
                prescription = {},
                referral = {},
                documentType = 'prescription',
                mode,
                recipients = {},
                notes = ''
            } = req.body || {};

            const normalizedMode = normalizeStr(mode).toLowerCase();
            if (!['print', 'email', 'fax'].includes(normalizedMode)) {
                return res.status(400).json({ error: 'Invalid mode' });
            }

            const normalizedDocType = normalizeStr(documentType).toLowerCase();
            const allowedDocTypes = ['report', 'prescription', 'referral'];
            if (!allowedDocTypes.includes(normalizedDocType)) {
                return res.status(400).json({ error: 'Invalid documentType' });
            }

            const recPatient = recipients?.patient || {};
            const recInstitute = recipients?.institute || {};

            let instituteSnapshot = {
                instituteId: normalizeStr(recInstitute.instituteId),
                nameSnapshot: normalizeStr(recInstitute.nameSnapshot),
                email: normalizeStr(recInstitute.email),
                fax: normalizeStr(recInstitute.fax)
            };

            // If instituteId is provided, snapshot its current details (for historical accuracy).
            if (instituteSnapshot.instituteId) {
                const inst = await Institute.findOne({ id: instituteSnapshot.instituteId, entityId: userEntityId }).lean();
                if (inst) {
                    instituteSnapshot = {
                        instituteId: inst.id,
                        nameSnapshot: normalizeStr(inst.name),
                        email: normalizeStr(inst.email),
                        fax: normalizeStr(inst.fax)
                    };
                }
            }

            const now = new Date().toISOString();
            const nextSerial = await getNextOutgoingSerial(userEntityId);
            const doc = await OutgoingLog.create({
                id: uuidv4(),
                entityId: userEntityId,
                serialNumber: nextSerial.serialNumber,
                serial: nextSerial.serial,
                createdAt: now,
                createdByUserId: normalizeStr(req.user?.id),
                createdByRole: normalizeStr(req.user?.role),
                interactionId: normalizeStr(interactionId),
                patientId: normalizeStr(patientId),
                patientNameSnapshot: normalizeStr(patientNameSnapshot),
                documentType: normalizedDocType,
                mode: normalizedMode,
                status: 'logged',
                recipients: {
                    patient: {
                        email: normalizeStr(recPatient.email),
                        fax: normalizeStr(recPatient.fax)
                    },
                    institute: instituteSnapshot
                },
                prescription: {
                    supabasePath: normalizeStr(prescription?.supabasePath)
                },
                referral: {
                    supabasePath: normalizeStr(referral?.supabasePath),
                    formType: normalizeStr(referral?.formType)
                },
                notes: normalizeStr(notes)
            });

            res.status(201).json(doc.toObject());
        } catch (e) {
            console.error('OutgoingLogController.create error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new OutgoingLogController();

