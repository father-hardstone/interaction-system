const VisitorService = require('../services/VisitorService');
const InteractionService = require('../services/InteractionService');
const { v4: uuidv4 } = require('uuid');
const EntityService = require('../services/EntityService');

class VisitorController {
    // Get patient count for an entity (efficient - no full document fetch)
    async getCountByEntity(req, res) {
        try {
            const { entityId } = req.params;
            const count = await VisitorService.getCountByEntity(entityId);
            res.json({ count });
        } catch (e) {
            console.error('getCountByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get all visitors for a specific entity (each visitor includes stillInService: true if they have an active/incomplete interaction)
    async getVisitorsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            console.log('getVisitorsByEntity - entityId:', entityId);
            const all = await VisitorService.getAll();
            console.log('getVisitorsByEntity - total visitors:', all.length);
            const filtered = all.filter(
                v => v.entityId === entityId && (!v.deletedAt || v.deletedAt === '')
            );
            // Visitor IDs that have at least one non-completed, non-cancelled interaction (still in service)
            const activeInteractions = await InteractionService.findMany({
                entityId,
                deletedAt: '',
                completed: false
            });
            const stillInServiceSet = new Set(
                (activeInteractions || [])
                    .filter(i => !i.cancelled)
                    .map(i => i.visitorId)
                    .filter(Boolean)
            );
            const withFlags = filtered.map(v => ({
                ...v,
                stillInService: stillInServiceSet.has(v.id)
            }));
            console.log('getVisitorsByEntity - filtered visitors:', withFlags.length);

            res.json(withFlags);
        } catch (e) {
            console.error('getVisitorsByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new visitor
    async createVisitor(req, res) {
        try {
            const {
                entityId,
                entitySerial,
                firstName,
                middleName,
                lastName,
                dateOfBirth,
                addressLine,
                city,
                province,
                state, // Accept state as alias for province
                postalCode,
                gender,
                phone,
                phoneM,
                phoneB,
                phoneH,
                email,
                healthCardNumber,
                healthCardVersion,
                healthCardEffectivityDate,
                healthCardExpiryDate,
                notes,
                memo,
                guardianName,
                guardianId,
                guardianPhone,
                emergencyName,
                emergencyRelation,
                emergencyPhone,
                allergies,
                drugReactions,
                ongoingHealthConditions,
                specialNotes,
                highBloodPressure,
                heartDisease,
                diabetes,
                cholesterol,
                smoke
            } = req.body;

            // Normalize province/state
            const region = province || state;

            console.log('createVisitor - Received data:', {
                entityId,
                entitySerial,
                firstName,
                lastName,
                phone,
                email: email ? email.substring(0, 10) + '...' : 'missing'
            });

            // At least one phone required: phoneM (mobile) or legacy phone
            const mobile = (phoneM != null && String(phoneM).trim()) ? String(phoneM).trim() : (phone != null && String(phone).trim()) ? String(phone).trim() : '';
            if (!entityId || !entitySerial || !firstName || !lastName || !dateOfBirth ||
                !addressLine || !city || !region || !gender || !healthCardNumber) {
                console.error('createVisitor - Missing required fields:', {
                    entityId, entitySerial, firstName, lastName, dateOfBirth,
                    addressLine, city, region, gender, healthCardNumber
                });
                return res.status(400).json({ error: "Missing required fields" });
            }
            if (!mobile) {
                return res.status(400).json({ error: "Phone (M) is required" });
            }

            // Validate entitySerial starts with 'E'
            if (!entitySerial.startsWith('E')) {
                console.error('createVisitor - Invalid entitySerial format:', entitySerial);
                return res.status(400).json({ error: "Invalid entity serial format. Must start with 'E'" });
            }

            // Validate health card number format (should be 10 digits, no dashes stored)
            const cleanHealthCard = healthCardNumber.replace(/-/g, '');
            if (cleanHealthCard.length !== 10 || !/^\d+$/.test(cleanHealthCard)) {
                return res.status(400).json({ error: "Health card number must be exactly 10 digits" });
            }

            // Health card version: max 2 alphabetic
            if (healthCardVersion && !/^[A-Za-z]{1,2}$/.test(healthCardVersion.trim())) {
                return res.status(400).json({ error: "Health card version must be 1-2 alphabetic characters" });
            }

            // Postal code: Canadian mask A1B-2C3
            if (postalCode && postalCode.trim().length > 0) {
                const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
                if (!postalMask.test(postalCode.trim())) {
                    return res.status(400).json({ error: "Postal code must be in format A1B-2C3" });
                }
            }

            // Dates: ensure expiry >= effectivity if both provided
            const parseDate = (val) => (val ? new Date(val) : null);
            const effDate = parseDate(healthCardEffectivityDate);
            const expDate = parseDate(healthCardExpiryDate);
            if (effDate && expDate && expDate < effDate) {
                return res.status(400).json({ error: "Expiry date cannot be earlier than issue date" });
            }

            // Guardian autofill
            let guardianNameFinal = guardianName || '';
            let guardianPhoneFinal = guardianPhone || '';
            if (guardianId) {
                const guardian = await VisitorService.findOne({ id: guardianId });
                if (guardian) {
                    guardianNameFinal = guardian.firstName ? `${guardian.firstName} ${guardian.lastName || ''}`.trim() : guardianNameFinal;
                    guardianPhoneFinal = guardian.phoneM || guardian.phone || guardianPhoneFinal;
                }
            }

            const now = new Date().toISOString();
            // Generate UUID for visitor ID
            const visitorId = uuidv4();
            // Get 6-digit serial number
            const serial = await VisitorService.getNextSerialForEntity(entityId);

            const newVisitor = {
                id: visitorId,
                serial,
                entityId,
                entitySerial,
                firstName: firstName.trim(),
                middleName: middleName ? middleName.trim() : '',
                lastName: lastName.trim(),
                dateOfBirth,
                addressLine: addressLine.trim(),
                city: city.trim(),
                province: region.trim(),
                postalCode: postalCode ? postalCode.trim() : '',
                gender: gender.trim(),
                phone: '', // legacy; only phoneM, phoneB, phoneH are used
                phoneM: mobile,
                phoneB: (phoneB != null && String(phoneB).trim()) ? String(phoneB).trim() : '',
                phoneH: (phoneH != null && String(phoneH).trim()) ? String(phoneH).trim() : '',
                email: email ? email.trim() : '',
                healthCardNumber: cleanHealthCard,
                healthCardVersion: healthCardVersion ? healthCardVersion.trim().toUpperCase() : '',
                healthCardEffectivityDate: healthCardEffectivityDate || '',
                healthCardExpiryDate: healthCardExpiryDate || '',
                notes: notes || '',
                memo: memo || '',
                // Clinical and past-medical: use req.body so they are never dropped
                allergies: (() => { const v = req.body.allergies != null ? String(req.body.allergies).trim() : ''; return v && v.toUpperCase() !== 'N/A' ? v : ''; })(),
                drugReactions: (() => { const v = req.body.drugReactions != null ? String(req.body.drugReactions).trim() : ''; return v && v.toUpperCase() !== 'N/A' ? v : ''; })(),
                ongoingHealthConditions: (() => { const v = req.body.ongoingHealthConditions != null ? String(req.body.ongoingHealthConditions).trim() : ''; return v && v.toUpperCase() !== 'N/A' ? v : ''; })(),
                specialNotes: (req.body.specialNotes != null && String(req.body.specialNotes).trim()) ? String(req.body.specialNotes).trim() : '',
                highBloodPressure: (req.body.highBloodPressure === 'yes' || req.body.highBloodPressure === 'no') ? req.body.highBloodPressure : '',
                heartDisease: (req.body.heartDisease === 'yes' || req.body.heartDisease === 'no') ? req.body.heartDisease : '',
                diabetes: (req.body.diabetes === 'yes' || req.body.diabetes === 'no') ? req.body.diabetes : '',
                cholesterol: (req.body.cholesterol === 'yes' || req.body.cholesterol === 'no') ? req.body.cholesterol : '',
                smoke: (req.body.smoke === 'yes' || req.body.smoke === 'no') ? req.body.smoke : '',
                guardianName: guardianNameFinal,
                guardianId: guardianId || '',
                guardianPhone: guardianPhoneFinal,
                emergencyName: (emergencyName && String(emergencyName).trim()) ? String(emergencyName).trim() : '',
                emergencyRelation: (emergencyRelation && String(emergencyRelation).trim()) ? String(emergencyRelation).trim() : '',
                emergencyPhone: (emergencyPhone && String(emergencyPhone).trim()) ? String(emergencyPhone).trim() : '',
                createdAt: now,
                editedAt: now,
                deletedAt: ''
            };

            console.log('createVisitor - Creating visitor:', {
                serial,
                entityId,
                entitySerial,
                name: `${firstName} ${lastName}`
            });

            const saved = await VisitorService.create(newVisitor);

            // push patient id into entity.patientIds
            try {
                const entity = await EntityService.findOne({ id: entityId });
                if (entity) {
                    const updatedList = Array.isArray(entity.patientIds) ? [...entity.patientIds, visitorId] : [visitorId];
                    await EntityService.update(entityId, { patientIds: updatedList });
                }
            } catch (err) {
                console.warn('Failed to update entity patientIds', err.message);
            }

            res.status(201).json(saved);
        } catch (e) {
            console.error('createVisitor error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Update a visitor
    async updateVisitor(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Don't allow changing certain fields
            delete updates.id;
            delete updates.serial;
            delete updates.entityId;
            delete updates.entitySerial;
            delete updates.createdAt;

            // Format/validate health card if provided
            if (updates.healthCardNumber) {
                const cleanHealthCard = updates.healthCardNumber.replace(/-/g, '');
                if (cleanHealthCard.length !== 10 || !/^\d+$/.test(cleanHealthCard)) {
                    return res.status(400).json({ error: "Health card number must be exactly 10 digits" });
                }
                updates.healthCardNumber = cleanHealthCard;
            }

            // Version alpha 1-2 chars
            if (updates.healthCardVersion) {
                if (!/^[A-Za-z]{1,2}$/.test(updates.healthCardVersion.trim())) {
                    return res.status(400).json({ error: "Health card version must be 1-2 alphabetic characters" });
                }
                updates.healthCardVersion = updates.healthCardVersion.trim().toUpperCase();
            }

            // Postal code mask
            if (updates.postalCode) {
                const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
                if (!postalMask.test(updates.postalCode.trim())) {
                    return res.status(400).json({ error: "Postal code must be in format A1B-2C3" });
                }
            }

            // Dates: ensure expiry >= effectivity
            const parseDate = (val) => (val ? new Date(val) : null);
            const effDate = parseDate(updates.healthCardEffectivityDate);
            const expDate = parseDate(updates.healthCardExpiryDate);
            if (effDate && expDate && expDate < effDate) {
                return res.status(400).json({ error: "Expiry date cannot be earlier than issue date" });
            }

            // Always apply red-zone (clinical) fields from body so they are never dropped (optional; never force 'N/A')
            const red = (v) => {
                if (v === undefined || v === null) return '';
                const s = String(v).trim();
                if (!s) return '';
                return s.toUpperCase() === 'N/A' ? '' : s;
            };
            updates.allergies = red(req.body.allergies);
            updates.drugReactions = red(req.body.drugReactions);
            updates.ongoingHealthConditions = red(req.body.ongoingHealthConditions);
            updates.specialNotes = (req.body.specialNotes !== undefined && req.body.specialNotes !== null)
                ? String(req.body.specialNotes).trim() : '';

            // Past medical history (yes/no)
            const pmh = (v) => (v === 'yes' || v === 'no' ? v : '');
            if (req.body.highBloodPressure !== undefined) updates.highBloodPressure = pmh(req.body.highBloodPressure);
            if (req.body.heartDisease !== undefined) updates.heartDisease = pmh(req.body.heartDisease);
            if (req.body.diabetes !== undefined) updates.diabetes = pmh(req.body.diabetes);
            if (req.body.cholesterol !== undefined) updates.cholesterol = pmh(req.body.cholesterol);
            if (req.body.smoke !== undefined) updates.smoke = pmh(req.body.smoke);

            // Three distinct phones: M (mobile), B (business), H (home). Do not use legacy phone.
            const opt = (v) => (v !== undefined && v !== null ? String(v).trim() : undefined);
            if (req.body.phoneM !== undefined) {
                const m = opt(req.body.phoneM) || '';
                if (!m) return res.status(400).json({ error: "Phone (M) is required" });
                updates.phoneM = m;
                updates.phone = '';
            }
            if (req.body.phoneB !== undefined) updates.phoneB = opt(req.body.phoneB) || '';
            if (req.body.phoneH !== undefined) updates.phoneH = opt(req.body.phoneH) || '';
            if (req.body.email !== undefined) updates.email = opt(req.body.email) || '';
            if (req.body.guardianName !== undefined) updates.guardianName = opt(req.body.guardianName) || '';
            if (req.body.guardianPhone !== undefined) updates.guardianPhone = opt(req.body.guardianPhone) || '';
            if (req.body.emergencyName !== undefined) updates.emergencyName = opt(req.body.emergencyName) || '';
            if (req.body.emergencyRelation !== undefined) updates.emergencyRelation = opt(req.body.emergencyRelation) || '';
            if (req.body.emergencyPhone !== undefined) updates.emergencyPhone = opt(req.body.emergencyPhone) || '';
            if (req.body.notes !== undefined) updates.notes = opt(req.body.notes) || '';
            if (req.body.memo !== undefined) updates.memo = opt(req.body.memo) || '';
            if (req.body.guardianId !== undefined) updates.guardianId = opt(req.body.guardianId) || '';

            // Guardian autofill if guardianId provided
            if (updates.guardianId) {
                const guardian = await VisitorService.findOne({ id: updates.guardianId });
                if (guardian) {
                    updates.guardianName = guardian.firstName ? `${guardian.firstName} ${guardian.lastName || ''}`.trim() : (updates.guardianName || '');
                    updates.guardianPhone = guardian.phone || updates.guardianPhone || '';
                }
            }

            updates.editedAt = new Date().toISOString();

            const updated = await VisitorService.update(id, updates);
            if (!updated) return res.status(404).json({ error: "Visitor not found" });

            res.json(updated);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Delete a visitor (soft delete)
    async deleteVisitor(req, res) {
        try {
            const { id } = req.params;
            const success = await VisitorService.delete(id);
            if (!success) return res.status(404).json({ error: "Visitor not found" });
            res.json({ message: "Visitor deleted" });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    // Get next serial for an entity
    async getNextSerial(req, res) {
        try {
            const { entityId } = req.params;
            const serial = await VisitorService.getNextSerialForEntity(entityId);
            res.json({ serial });
        } catch (e) {
            console.error('getNextSerial error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new VisitorController();
