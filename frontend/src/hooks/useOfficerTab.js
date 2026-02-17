import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { reportService } from '../services/reportService';
import { useMasterData } from '../contexts/MasterDataContext';
import { useToast } from '../contexts/ToastContext';
import supabaseStorageService, { extractStoragePathFromSupabaseUrl } from '../services/supabaseService';

const SUPABASE_BUCKET = 'CRM testing';

/** Parse pad value into sheets array (legacy single or JSON array). Handles string or array from API. */
function parsePadSheets(padValue) {
    if (padValue == null || padValue === '') return [''];
    if (Array.isArray(padValue)) return padValue.slice(0, 4);
    if (typeof padValue === 'string' && padValue.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(padValue);
            return Array.isArray(arr) ? arr.slice(0, 4) : [padValue];
        } catch {
            return [padValue];
        }
    }
    return [padValue];
}

/** Normalize scratchpad to string for state (API may return array). */
function normalizeScratchpad(scratchpad) {
    if (scratchpad == null || scratchpad === '') return '';
    if (Array.isArray(scratchpad)) return scratchpad.length <= 1 ? (scratchpad[0] || '') : JSON.stringify(scratchpad);
    return String(scratchpad);
}

/** Extract first sheet with content for upload (legacy). */
function getPrimarySheetForUpload(padValue) {
    const sheets = parsePadSheets(padValue);
    const withContent = sheets.find(s => s && (s.startsWith('data:image') || (typeof s === 'string' && s.includes('/interactions/'))));
    return withContent || '';
}

/** Check if pad has any content (single or multi-sheet). */
function padHasContent(padValue) {
    if (!padValue) return false;
    if (typeof padValue === 'string' && padValue.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(padValue);
            return Array.isArray(arr) && arr.some(s => s && (s.startsWith('data:image') || (typeof s === 'string' && s.includes('/interactions/'))));
        } catch {
            return !!padValue;
        }
    }
    return !!(padValue && (padValue.startsWith('data:image') || padValue.includes('/interactions/')));
}

/** Get storage paths from a scratchpad value (string or JSON array). Only returns paths that look like Supabase storage (e.g. contain /interactions/). */
function getStoragePathsFromScratchpadValue(value) {
    if (!value) return [];
    let raw = [];
    if (typeof value === 'string' && value.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(value);
            raw = Array.isArray(arr) ? arr.filter(Boolean) : [value];
        } catch {
            raw = [value];
        }
    } else if (typeof value === 'string') {
        raw = [value];
    } else if (Array.isArray(value)) {
        raw = value.filter(Boolean);
    }
    return raw
        .map((p) => {
            if (typeof p !== 'string') return null;
            if (!p.includes('/interactions/')) return null;
            if (p.startsWith('http') || p.includes('/storage/')) return extractStoragePathFromSupabaseUrl(p) || p;
            return p;
        })
        .filter(Boolean);
}

/** Collect all scratchpad storage paths from an interaction (for cleanup). */
function collectInteractionScratchpadPaths(interaction) {
    if (!interaction) return [];
    const paths = [
        ...getStoragePathsFromScratchpadValue(interaction.ccReason?.scratchpad),
        ...getStoragePathsFromScratchpadValue(interaction.subjective?.scratchpad),
        ...getStoragePathsFromScratchpadValue(interaction.objective?.scratchpad),
        ...getStoragePathsFromScratchpadValue(interaction.assessmentPlan?.scratchpad)
    ];
    return [...new Set(paths)];
}

/** Flatten imagePaths (CC, S, O, AP) to array of storage paths. */
function imagePathsToStoragePaths(imagePaths) {
    if (!imagePaths) return [];
    const paths = [];
    for (const key of ['CC', 'S', 'O', 'AP']) {
        const v = imagePaths[key];
        paths.push(...getStoragePathsFromScratchpadValue(v));
    }
    return [...new Set(paths)];
}

