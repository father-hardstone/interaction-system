const VisitorService = require('../services/VisitorService');
const InteractionService = require('../services/InteractionService');
const { v4: uuidv4 } = require('uuid');

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
                state,
                gender,
                phone,
                email,
                idCardNumber
            } = req.body;

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
                !addressLine || !city || !state || !gender || !phone || !idCardNumber) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            // Validate entitySerial starts with 'E'
            if (!entitySerial.startsWith('E')) {
                console.error('createVisitor - Invalid entitySerial format:', entitySerial);
                return res.status(400).json({ error: "Invalid entity serial format. Must start with 'E'" });
            }

            // Validate ID card number format (should be 10 digits, we'll format it)
            const cleanIdCard = idCardNumber.replace(/-/g, '');
            if (cleanIdCard.length !== 10 || !/^\d+$/.test(cleanIdCard)) {
                return res.status(400).json({ error: "ID card number must be exactly 10 digits" });
            }

            // Format ID card number with dashes (1234-5678-90)
            const formattedIdCard = `${cleanIdCard.substring(0, 4)}-${cleanIdCard.substring(4, 8)}-${cleanIdCard.substring(8, 10)}`;

            const now = new Date().toISOString();
            // Get composite serial (e.g., E1-V1, E1-V2, etc.)
            const serial = await VisitorService.getNextSerialForEntity(entitySerial);

            const newVisitor = {
                id: uuidv4(),
                serial,
                entityId,
                entitySerial,
                firstName: firstName.trim(),
                middleName: middleName ? middleName.trim() : '',
                lastName: lastName.trim(),
                dateOfBirth,
                addressLine: addressLine.trim(),
                city: city.trim(),
                state: state.trim(),
                gender: gender.trim(),
                phone: phone.trim(),
                email: email ? email.trim() : '',
                idCardNumber: formattedIdCard,
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

            // Create interaction for this visitor
            // ID is UUID, serial is composite (E1-V1-I1)
            const interactionSerial = await InteractionService.getNextSerialForEntity(entitySerial, serial);
            const newInteraction = {
                id: uuidv4(), // UUID for id
                interactionSerial, // Composite: E1-V1-I1
                entityId,
                entitySerial,
                visitorId: newVisitor.id,
                visitorSerial: serial, // Store full composite serial
                officerId: '', // Will be assigned later by receptionist
                officerSerial: '', // Will be assigned later by receptionist
                createdAt: now,
                editedAt: now,
                deletedAt: ''
            };
            await InteractionService.create(newInteraction);

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

            // Format ID card if provided
            if (updates.idCardNumber) {
                const cleanIdCard = updates.idCardNumber.replace(/-/g, '');
                if (cleanIdCard.length !== 10 || !/^\d+$/.test(cleanIdCard)) {
                    return res.status(400).json({ error: "ID card number must be exactly 10 digits" });
                }
                updates.idCardNumber = `${cleanIdCard.substring(0, 4)}-${cleanIdCard.substring(4, 8)}-${cleanIdCard.substring(8, 10)}`;
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
}

module.exports = new VisitorController();
