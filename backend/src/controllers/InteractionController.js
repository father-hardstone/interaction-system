const InteractionService = require('../services/InteractionService');
const VisitorService = require('../services/VisitorService');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

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

    // Get status counts for pie chart (total, cancelled, closed, billed, active) - no full documents
    async getStatusCounts(req, res) {
        try {
            const { entityId } = req.params;
            const days = req.query.days ? Math.min(365, Math.max(1, parseInt(req.query.days, 10))) : null;
            const data = await InteractionService.getStatusCountsByEntity(entityId, days);
            res.json(data);
        } catch (e) {
            console.error('getStatusCounts error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get revenue for entity dashboard (sum of serviceLines.totalFee for billed in period)
    async getRevenue(req, res) {
        try {
            const { entityId } = req.params;
            const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 7));
            const revenue = await InteractionService.getRevenueByEntity(entityId, days);
            res.json({ revenue });
        } catch (e) {
            console.error('getRevenue error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get daily stats (registered vs completed counts) for chart - no full documents
    async getDailyStats(req, res) {
        try {
            const { entityId } = req.params;
            const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 7));
            const data = await InteractionService.getDailyStats(entityId, days);
            res.json(data);
        } catch (e) {
            console.error('getDailyStats error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get all interactions for a specific visitor (no time filter; for patient history / past interactions)
    async getInteractionsByVisitor(req, res) {
        try {
            const { entityId, visitorId } = req.params;
            const interactions = await InteractionService.findMany({
                entityId,
                visitorId,
                deletedAt: ''
            });
            res.json({ interactions: interactions || [] });
        } catch (e) {
            console.error('getInteractionsByVisitor error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    // Get a single interaction by id (full document for edit view)
    async getInteractionById(req, res) {
        try {
            const { id } = req.params;
            const interaction = await InteractionService.findOne({ id });
            if (!interaction) {
                return res.status(404).json({ error: 'Interaction not found' });
            }
            res.json(interaction);
        } catch (e) {
            console.error('getInteractionById error:', e);
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

            // Allow unassigning by passing empty strings. Queue order is by queuedAt (set when assigned); serial is derived at display time.
            const now = new Date().toISOString();
            const isAssigning = officerId && String(officerId).trim() !== '';
            const updates = {
                officerId: officerId || '',
                officerSerial: officerSerial || '',
                billed: false,  // Ensure billed is false when assigning/unassigning
                queuedAt: isAssigning ? now : '',
                interactionStatus: InteractionService.computeInteractionStatus({
                    ...existing,
                    officerId: officerId || '',
                    officerSerial: officerSerial || ''
                })
            };

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
            const { entityId, entitySerial, visitorId, visitorSerial, reasonForVisit, reasonForVisitNotes, visitMode } = req.body;

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

            // Check if there's already an active (non-completed, non-cancelled) interaction for this visitor
            const existingActive = await InteractionService.findOne({
                visitorId: visitorId,
                entityId: entityId,
                completed: { $ne: true },
                cancelled: { $ne: true },
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
                reasonForVisitNotes: (reasonForVisitNotes != null && String(reasonForVisitNotes).trim()) ? String(reasonForVisitNotes).trim() : '',
                visitMode: (visitMode === 'on_phone' || visitMode === 'physical') ? visitMode : 'physical',
                interactionStatus: 'registered'
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
                editCount,
                started,
                ongoing,
                incomplete,
                completed,
                closed,
                billed,
                billingType,
                ministryClaimFiled
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
            } else if (billed === false) {
                updates.billed = false;
                if (existing.billed) updates.billedAt = '';
                updates.ministryClaimFiled = false;
            } else if (billed !== undefined) {
                updates.billed = billed === true;
            }

            if (billingType !== undefined) {
                updates.billingType = billingType || '';
            }

            if (ministryClaimFiled !== undefined) {
                updates.ministryClaimFiled = ministryClaimFiled === true;
            }

            // Assign accounting number at billing time (when billed is true) if missing.
            const needsAccountingNumber = billed === true && existing.entityId &&
                !(existing.accountingNumber && String(existing.accountingNumber).trim());
            if (needsAccountingNumber) {
                const nextAccountingNumber = await InteractionService.getNextAccountingNumber(existing.entityId);
                updates.accountingNumber = nextAccountingNumber;

                const linesToUse = updates.serviceLines !== undefined ? updates.serviceLines : existing.serviceLines || [];
                const baseLines = linesToUse.map(line => ({
                    ...line,
                    accountingNumber: line.accountingNumber && String(line.accountingNumber).trim()
                        ? line.accountingNumber
                        : nextAccountingNumber
                }));
                updates.serviceLines = baseLines;
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
                    hasScratchpad: ccReason.hasScratchpad || false,
                    addedLaterSheetIndices: Array.isArray(ccReason.addedLaterSheetIndices) ? ccReason.addedLaterSheetIndices : undefined
                };
            }

            if (subjective !== undefined) {
                updates.subjective = {
                    text: subjective.text || '',
                    scratchpad: subjective.scratchpad || '',
                    hasScratchpad: subjective.hasScratchpad || false,
                    addedLaterSheetIndices: Array.isArray(subjective.addedLaterSheetIndices) ? subjective.addedLaterSheetIndices : undefined
                };
            }

            if (objective !== undefined) {
                updates.objective = {
                    text: objective.text || '',
                    scratchpad: objective.scratchpad || '',
                    hasScratchpad: objective.hasScratchpad || false,
                    addedLaterSheetIndices: Array.isArray(objective.addedLaterSheetIndices) ? objective.addedLaterSheetIndices : undefined
                };
            }

            if (assessmentPlan !== undefined) {
                updates.assessmentPlan = {
                    text: assessmentPlan.text || '',
                    scratchpad: assessmentPlan.scratchpad || '',
                    hasScratchpad: assessmentPlan.hasScratchpad || false,
                    addedLaterSheetIndices: Array.isArray(assessmentPlan.addedLaterSheetIndices) ? assessmentPlan.addedLaterSheetIndices : undefined
                };
            }

            if (serviceLines !== undefined) {
                const sharedAccountingNumber = updates.accountingNumber != null && String(updates.accountingNumber).trim() !== ''
                    ? String(updates.accountingNumber).trim()
                    : null;
                updates.serviceLines = serviceLines.map(line => ({
                    serialNumber: line.serialNumber || 1,
                    service: line.service || '',
                    suffix: line.suffix || '',
                    diagnostic: line.diagnostic || '',
                    totalFee: parseFloat(line.totalFee) || 0,
                    accountingNumber: sharedAccountingNumber || line.accountingNumber || ''
                }));
            }

            if (referral !== undefined) {
                updates.referral = {
                    type: referral.type || '',
                    reason: referral.reason || '',
                    to: referral.to || '',
                    date: referral.date || '',
                    addedLater: referral.addedLater === true
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
                    instructions: med.instructions || '',
                    addedLater: med.addedLater === true
                }));
            }

            if (followupRequired !== undefined) {
                updates.followupRequired = {
                    required: followupRequired.required || false,
                    date: followupRequired.date || '',
                    followupInteractionId: followupRequired.followupInteractionId || '',
                    addedLater: followupRequired.addedLater === true,
                    intervalWeeks: followupRequired.intervalWeeks != null ? followupRequired.intervalWeeks : null,
                    intervalMonths: followupRequired.intervalMonths != null ? followupRequired.intervalMonths : null
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
            if (editCount !== undefined) {
                updates.editCount = Math.max(0, parseInt(editCount, 10) || 0);
            }

            // When all key SOAP blocks are provided, derive completed/incomplete from whether key fields are filled (so removing CC/S/O/AP moves back to incomplete).
            // Skip this when returning to queue (started: false) so we do not overwrite explicit incomplete: false.
            if (ccReason !== undefined && subjective !== undefined && objective !== undefined && assessmentPlan !== undefined && started !== false) {
                const effectiveCc = updates.ccReason !== undefined ? updates.ccReason : existing.ccReason;
                const effectiveS = updates.subjective !== undefined ? updates.subjective : existing.subjective;
                const effectiveO = updates.objective !== undefined ? updates.objective : existing.objective;
                const effectiveAp = updates.assessmentPlan !== undefined ? updates.assessmentPlan : existing.assessmentPlan;
                const hasKeyFields = [effectiveCc, effectiveS, effectiveO, effectiveAp].every(
                    block => block && ((block.text && String(block.text).trim()) || block.hasScratchpad)
                );
                updates.completed = hasKeyFields;
                updates.incomplete = !hasKeyFields;
            }

            // Merge updates into existing to compute new interactionStatus
            const merged = { ...existing, ...updates };
            updates.interactionStatus = InteractionService.computeInteractionStatus(merged);

            const updated = await InteractionService.update(id, updates);
            if (!updated) {
                return res.status(404).json({ error: 'Interaction not found' });
            }

            // Keep visitor.lastVisitAt in sync when this interaction is completed
            if (updated.completed && updated.visitorId) {
                const lastVisitAt = updated.completedAt || updated.editedAt;
                if (lastVisitAt) {
                    try {
                        await VisitorService.updateLastVisitAt(updated.visitorId, lastVisitAt);
                    } catch (err) {
                        console.warn('saveInteractionDetails - could not update visitor lastVisitAt:', err.message);
                    }
                }
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