const useOfficerTab = (userData, interactions, visitors, onRefreshInteractions) => {
    const { services = [], diagnostics = [] } = useMasterData();
    const toast = useToast();
    const showToast = (message, type = 'info') => {
        if (toast?.showToast) toast.showToast(message, type);
        else alert(message);
    };
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
    const [expandedInteractionIds, setExpandedInteractionIds] = useState({});
    const [activeInteractionId, setActiveInteractionId] = useState(() => {
        return sessionStorage.getItem('activeInteractionId') || null;
    });
    const [activeViewTab, setActiveViewTab] = useState(() => {
        return sessionStorage.getItem('activeViewTab') || 'scheduled';
    });

    useEffect(() => {
        if (activeInteractionId) {
            sessionStorage.setItem('activeInteractionId', activeInteractionId);
        } else {
            sessionStorage.removeItem('activeInteractionId');
        }
    }, [activeInteractionId]);

    useEffect(() => {
        sessionStorage.setItem('activeViewTab', activeViewTab);
    }, [activeViewTab]);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupMessage, setCleanupMessage] = useState('');
    const [patientReports, setPatientReports] = useState([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [viewingMedia, setViewingMedia] = useState(null);

    // Form states
    const [ccReason, setCcReason] = useState('');
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessmentPlan, setAssessmentPlan] = useState('');

    // Pad states
    const [ccReasonPad, setCcReasonPad] = useState('');
    const [subjectivePad, setSubjectivePad] = useState('');
    const [objectivePad, setObjectivePad] = useState('');
    const [assessmentPlanPad, setAssessmentPlanPad] = useState('');

    const [serviceLines, setServiceLines] = useState([
        {
            id: Date.now(),
            serialNumber: 1,
            diagnostic: '',
            diagnosticDescription: '',
            billingCode: '',
            billingDescription: '',
            totalFee: ''
        }
    ]);

    const [referral, setReferral] = useState({
        type: '',
        reason: '',
        to: '',
        date: ''
    });

    const [medications, setMedications] = useState([]);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [savedNotes, setSavedNotes] = useState([]);
    const [followup, setFollowup] = useState({ required: false, date: '', intervalWeeks: null, intervalMonths: null, addedLater: false });

    const [isSaving, setIsSaving] = useState(false);
    const [isEditingCompleted, setIsEditingCompleted] = useState(false);
    /** When editing: number of original sheets per SOAP field (existing sheets are read-only). */
    const [originalPadSheetCounts, setOriginalPadSheetCounts] = useState({ cc: 0, s: 0, o: 0, ap: 0 });
    /** When editing: number of medications at open (medications at index >= this are "added later"). */
    const [initialMedicationCount, setInitialMedicationCount] = useState(0);
    const [isLoadingEdit, setIsLoadingEdit] = useState(false);

    const [hasRecovered, setHasRecovered] = useState(false);

    const doctorId = userData?.id;

    const activePatientVisitorId = useMemo(() => {
        if (!activeInteractionId) return null;
        const interaction = interactions.find(i => i.id === activeInteractionId);
        return interaction?.visitorId;
    }, [activeInteractionId, interactions]);

    // Fetch reports
    const loadReports = async () => {
        if (!activePatientVisitorId) {
            setPatientReports([]);
            return;
        }
        setIsLoadingReports(true);
        try {
            const data = await reportService.getByPatient(activePatientVisitorId);
            setPatientReports(data || []);
        } catch (error) {
            console.error('Error fetching patient reports:', error);
        } finally {
            setIsLoadingReports(false);
        }
    }

    useEffect(() => {
        loadReports();
    }, [activePatientVisitorId]);

    const doctorInteractions = useMemo(
        () => interactions.filter((i) => i.officerId === doctorId),
        [interactions, doctorId]
    );

    /** Scheduled queue: oldest first (ascending by queuedAt/createdAt). Serial 1 = oldest in queue. */
    const scheduledInteractions = useMemo(() => {
        return doctorInteractions
            .filter((i) => !i.completed && !i.ongoing && !i.incomplete && !i.started)
            .sort((a, b) => new Date(a.queuedAt || a.createdAt || 0) - new Date(b.queuedAt || b.createdAt || 0));
    }, [doctorInteractions]);

    const incompleteInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.incomplete && !i.completed
        );
    }, [doctorInteractions]);

    /** Completed but not closed: key fields present, diag/billing not yet filled. Latest first by completedAt. */
    const completedInteractions = useMemo(() => {
        return doctorInteractions
            .filter((i) => i.completed && !i.closed)
            .sort((a, b) => new Date(b.completedAt || b.editedAt || b.createdAt).getTime() - new Date(a.completedAt || a.editedAt || a.createdAt).getTime());
    }, [doctorInteractions]);

    /** Closed: have diag code and billing code (finalized). Latest first by closedAt. */
    const closedInteractions = useMemo(() => {
        return doctorInteractions
            .filter((i) => i.closed)
            .sort((a, b) => new Date(b.closedAt || b.editedAt || b.createdAt).getTime() - new Date(a.closedAt || a.editedAt || a.createdAt).getTime());
    }, [doctorInteractions]);

    const ongoingInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.ongoing || (i.id === activeInteractionId && !i.completed)
        );
    }, [doctorInteractions, activeInteractionId]);

    const completedInteractionsForPatient = useMemo(() => {
        if (!selectedPatient) return [];
        return interactions
            .filter(
                (i) =>
                    i.visitorId === selectedPatient.id &&
                    i.completed
            )
            .sort(
                (a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime()
            );
    }, [interactions, selectedPatient]);


    const resetInteractionFields = () => {
        setCcReason('');
        setSubjective('');
        setObjective('');
        setAssessmentPlan('');
        setCcReasonPad('');
        setSubjectivePad('');
        setObjectivePad('');
        setAssessmentPlanPad('');
        setServiceLines([
            {
                id: Date.now(),
                serialNumber: 1,
                diagnostic: '',
                diagnosticDescription: '',
                billingCode: '',
                billingDescription: '',
                totalFee: ''
            }
        ]);
        setReferral({ type: '', reason: '', to: '', date: '', addedLater: false });
        setMedications([]);
        setAdditionalNotes('');
        setSavedNotes([]);
        setFollowup({ required: false, date: '', intervalWeeks: null, intervalMonths: null, addedLater: false });
    };

    /** Resolve scratchpad paths to full Supabase URLs so canvas can load images. Returns a new interaction object with resolved scratchpads (so pad state gets URLs, not paths). */
    const resolveScratchpadUrls = async (interaction) => {
        if (!interaction) return interaction;
        const resolveOne = async (p) => {
            if (!p || typeof p !== 'string') return p;
            if (p.startsWith('data:image')) return p;
            if (p.startsWith('http') && !p.includes('/storage/')) return p;
            const path = p.startsWith('http') ? extractStoragePathFromSupabaseUrl(p) : p;
            if (!path || !path.includes('/interactions/')) return p;
            try {
                return await supabaseStorageService.getFileUrl(SUPABASE_BUCKET, path);
            } catch (e) {
                console.warn('resolveScratchpadUrls resolveOne failed:', path, e);
                return p;
            }
        };
        const out = { ...interaction };
        for (const key of ['ccReason', 'subjective', 'objective', 'assessmentPlan']) {
            const obj = interaction[key];
            if (!obj || !obj.scratchpad) {
                if (obj) out[key] = { ...obj };
                continue;
            }
            let val = obj.scratchpad;
            try {
                if (Array.isArray(val)) {
                    const resolved = await Promise.all(val.map(resolveOne));
                    out[key] = { ...obj, scratchpad: resolved.length <= 1 ? (resolved[0] || '') : JSON.stringify(resolved) };
                } else if (typeof val === 'string' && val.trim().startsWith('[')) {
                    const arr = JSON.parse(val);
                    const resolved = await Promise.all(arr.map(resolveOne));
                    out[key] = { ...obj, scratchpad: resolved.length <= 1 ? (resolved[0] || '') : JSON.stringify(resolved) };
                } else if (val && typeof val === 'string') {
                    const resolved = val.includes('/interactions/') ? await resolveOne(val) : val;
                    out[key] = { ...obj, scratchpad: resolved };
                } else {
                    out[key] = { ...obj };
                }
            } catch (e) {
                console.warn(`Resolve scratchpad URLs for ${key}:`, e);
                out[key] = { ...obj };
            }
        }
        return out;
    };

    const loadInteractionToState = (interaction) => {
        if (!interaction) return;

        setCcReason(interaction.ccReason?.text || '');
        setCcReasonPad(normalizeScratchpad(interaction.ccReason?.scratchpad));

        setSubjective(interaction.subjective?.text || '');
        setSubjectivePad(normalizeScratchpad(interaction.subjective?.scratchpad));

        setObjective(interaction.objective?.text || '');
        setObjectivePad(normalizeScratchpad(interaction.objective?.scratchpad));

        setAssessmentPlan(interaction.assessmentPlan?.text || '');
        setAssessmentPlanPad(normalizeScratchpad(interaction.assessmentPlan?.scratchpad));

        if (interaction.serviceLines && interaction.serviceLines.length > 0) {
            setServiceLines(interaction.serviceLines.map((line, i) => {
                const diag = line.diagnostic || '';
                const diagDesc = diagnostics.find(d => (d.code || '').toUpperCase() === (diag || '').trim().toUpperCase())?.description || '';
                return {
                    id: Math.random(),
                    serialNumber: line.serialNumber || i + 1,
                    diagnostic: diag,
                    diagnosticDescription: diagDesc,
                    billingCode: line.service || '',
                    billingDescription: services.find(s => (s.code || '').toUpperCase() === (line.service || '').trim().toUpperCase())?.description || '',
                    totalFee: line.totalFee !== undefined ? line.totalFee.toString() : ''
                };
            }));
        } else {
            resetInteractionFields();
        }

        setReferral({ type: (interaction.referral || {}).type || '', reason: (interaction.referral || {}).reason || '', to: (interaction.referral || {}).to || '', date: (interaction.referral || {}).date || '', addedLater: (interaction.referral || {}).addedLater === true });
        setMedications((interaction.medications || []).map(med => {
            const strength = (med.dosage ?? [med.dosageAmount, med.dosageUnit].filter(Boolean).join(' ')) || '';
            return {
                name: med.name || '',
                strength: strength.trim(),
                frequency: med.frequency || '',
                duration: med.duration || '',
                repeat: med.refills ?? 0,
                addedLater: med.addedLater === true,
            };
        }));
        setSavedNotes(interaction.savedNotes || []);
        const fr = interaction.followupRequired || interaction.followup;
        setFollowup(fr ? {
            required: fr.required,
            date: fr.date || '',
            addedLater: (interaction.followupRequired || {}).addedLater === true,
            intervalWeeks: fr.intervalWeeks != null ? fr.intervalWeeks : null,
            intervalMonths: fr.intervalMonths != null ? fr.intervalMonths : null
        } : { required: false, date: '', intervalWeeks: null, intervalMonths: null, addedLater: false });
        setAdditionalNotes(''); // Always clear input on load
    };

    // Recovery effect (restore draft when reopening an ongoing interaction; do not clear when editing a completed one)
    useEffect(() => {
        if (!hasRecovered && activeInteractionId && interactions.length > 0 && services.length > 0 && diagnostics.length > 0 && !isEditingCompleted) {
            const activeInt = interactions.find(i => i.id === activeInteractionId);
            if (activeInt && !activeInt.completed) {
                loadInteractionToState(activeInt);
                setHasRecovered(true);
            } else if (activeInt && activeInt.completed) {
                setActiveInteractionId(null);
                setActiveViewTab('scheduled');
            }
        }
    }, [interactions, activeInteractionId, services, diagnostics, hasRecovered, isEditingCompleted]);

    // Auto-select ongoing interaction if activeInteractionId is null but an ongoing interaction exists
    useEffect(() => {
        if (!activeInteractionId && doctorInteractions.length > 0) {
            const ongoing = doctorInteractions.find(i => i.ongoing);
            if (ongoing) {
                // Determine if we should auto-switch or just set the ID
                // For safety, let's just set the ID and load it if we are in 'ongoing' tab OR just generally
                // Usually we want to restore the session.
                setActiveInteractionId(ongoing.id);
                loadInteractionToState(ongoing);
                if (activeViewTab !== 'ongoing') {
                    // Optionally switch tab, but maybe user wants to see scheduled.
                    // But if they go to 'ongoing' tab, it will now be populated.
                }
            }
        }
    }, [activeInteractionId, doctorInteractions, activeViewTab]);

    const handleEditCompleted = async (interaction) => {
        if (!interaction) return;
        setActiveInteractionId(interaction.id);
        setActiveViewTab('ongoing');
        setIsEditingCompleted(true);
        setIsLoadingEdit(true);
        try {
            const { data } = await api.get(`/interactions/${interaction.id}`);
            const resolved = await resolveScratchpadUrls(data);
            const interactionToLoad = resolved || data;
            const sheetCount = (key) => {
                const raw = interactionToLoad[key]?.scratchpad;
                const arr = parsePadSheets(Array.isArray(raw) ? raw : raw);
                return arr.filter((s) => s && (String(s).startsWith('data:image') || String(s).includes('/interactions/'))).length;
            };
            setOriginalPadSheetCounts({
                cc: sheetCount('ccReason'),
                s: sheetCount('subjective'),
                o: sheetCount('objective'),
                ap: sheetCount('assessmentPlan')
            });
            setInitialMedicationCount((interactionToLoad.medications || []).length);
            loadInteractionToState(interactionToLoad);
            // Keep spinner until state has been applied and form has rendered (elements in place)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => setIsLoadingEdit(false), 350);
                });
            });
        } catch (e) {
            console.error('Failed to load interaction for edit:', e);
            let fallback = interaction;
            try {
                const resolved = await resolveScratchpadUrls(interaction);
                if (resolved) fallback = resolved;
            } catch (_) {}
            loadInteractionToState(fallback);
            setOriginalPadSheetCounts({ cc: 0, s: 0, o: 0, ap: 0 });
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => setIsLoadingEdit(false), 350);
                });
            });
        }
    };

    const handleStartInteraction = async (interactionId) => {
        setIsEditingCompleted(false);
        const currentOngoing = ongoingInteractions.find(i => i.id !== interactionId);
        if (currentOngoing && activeViewTab !== 'ongoing') {
            showToast('You already have an interaction in progress. Please complete or pause it before starting a new one.', 'error');
            setActiveViewTab('ongoing');
            return;
        }

        setActiveInteractionId(interactionId);

        // Always fetch full interaction by ID so we have the latest draft (CC, etc.); list may be stale or filtered out
        try {
            const { data } = await api.get(`/interactions/${interactionId}`);
            const resolved = data ? await resolveScratchpadUrls(data) : data;
            const toLoad = resolved || data;
            if (toLoad) {
                loadInteractionToState(toLoad);
            } else {
                const fromList = interactions.find(i => i.id === interactionId);
                if (fromList) loadInteractionToState(fromList);
                else resetInteractionFields();
            }
        } catch (e) {
            console.warn('Resume: could not fetch interaction by ID, using list:', e?.message);
            const fromList = interactions.find(i => i.id === interactionId);
            if (fromList) loadInteractionToState(fromList);
            else resetInteractionFields();
        }

        try {
            await api.put(`/interactions/${interactionId}/details`, {
                started: true,
                ongoing: true,
                incomplete: false,
                completed: false,
                billed: false
            });
            setActiveViewTab('ongoing');
        } catch (error) {
            console.error('Error marking interaction as started:', error);
            setActiveViewTab('ongoing');
        }
    };

    const handleCloseEditMode = () => {
        setActiveInteractionId(null);
        resetInteractionFields();
        setIsEditingCompleted(false);
        setOriginalPadSheetCounts({ cc: 0, s: 0, o: 0, ap: 0 });
        setInitialMedicationCount(0);
        setActiveViewTab('completed');
    };

    const confirmCancel = async () => {
        setIsEditingCompleted(false);
        if (!activeInteractionId) {
            showToast('No active interaction selected to cancel.', 'error');
            return;
        }
        const interaction = interactions.find((i) => i.id === activeInteractionId);
        const pathsToDelete = collectInteractionScratchpadPaths(interaction);

        try {
            if (pathsToDelete.length > 0) {
                setIsCleaning(true);
                setCleanupMessage('Cleaning previous state before canceling.');
                await deleteSupabasePaths(pathsToDelete);
                setIsCleaning(false);
                setCleanupMessage('');
            }

            const clearPayload = {
                ccReason: { text: '', scratchpad: '', hasScratchpad: false },
                subjective: { text: '', scratchpad: '', hasScratchpad: false },
                objective: { text: '', scratchpad: '', hasScratchpad: false },
                assessmentPlan: { text: '', scratchpad: '', hasScratchpad: false },
                serviceLines: [],
                referral: { type: '', reason: '', to: '', date: '', addedLater: false },
                medications: [],
                followupRequired: { required: false, date: '', followupInteractionId: '', addedLater: false, intervalWeeks: null, intervalMonths: null },
                savedNotes: [],
                started: false,
                ongoing: false,
                incomplete: false,
                completed: false,
                billed: false
            };
            await api.put(`/interactions/${activeInteractionId}/details`, clearPayload);
            setShowCancelModal(false);
            resetInteractionFields();
            setActiveInteractionId(null);
            setActiveViewTab('scheduled');
            showToast('Interaction canceled', 'success');
            if (onRefreshInteractions) onRefreshInteractions();
        } catch (error) {
            setIsCleaning(false);
            setCleanupMessage('');
            console.error('Error canceling interaction:', error);
            showToast('Failed to cancel interaction', 'error');
        }
    };

    /** Delete scratchpad files from Supabase (e.g. before cancel or before overwriting with new save). */
    const deleteSupabasePaths = async (paths) => {
        if (!paths?.length) return;
        for (const path of paths) {
            try {
                await supabaseStorageService.deleteFile(SUPABASE_BUCKET, path);
            } catch (err) {
                console.warn('Supabase cleanup: could not delete path', path, err);
            }
        }
    };

    const moveToIncomplete = async () => {
        if (!activeInteractionId) {
            showToast('No active interaction selected to move.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await saveInteractionData({
                started: true,
                ongoing: false,
                incomplete: true,
                completed: false
            });
            setShowCancelModal(false);
            resetInteractionFields();
            setActiveInteractionId(null);
            setActiveViewTab('scheduled');
            showToast('Moved to incomplete', 'success');
            if (onRefreshInteractions) onRefreshInteractions();
        } catch (error) {
            console.error('Error moving interaction to incomplete:', error);
            showToast('Failed to move interaction to incomplete', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    /** Upload pad images to Supabase and return imagePaths (CC, S, O, AP). Used by save and edit save. */
    const uploadPadImagesToSupabase = async (interaction, interactionId) => {
        const { entityId } = interaction;
        const imagePaths = {};
        const fieldConfigs = [
            { name: 'CC', pad: ccReasonPad, existing: interaction.ccReason?.scratchpad || '' },
            { name: 'S', pad: subjectivePad, existing: interaction.subjective?.scratchpad || '' },
            { name: 'O', pad: objectivePad, existing: interaction.objective?.scratchpad || '' },
            { name: 'AP', pad: assessmentPlanPad, existing: interaction.assessmentPlan?.scratchpad || '' }
        ];
        for (const field of fieldConfigs) {
            const sheets = parsePadSheets(field.pad);
            const existingPaths = parsePadSheets(field.existing);
            const paths = [];
            for (let i = 0; i < sheets.length; i++) {
                const sheet = sheets[i];
                const suffix = i + 1;
                const fieldNameWithSuffix = `${field.name}${suffix}`;
                // data URL = current canvas content (user drew or changed the image). Always upload so changes are saved.
                if (sheet && sheet.startsWith('data:image')) {
                    try {
                        paths[i] = await supabaseStorageService.uploadInteractionScratchpad(sheet, entityId, interactionId, fieldNameWithSuffix);
                    } catch (error) {
                        const isAlreadyExists = error?.message?.includes('already exists') || error?.statusCode === '409';
                        if (isAlreadyExists) {
                            paths[i] = `${entityId}/interactions/${interactionId}/${fieldNameWithSuffix}.png`;
                        } else {
                            console.error(`Error saving ${fieldNameWithSuffix} to Supabase:`, error);
                            paths[i] = '';
                        }
                    }
                } else if (sheet && sheet.includes('/interactions/')) {
                    paths[i] = sheet.startsWith('http') ? (extractStoragePathFromSupabaseUrl(sheet) || sheet) : sheet;
                } else if (existingPaths[i] && sheet !== '') paths[i] = existingPaths[i];
                else paths[i] = '';
            }
            const hasAny = paths.some(Boolean);
            if (!hasAny) imagePaths[field.name] = '';
            else if (paths.length === 1) imagePaths[field.name] = paths[0] || '';
            else imagePaths[field.name] = JSON.stringify(paths);
        }
        return imagePaths;
    };

    const saveInteractionData = async (statusOverride = {}) => {
        if (!activeInteractionId) return null;

        const activeInteraction = interactions.find(i => i.id === activeInteractionId);
        if (!activeInteraction) return null;

        const oldPaths = collectInteractionScratchpadPaths(activeInteraction);
        const imagePaths = await uploadPadImagesToSupabase(activeInteraction, activeInteractionId);
        const newPaths = imagePathsToStoragePaths(imagePaths);
        const pathsToDelete = oldPaths.filter((p) => !newPaths.includes(p));

        if (pathsToDelete.length > 0) {
            setIsCleaning(true);
            setCleanupMessage('Cleaning previous state before saving.');
            await deleteSupabasePaths(pathsToDelete);
            setIsCleaning(false);
            setCleanupMessage('');
        }

        // Handle additional notes timestamping - only if it's a final save or explicit draft save with content
        let updatedSavedNotes = [...savedNotes];
        if (additionalNotes.trim()) {
            updatedSavedNotes.push({
                text: additionalNotes.trim(),
                timestamp: new Date().toISOString()
            });
            setSavedNotes(updatedSavedNotes);
            setAdditionalNotes('');
        }

        const payload = {
            ccReason: {
                text: ccReason.trim(),
                scratchpad: imagePaths['CC'] || getPrimarySheetForUpload(ccReasonPad) || '',
                hasScratchpad: !!(imagePaths['CC'] || padHasContent(ccReasonPad)),
            },
            subjective: {
                text: subjective.trim(),
                scratchpad: imagePaths['S'] || getPrimarySheetForUpload(subjectivePad) || '',
                hasScratchpad: !!(imagePaths['S'] || padHasContent(subjectivePad)),
            },
            objective: {
                text: objective.trim(),
                scratchpad: imagePaths['O'] || getPrimarySheetForUpload(objectivePad) || '',
                hasScratchpad: !!(imagePaths['O'] || padHasContent(objectivePad)),
            },
            assessmentPlan: {
                text: assessmentPlan.trim(),
                scratchpad: imagePaths['AP'] || getPrimarySheetForUpload(assessmentPlanPad) || '',
                hasScratchpad: !!(imagePaths['AP'] || padHasContent(assessmentPlanPad)),
            },
            serviceLines: serviceLines
                .filter((line) => (line.diagnostic && String(line.diagnostic).trim()) && (line.billingCode && String(line.billingCode).trim()))
                .map((line, i) => ({
                    serialNumber: i + 1,
                    service: line.billingCode,
                    diagnostic: line.diagnostic,
                    totalFee: parseFloat(line.totalFee) || 0
                })),
            referral,
            medications: medications.map(med => ({
                name: med.name || '',
                dosage: (med.strength || '').trim(),
                suspension: '',
                frequency: med.frequency || '',
                duration: med.duration || '',
                refills: parseInt(med.repeat, 10) || 0,
                instructions: ''
            })),
            followupRequired: {
                required: followup.required || false,
                date: followup.date || '',
                followupInteractionId: (interactions.find(i => i.id === activeInteractionId)?.followupRequired?.followupInteractionId || interactions.find(i => i.id === activeInteractionId)?.followupInteractionId || ''),
                intervalWeeks: followup.intervalWeeks != null ? followup.intervalWeeks : null,
                intervalMonths: followup.intervalMonths != null ? followup.intervalMonths : null
            },
            savedNotes: updatedSavedNotes,
            ongoing: false,
            incomplete: false,
            completed: false,
            billed: false,  // Ensure billed is false when saving interaction data
            ...statusOverride
        };

        await api.put(`/interactions/${activeInteractionId}/details`, payload);
        return true;
    };

    const handleSaveInteraction = async () => {
        if (!ccReason.trim() && !padHasContent(ccReasonPad)) {
            showToast('CC / reason is required', 'error');
            return;
        }
        if (!subjective.trim() && !padHasContent(subjectivePad)) {
            showToast('S (Subjective) is required', 'error');
            return;
        }
        if (!objective.trim() && !padHasContent(objectivePad)) {
            showToast('O (Objective) is required', 'error');
            return;
        }

        setIsSaving(true);
        try {
            await saveInteractionData({ completed: true });
            showToast('Interaction saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving interaction:', error);
            showToast(`Error saving interaction: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setIsSaving(false);
            setActiveInteractionId(null);
            resetInteractionFields();
            setActiveViewTab('scheduled');
            if (onRefreshInteractions) onRefreshInteractions();
        }
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            await saveInteractionData({ ongoing: false, incomplete: true, completed: false });
            setActiveInteractionId(null);
            resetInteractionFields();
            setActiveViewTab('incomplete');
            if (onRefreshInteractions) await onRefreshInteractions();
            showToast('Draft saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving draft:', error);
            showToast(`Error saving draft: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!activeInteractionId) return;
        const interaction = interactions.find(i => i.id === activeInteractionId);
        if (!interaction) return;
        const prevEditCount = interaction.editCount ?? 0;
        const nextEditCount = prevEditCount + 1;
        let updatedSavedNotes = [...savedNotes];
        if (additionalNotes.trim()) {
            updatedSavedNotes.push({
                text: `Edit (${nextEditCount})\n${additionalNotes.trim()}`,
                timestamp: new Date().toISOString()
            });
            setSavedNotes(updatedSavedNotes);
            setAdditionalNotes('');
        }
        setIsSaving(true);
        try {
            const oldPaths = collectInteractionScratchpadPaths(interaction);
            const imagePaths = await uploadPadImagesToSupabase(interaction, activeInteractionId);
            const newPaths = imagePathsToStoragePaths(imagePaths);
            const pathsToDelete = oldPaths.filter((p) => !newPaths.includes(p));

            if (pathsToDelete.length > 0) {
                setIsCleaning(true);
                setCleanupMessage('Cleaning previous state before saving.');
                await deleteSupabasePaths(pathsToDelete);
                setIsCleaning(false);
                setCleanupMessage('');
            }

            const addedLaterIndices = (originalCount, padValue) => {
                const n = parsePadSheets(padValue).length;
                const arr = [];
                for (let i = originalCount; i < n; i++) arr.push(i);
                return arr;
            };
            const payload = {
                ccReason: {
                    text: ccReason.trim(),
                    scratchpad: imagePaths['CC'] || getPrimarySheetForUpload(ccReasonPad) || '',
                    hasScratchpad: !!(imagePaths['CC'] || padHasContent(ccReasonPad)),
                    addedLaterSheetIndices: addedLaterIndices(originalPadSheetCounts.cc, ccReasonPad)
                },
                subjective: {
                    text: subjective.trim(),
                    scratchpad: imagePaths['S'] || getPrimarySheetForUpload(subjectivePad) || '',
                    hasScratchpad: !!(imagePaths['S'] || padHasContent(subjectivePad)),
                    addedLaterSheetIndices: addedLaterIndices(originalPadSheetCounts.s, subjectivePad)
                },
                objective: {
                    text: objective.trim(),
                    scratchpad: imagePaths['O'] || getPrimarySheetForUpload(objectivePad) || '',
                    hasScratchpad: !!(imagePaths['O'] || padHasContent(objectivePad)),
                    addedLaterSheetIndices: addedLaterIndices(originalPadSheetCounts.o, objectivePad)
                },
                assessmentPlan: {
                    text: assessmentPlan.trim(),
                    scratchpad: imagePaths['AP'] || getPrimarySheetForUpload(assessmentPlanPad) || '',
                    hasScratchpad: !!(imagePaths['AP'] || padHasContent(assessmentPlanPad)),
                    addedLaterSheetIndices: addedLaterIndices(originalPadSheetCounts.ap, assessmentPlanPad)
                },
                serviceLines: serviceLines
                    .filter((line) => (line.diagnostic && String(line.diagnostic).trim()) && (line.billingCode && String(line.billingCode).trim()))
                    .map((line, i) => ({
                        serialNumber: i + 1,
                        service: line.billingCode,
                        diagnostic: line.diagnostic || '',
                        totalFee: parseFloat(line.totalFee) || 0
                    })),
                referral: {
                    ...referral,
                    addedLater: !(interaction.referral?.type) && !!referral.type
                },
                medications: medications.map((med, i) => ({
                    name: med.name || '',
                    dosage: (med.strength || '').trim(),
                    suspension: '',
                    frequency: med.frequency || '',
                    duration: med.duration || '',
                    refills: parseInt(med.repeat, 10) || 0,
                    instructions: '',
                    addedLater: med.addedLater === true || i >= initialMedicationCount
                })),
                followupRequired: {
                    required: followup.required || false,
                    date: followup.date || '',
                    followupInteractionId: interaction.followupRequired?.followupInteractionId || interaction.followup?.followupInteractionId || '',
                    addedLater: followup.addedLater === true || (!(interaction.followupRequired?.required && interaction.followupRequired?.date) && !!(followup.required && followup.date)),
                    intervalWeeks: followup.intervalWeeks != null ? followup.intervalWeeks : null,
                    intervalMonths: followup.intervalMonths != null ? followup.intervalMonths : null
                },
                savedNotes: updatedSavedNotes,
                editCount: nextEditCount,
                completed: true,
                started: true,
                ongoing: false,
                incomplete: false,
                billed: interaction.billed || false
            };
            await api.put(`/interactions/${activeInteractionId}/details`, payload);
            if (onRefreshInteractions) onRefreshInteractions();
            handleCloseEditMode();
        } catch (error) {
            console.error('Error saving edit:', error);
            showToast(`Error saving: ${error.response?.data?.error || error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addServiceLine = () => {
        if (serviceLines.length >= 4) {
            return;
        }
        // Copy diag code from last line (or first) so new line starts with it; each line stays independent after that
        const source = serviceLines[serviceLines.length - 1] || serviceLines[0];
        const copyDiag = source?.diagnostic || '';
        const copyDiagDesc = source?.diagnosticDescription || diagnostics.find(d => (d.code || '').toUpperCase() === (copyDiag || '').trim().toUpperCase())?.description || '';
        const newLine = {
            id: Date.now(),
            serialNumber: serviceLines.length + 1,
            diagnostic: copyDiag,
            diagnosticDescription: copyDiagDesc,
            billingCode: '',
            billingDescription: '',
            totalFee: ''
        };
        setServiceLines([...serviceLines, newLine]);
    };

    const updateServiceLine = (index, field, value) => {
        const updatedLines = [...serviceLines];
        updatedLines[index] = { ...updatedLines[index], [field]: value };

        if (field === 'diagnostic') {
            // Each line has its own diag; only update this line
            const foundDiag = diagnostics.find(d => (d.code || '').toUpperCase() === (value || '').trim().toUpperCase());
            const desc = foundDiag ? foundDiag.description : '';
            updatedLines[index].diagnosticDescription = desc;
        }

        if (field === 'billingCode') {
            const service = services.find(s => (s.code || '').toUpperCase() === (value || '').trim().toUpperCase());
            if (service) {
                updatedLines[index].billingDescription = service.description;
                const totalFee = (service.hcpFee || 0) + (service.tFee || 0) + (service.pFee || 0) + (service.sFee || 0);
                updatedLines[index].totalFee = totalFee.toFixed(2);
            } else {
                updatedLines[index].billingDescription = '';
                updatedLines[index].totalFee = '';
            }
        }
        setServiceLines(updatedLines);
    };

    // Helper wrapper for the old API which passed ID, I'll adapt OngoingInteractionsView to pass Index or map ID to Index
    // Actually, let's keep it ID based for consistency if possible, but the extraction passed index. 
    // Wait, the extracted component calls `updateServiceLine(index, ...)` so I should use index or change the component.
    // The component `OngoingInteractionsView` uses index in map `serviceLines.map((line, index) => ... updateServiceLine(index...)`.
    // So `updateServiceLine` here should take index.

    const removeServiceLine = (index) => {
        const updatedLines = serviceLines.filter((_, i) => i !== index);
        setServiceLines(updatedLines.map((line, i) => ({
            ...line,
            serialNumber: i + 1
        })));
    };

    const handleOpenPatientDetails = (visitorId) => {
        const v = visitors.find((v) => v.id === visitorId);
        if (!v) return;
        setSelectedPatient(v);
        setExpandedInteractionIds({});
        setShowPatientDetailModal(true);
    };

    return {
        selectedPatient,
        showPatientDetailModal,
        setShowPatientDetailModal,
        expandedInteractionIds,
        setExpandedInteractionIds,
        activeInteractionId,
        setActiveInteractionId,
        activeViewTab,
        setActiveViewTab,
        showCancelModal,
        setShowCancelModal,
        isCleaning,
        cleanupMessage,
        patientReports,
        isLoadingReports,
        loadReports,
        viewingMedia,
        setViewingMedia,
        ccReason,
        setCcReason,
        subjective,
        setSubjective,
        objective,
        setObjective,
        assessmentPlan,
        setAssessmentPlan,
        ccReasonPad,
        setCcReasonPad,
        subjectivePad,
        setSubjectivePad,
        objectivePad,
        setObjectivePad,
        assessmentPlanPad,
        setAssessmentPlanPad,
        serviceLines,
        addServiceLine,
        removeServiceLine,
        updateServiceLine,
        services,
        diagnostics,
        isSaving,
        activePatientVisitorId,
        scheduledInteractions,
        incompleteInteractions,
        completedInteractions,
        closedInteractions,
        ongoingInteractions,
        completedInteractionsForPatient,
        handleStartInteraction,
        handleSaveInteraction,
        handleSaveDraft,
        handleEditCompleted,
        handleCloseEditMode,
        handleSaveEdit,
        isEditingCompleted,
        isLoadingEdit,
        originalPadSheetCounts,
        confirmCancel,
        moveToIncomplete,
        handleOpenPatientDetails,
        referral,
        setReferral,
        medications,
        addMedication: () => setMedications([...medications, { name: '', strength: '', frequency: '', duration: '', repeat: 0, addedLater: isEditingCompleted }]),
        removeMedication: (index) => setMedications(medications.filter((_, i) => i !== index)),
        updateMedication: (index, field, value) => {
            const updated = [...medications];
            updated[index] = { ...updated[index], [field]: value };
            setMedications(updated);
        },
        additionalNotes,
        setAdditionalNotes,
        savedNotes,
        followup,
        setFollowup
    };
};

export default useOfficerTab;
