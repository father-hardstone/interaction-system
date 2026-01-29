const VisitorService = require('../services/VisitorService');
const { v4: uuidv4 } = require('uuid');
const EntityService = require('../services/EntityService');

class VisitorController {
    // Get all visitors for a specific entity
    async getVisitorsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            console.log('getVisitorsByEntity - entityId:', entityId);
            const all = await VisitorService.getAll();
            console.log('getVisitorsByEntity - total visitors:', all.length);
            console.log('getVisitorsByEntity - all visitors entityIds:', all.map(v => ({ id: v.id, entityId: v.entityId, serial: v.serial })));
            const filtered = all.filter(
                v => {
                    const matches = v.entityId === entityId && (!v.deletedAt || v.deletedAt === '');
                    console.log(`getVisitorsByEntity - visitor ${v.id}: entityId=${v.entityId}, matches=${matches}`);
                    return matches;
                }
            );
            console.log('getVisitorsByEntity - filtered visitors:', filtered.length);
            console.log('getVisitorsByEntity - filtered visitors data:', filtered);

            res.json(filtered);
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
                phoneH,
                email,
                healthCardNumber,
                healthCardVersion,
                healthCardEffectivityDate,
                healthCardExpiryDate,
                phoneM,
                notes,
                memo,
                guardianName,
                guardianId,
                guardianPhone
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

            // Validate required fields
            if (!entityId || !entitySerial || !firstName || !lastName || !dateOfBirth ||
                !addressLine || !city || !region || !gender || !phone || !healthCardNumber) {
                console.error('createVisitor - Missing required fields:', {
                    entityId, entitySerial, firstName, lastName, dateOfBirth,
                    addressLine, city, region, gender, phone, healthCardNumber
                });
                return res.status(400).json({ error: "Missing required fields" });
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
                return res.status(400).json({ error: "Expiry date cannot be earlier than effective date" });
            }

            // Guardian autofill
            let guardianNameFinal = guardianName || '';
            let guardianPhoneFinal = guardianPhone || '';
            if (guardianId) {
                const guardian = await VisitorService.findOne({ id: guardianId });
                if (guardian) {
                    guardianNameFinal = guardian.firstName ? `${guardian.firstName} ${guardian.lastName || ''}`.trim() : guardianNameFinal;
                    guardianPhoneFinal = guardian.phone || guardianPhoneFinal;
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
                phone: phone.trim(),
                phoneH: phoneH ? phoneH.trim() : '',
                phoneM: phoneM ? phoneM.trim() : '',
                email: email ? email.trim() : '',
                healthCardNumber: cleanHealthCard,
                healthCardVersion: healthCardVersion ? healthCardVersion.trim().toUpperCase() : '',
                healthCardEffectivityDate: healthCardEffectivityDate || '',
                healthCardExpiryDate: healthCardExpiryDate || '',
                notes: notes || '',
                memo: memo || '',
                guardianName: guardianNameFinal,
                guardianId: guardianId || '',
                guardianPhone: guardianPhoneFinal,
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

            await VisitorService.create(newVisitor);

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

            res.status(201).json(newVisitor);
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
                return res.status(400).json({ error: "Expiry date cannot be earlier than effective date" });
            }

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
