const InteractionService = require('../services/InteractionService');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

/** Queue day starts at 8 AM server local time. Returns that boundary as ISO string. */
function getQueueDayStart() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0, 0);
    if (now < start) start.setDate(start.getDate() - 1);
    return start.toISOString();
}

class InteractionController {
    // Get all interactions for a specific entity
    async getInteractionsByEntity(req, res) {
        try {
            const { entityId } = req.params;
            const { filter } = req.query; // 'today', 'older', 'all'
            console.log('getInteractionsByEntity - entityId:', entityId, 'filter:', filter);

            const query = {
                entityId,
                deletedAt: ''
            };

            if (filter === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query.createdAt = { $gte: today.toISOString() };
            } else if (filter === 'older') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query.createdAt = { $lt: today.toISOString() };
            }

            const filtered = await InteractionService.findMany(query);
            const visitorIds = [...new Set((filtered || []).map(i => i.visitorId).filter(Boolean))];
            const lastVisits = await InteractionService.getLastCompletedByVisitor(entityId, visitorIds);
            console.log('getInteractionsByEntity - filtered interactions:', filtered.length, 'lastVisits keys:', Object.keys(lastVisits).length);

            res.json({ interactions: filtered, lastVisits });
        } catch (e) {
            console.error('getInteractionsByEntity error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Update interaction to assign/unassign officer (receptionist only)
    async assignOfficer(req, res) {
        try {
            const { id } = req.params;
            const { officerId, officerSerial } = req.body;

            // Get token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);
            let decoded;
            try {
                decoded = jwt.verify(token, SECRET_KEY);
            } catch (e) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Check if user is a receptionist or officer
            if (decoded.role !== 'receptionist' && decoded.role !== 'officer') {
                return res.status(403).json({ error: 'Only receptionists and officers can assign interactions' });
            }

            // Check if interaction can be moved (not started, completed, or closed)
            const existing = await InteractionService.findOne({ id });
            if (!existing) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            if (existing.started || existing.completed || existing.closed) {
                return res.status(400).json({
                    error: 'Cannot move interaction that has been started, completed, or closed'
                });
            }

            // Allow unassigning by passing empty strings
            // When assigning to a doctor, set queue number (temporarySerial); when unassigning, clear it
            const updates = {
                officerId: officerId || '',
                officerSerial: officerSerial || '',
                billed: false  // Ensure billed is false when assigning/unassigning
            };
            if (officerId && officerId.trim()) {
                const queueDayStart = getQueueDayStart();
                const maxTemp = await InteractionService.getMaxTemporarySerialInQueueDay(existing.entityId, queueDayStart);
                updates.temporarySerial = maxTemp + 1;
            } else {
                updates.temporarySerial = 0;
            }

            const updated = await InteractionService.update(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            console.log('assignOfficer - Updated interaction:', {
                id,
                officerId,
                officerSerial
            });

            res.json(updated);
        } catch (e) {
            console.error('assignOfficer error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Create a new interaction
    async createInteraction(req, res) {
        try {
            const { entityId, entitySerial, visitorId, visitorSerial, reasonForVisit, reasonForVisitNotes } = req.body;

            console.log('createInteraction - Received data:', {
                entityId,
                entitySerial,
                visitorId,
                visitorSerial,
                reasonForVisit
            });

            if (!entityId || !entitySerial || !visitorId || !visitorSerial) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if there's already an active (non-completed) interaction for this visitor
            const existingActive = await InteractionService.findOne({
                visitorId: visitorId,
                entityId: entityId,
                completed: { $ne: true },
                deletedAt: ''
            });

            if (existingActive) {
                return res.status(400).json({ error: 'Patient already has an active registration' });
            }

            // Generate interaction serial
            const interactionSerial = await InteractionService.getNextSerialForEntity(entitySerial, visitorSerial);
            console.log('createInteraction - Generated interactionSerial:', interactionSerial);

            if (!interactionSerial) {
                return res.status(500).json({ error: 'Failed to generate interaction serial' });
            }

            const { v4: uuidv4 } = require('uuid');
            const interactionId = uuidv4();
            console.log('createInteraction - Generated id:', interactionId);

            const now = new Date().toISOString();

            const interactionData = {
                id: interactionId,
                interactionSerial: interactionSerial,
                entityId: entityId,
                entitySerial: entitySerial,
                visitorId: visitorId,
                visitorSerial: visitorSerial,
                officerId: '',
                officerSerial: '',
                createdAt: now,
                editedAt: now,
                deletedAt: '',
                billed: false,
                reasonForVisit: reasonForVisit || '',
                reasonForVisitNotes: (reasonForVisitNotes != null && String(reasonForVisitNotes).trim()) ? String(reasonForVisitNotes).trim() : ''
            };

            console.log('createInteraction - Interaction data to save:', interactionData);

            const created = await InteractionService.create(interactionData);
            console.log('createInteraction - Created interaction:', created);
            res.status(201).json(created);
        } catch (e) {
            console.error('createInteraction error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Delete an interaction
    async deleteInteraction(req, res) {
        try {
            const { id } = req.params;

            // Check if interaction can be deleted (not started, completed, or closed)
            const existing = await InteractionService.findOne({ id });
            if (!existing) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            if (existing.started || existing.completed || existing.closed) {
                return res.status(400).json({
                    error: 'Cannot delete interaction that has been started, completed, or closed'
                });
            }

            const deleted = await InteractionService.delete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Interaction not found' });
            }
            res.json({ message: 'Interaction deleted successfully' });
        } catch (e) {
            console.error('deleteInteraction error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Cancel an interaction (set status cancelled; only before start)
    async cancelInteraction(req, res) {
        try {
            const { id } = req.params;
            const existing = await InteractionService.findOne({ id });
            if (!existing) {
                return res.status(404).json({ error: 'Interaction not found' });
            }
            if (existing.started || existing.completed || existing.closed) {
                return res.status(400).json({
                    error: 'Cannot cancel interaction that has been started, completed, or closed'
                });
            }
            const updated = await InteractionService.cancel(id);
            if (!updated) {
                return res.status(404).json({ error: 'Interaction not found' });
            }
            res.json(updated);
        } catch (e) {
            console.error('cancelInteraction error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Save interaction details (notes, service lines, etc.)
    async saveInteractionDetails(req, res) {
        try {
            const { id } = req.params;
            const {
                ccReason,
                subjective,
                objective,
                assessmentPlan,
                serviceLines,
                referral,
                medications,
                followupRequired,
                followup,
                savedNotes,
                started,
                ongoing,
                incomplete,
                completed,
                closed,
                billed
            } = req.body;

            // Validate interaction exists
            const existing = await InteractionService.findOne({ id });
            if (!existing) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            const updates = {
                editedAt: new Date().toISOString(),
                completed: completed === true || (completed === undefined && existing.completed === true)
            };

            // Set started flag if provided (when doctor starts interaction)
            if (started !== undefined) {
                updates.started = started;
            } else {
                // Only default to true when doing a substantive save (notes, etc.) - not for metadata-only updates (e.g. followup)
                const isMetadataOnly = ccReason === undefined && subjective === undefined && objective === undefined && assessmentPlan === undefined;
                if (!isMetadataOnly) {
                    updates.started = true;
                }
            }

            if (ongoing !== undefined) {
                updates.ongoing = ongoing;
            }
            if (incomplete !== undefined) {
                updates.incomplete = incomplete;
            }

            // If we are completing/saving, mark as no longer ongoing
            if (!incomplete && !ongoing && updates.completed) {
                updates.ongoing = false;
                updates.incomplete = false;
            }

            // Closed = ready for billing: completed and at least one service line has both diagnostic and billing (service code or fee)
            if (closed !== undefined) {
                updates.closed = closed === true;
            } else if (!updates.completed) {
                updates.closed = false;
            } else {
                const serviceLinesToUse = serviceLines !== undefined ? serviceLines : existing.serviceLines;
                const hasDiagAndBilling = Array.isArray(serviceLinesToUse) && serviceLinesToUse.length > 0 &&
                    serviceLinesToUse.some(line => {
                        const hasDiag = line.diagnostic && String(line.diagnostic).trim();
                        const hasBilling = (line.service && String(line.service).trim()) || (line.totalFee != null && Number(line.totalFee) > 0) || (line.accountingNumber && String(line.accountingNumber).trim());
                        return hasDiag && hasBilling;
                    });
                updates.closed = hasDiagAndBilling;
            }

            // Billed: when set to true, also set billedAt (only when transitioning to true)
            if (billed === true) {
                updates.billed = true;
                if (!existing.billed) updates.billedAt = new Date().toISOString();
            } else if (billed !== undefined) {
                updates.billed = billed === true;
            } else {
                updates.billed = false;
            }

            // Set status timestamps when flag transitions to true (never overwrite)
            const now = new Date().toISOString();
            if (updates.started === true && !existing.started) updates.startedAt = now;
            if (updates.completed === true && !existing.completed) updates.completedAt = now;
            if (updates.closed === true && !existing.closed) updates.closedAt = now;

            // Add notes if provided
            if (ccReason !== undefined) {
                updates.ccReason = {
                    text: ccReason.text || '',
                    scratchpad: ccReason.scratchpad || '',
                    hasScratchpad: ccReason.hasScratchpad || false
                };
            }

            if (subjective !== undefined) {
                updates.subjective = {
                    text: subjective.text || '',
                    scratchpad: subjective.scratchpad || '',
                    hasScratchpad: subjective.hasScratchpad || false
                };
            }

            if (objective !== undefined) {
                updates.objective = {
                    text: objective.text || '',
                    scratchpad: objective.scratchpad || '',
                    hasScratchpad: objective.hasScratchpad || false
                };
            }

            if (assessmentPlan !== undefined) {
                updates.assessmentPlan = {
                    text: assessmentPlan.text || '',
                    scratchpad: assessmentPlan.scratchpad || '',
                    hasScratchpad: assessmentPlan.hasScratchpad || false
                };
            }

            if (serviceLines !== undefined) {
                updates.serviceLines = serviceLines.map(line => ({
                    serialNumber: line.serialNumber || 1,
                    service: line.service || '',
                    suffix: line.suffix || '',
                    diagnostic: line.diagnostic || '',
                    totalFee: parseFloat(line.totalFee) || 0,
                    accountingNumber: line.accountingNumber || ''
                }));
            }

            if (referral !== undefined) {
                updates.referral = {
                    type: referral.type || '',
                    reason: referral.reason || '',
                    to: referral.to || '',
                    date: referral.date || ''
                };
            }

            if (medications !== undefined) {
                updates.medications = medications.map(med => ({
                    name: med.name || '',
                    dosage: med.dosage || '',
                    suspension: med.suspension || '',
                    frequency: med.frequency || '',
                    duration: med.duration || '',
                    refills: parseInt(med.refills) || 0,
                    instructions: med.instructions || ''
                }));
            }

            if (followupRequired !== undefined) {
                updates.followupRequired = {
                    required: followupRequired.required || false,
                    date: followupRequired.date || '',
                    followupInteractionId: followupRequired.followupInteractionId || ''
                };
            }

            if (followup !== undefined) {
                updates.followup = {
                    isFollowup: followup.isFollowup || false,
                    parentInteractionId: followup.parentInteractionId || ''
                };
            }

            if (savedNotes !== undefined) {
                updates.savedNotes = savedNotes.map(note => ({
                    text: note.text || '',
                    timestamp: note.timestamp || ''
                }));
            }

            const updated = await InteractionService.update(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            console.log('saveInteractionDetails - Updated interaction:', {
                id,
                completed: updated.completed
            });

            res.json(updated);
        } catch (e) {
            console.error('saveInteractionDetails error:', e);
            res.status(500).json({ error: e.message });
        }
    }
}

module.exports = new InteractionController();
