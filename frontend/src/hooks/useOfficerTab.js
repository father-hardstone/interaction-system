import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { reportService } from '../services/reportService';
import { useMasterData } from '../contexts/MasterDataContext';
import supabaseStorageService from '../services/supabaseService';

/** Parse pad value into sheets array (legacy single or JSON array). */
function parsePadSheets(padValue) {
    if (!padValue) return [''];
    if (typeof padValue === 'string' && padValue.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(padValue);
            return Array.isArray(arr) ? arr : [padValue];
        } catch {
            return [padValue];
        }
    }
    return [padValue];
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

const useOfficerTab = (userData, interactions, visitors, onRefreshInteractions) => {
    const { services = [], diagnostics = [] } = useMasterData();
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
    const [followup, setFollowup] = useState({ required: false, date: '' });

    const [isSaving, setIsSaving] = useState(false);

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

    const scheduledInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => !i.completed && !i.ongoing && !i.incomplete
        );
    }, [doctorInteractions]);

    const incompleteInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.incomplete && !i.completed
        );
    }, [doctorInteractions]);

    const completedInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.completed
        ).sort((a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime());
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
        setReferral({ type: '', reason: '', to: '', date: '' });
        setMedications([]);
        setAdditionalNotes('');
        setSavedNotes([]);
        setFollowup({ required: false, date: '' });
    };

    const loadInteractionToState = (interaction) => {
        if (!interaction) return;

        setCcReason(interaction.ccReason?.text || '');
        setCcReasonPad(interaction.ccReason?.scratchpad || '');

        setSubjective(interaction.subjective?.text || '');
        setSubjectivePad(interaction.subjective?.scratchpad || '');

        setObjective(interaction.objective?.text || '');
        setObjectivePad(interaction.objective?.scratchpad || '');

        setAssessmentPlan(interaction.assessmentPlan?.text || '');
        setAssessmentPlanPad(interaction.assessmentPlan?.scratchpad || '');

        if (interaction.serviceLines && interaction.serviceLines.length > 0) {
            const firstDiag = interaction.serviceLines[0]?.diagnostic || '';
            const firstDiagDesc = diagnostics.find(d => (d.code || '').toUpperCase() === (firstDiag || '').trim().toUpperCase())?.description || '';
            setServiceLines(interaction.serviceLines.map((line, i) => ({
                id: Math.random(),
                serialNumber: line.serialNumber || i + 1,
                diagnostic: firstDiag,
                diagnosticDescription: firstDiagDesc,
                billingCode: line.service || '',
                billingDescription: services.find(s => (s.code || '').toUpperCase() === (line.service || '').trim().toUpperCase())?.description || '',
                totalFee: line.totalFee !== undefined ? line.totalFee.toString() : ''
            })));
        } else {
            resetInteractionFields();
        }

        setReferral(interaction.referral || { type: '', reason: '', to: '', date: '' });
        setMedications((interaction.medications || []).map(med => {
            const dosage = med.dosage || '';
            const match = dosage.match(/^(\d*\.?\d*)(.*)$/);
            const dosageAmount = match ? match[1] : '';
            const dosageUnit = (match && match[2] ? match[2].trim().toLowerCase() : '') || '';
            return {
                name: med.name || '',
                dosageAmount: med.dosageAmount ?? dosageAmount,
                dosageUnit: med.dosageUnit ?? dosageUnit,
                suspension: med.suspension || 'tablet',
                frequency: med.frequency || '',
                duration: med.duration || '',
                refills: med.refills ?? 0,
            };
        }));
        setSavedNotes(interaction.savedNotes || []);
        const fr = interaction.followupRequired || interaction.followup;
        setFollowup(fr ? { required: fr.required, date: fr.date || '' } : { required: false, date: '' });
        setAdditionalNotes(''); // Always clear input on load
    };

    // Recovery effect
    useEffect(() => {
        if (!hasRecovered && activeInteractionId && interactions.length > 0 && services.length > 0 && diagnostics.length > 0) {
            const activeInt = interactions.find(i => i.id === activeInteractionId);
            if (activeInt && !activeInt.completed) {
                loadInteractionToState(activeInt);
                setHasRecovered(true);
            } else if (activeInt && activeInt.completed) {
                setActiveInteractionId(null);
                setActiveViewTab('scheduled');
            }
        }
    }, [interactions, activeInteractionId, services, diagnostics, hasRecovered]);

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

    const handleStartInteraction = async (interactionId) => {
        const currentOngoing = ongoingInteractions.find(i => i.id !== interactionId);
        if (currentOngoing && activeViewTab !== 'ongoing') {
            alert('You already have an interaction in progress. Please complete or pause it before starting a new one.');
            setActiveViewTab('ongoing');
            return;
        }

        const interaction = interactions.find(i => i.id === interactionId);
        if (interaction) {
            loadInteractionToState(interaction);
        } else {
            resetInteractionFields();
        }

        setActiveInteractionId(interactionId);

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

    const confirmCancel = async () => {
        if (!activeInteractionId) {
            alert('No active interaction selected to cancel.');
            return;
        }
        try {
            await api.put(`/interactions/${activeInteractionId}/details`, {
                started: false,
                ongoing: false,
                incomplete: false,
                completed: false,
                billed: false
            });
            setShowCancelModal(false);
            resetInteractionFields();
            setActiveInteractionId(null);
            setActiveViewTab('scheduled');
            if (onRefreshInteractions) onRefreshInteractions();
        } catch (error) {
            console.error('Error canceling interaction:', error);
            alert('Failed to cancel interaction');
        }
    };

    const moveToIncomplete = async () => {
        if (!activeInteractionId) {
            alert('No active interaction selected to move.');
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
            if (onRefreshInteractions) onRefreshInteractions();
        } catch (error) {
            console.error('Error moving interaction to incomplete:', error);
            alert('Failed to move interaction to incomplete');
        } finally {
            setIsSaving(false);
        }
    };

    const saveInteractionData = async (statusOverride = {}) => {
        if (!activeInteractionId) return null;

        const activeInteraction = interactions.find(i => i.id === activeInteractionId);
        if (!activeInteraction) return null;

        const { entityId, entitySerial, visitorSerial, interactionSerial } = activeInteraction;

        // Save scratchpads to Supabase - each sheet uploaded with 1,2,3,4 suffix
        const imagePaths = {};
        const fieldConfigs = [
            { name: 'CC', pad: ccReasonPad, existing: activeInteraction.ccReason?.scratchpad || '' },
            { name: 'S', pad: subjectivePad, existing: activeInteraction.subjective?.scratchpad || '' },
            { name: 'O', pad: objectivePad, existing: activeInteraction.objective?.scratchpad || '' },
            { name: 'AP', pad: assessmentPlanPad, existing: activeInteraction.assessmentPlan?.scratchpad || '' }
        ];

        for (const field of fieldConfigs) {
            const sheets = parsePadSheets(field.pad);
            const existingPaths = parsePadSheets(field.existing);
            const paths = [];

            for (let i = 0; i < sheets.length; i++) {
                const sheet = sheets[i];
                const suffix = i + 1;
                const fieldNameWithSuffix = `${field.name}${suffix}`;

                if (sheet && sheet.startsWith('data:image')) {
                    const existingPath = existingPaths[i];
                    const isSupabasePath = existingPath && existingPath.includes('/interactions/');
                    if (isSupabasePath) {
                        paths[i] = existingPath;
                    } else {
                        try {
                            const supabasePath = await supabaseStorageService.uploadInteractionScratchpad(
                                sheet,
                                entityId,
                                activeInteractionId,
                                fieldNameWithSuffix
                            );
                            paths[i] = supabasePath;
                        } catch (error) {
                            console.error(`Error saving ${fieldNameWithSuffix} to Supabase:`, error);
                            paths[i] = '';
                        }
                    }
                } else if (sheet && sheet.includes('/interactions/')) {
                    paths[i] = sheet;
                } else if (existingPaths[i] && sheet !== '') {
                    paths[i] = existingPaths[i];
                } else {
                    paths[i] = '';
                }
            }

            const hasAny = paths.some(Boolean);
            if (!hasAny) {
                imagePaths[field.name] = '';
            } else if (paths.length === 1) {
                imagePaths[field.name] = paths[0] || '';
            } else {
                imagePaths[field.name] = JSON.stringify(paths);
            }
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
            serviceLines: serviceLines.map(line => ({
                serialNumber: line.serialNumber,
                service: line.billingCode,
                diagnostic: line.diagnostic,
                totalFee: parseFloat(line.totalFee) || 0
            })),
            referral,
            medications: medications.map(med => ({
                name: med.name || '',
                dosage: [med.dosageAmount, med.dosageUnit].filter(Boolean).join('') || '',
                suspension: med.suspension || '',
                frequency: med.frequency || '',
                duration: med.duration || '',
                refills: parseInt(med.refills, 10) || 0,
                instructions: ''
            })),
            followupRequired: {
                required: followup.required || false,
                date: followup.date || '',
                followupInteractionId: (interactions.find(i => i.id === activeInteractionId)?.followupRequired?.followupInteractionId || interactions.find(i => i.id === activeInteractionId)?.followupInteractionId || '')
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
            alert('CC / reason is required');
            return;
        }
        if (!subjective.trim() && !padHasContent(subjectivePad)) {
            alert('S (Subjective) is required');
            return;
        }
        if (!objective.trim() && !padHasContent(objectivePad)) {
            alert('O (Objective) is required');
            return;
        }

        setIsSaving(true);
        try {
            await saveInteractionData({ completed: true });
            alert('Interaction saved successfully!');
        } catch (error) {
            console.error('Error saving interaction:', error);
            alert(`Error saving interaction: ${error.response?.data?.error || error.message}`);
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
            await saveInteractionData({ ongoing: true, incomplete: false, completed: false });
            alert('Draft saved successfully!');
            if (onRefreshInteractions) onRefreshInteractions();
        } catch (error) {
            console.error('Error saving draft:', error);
            alert(`Error saving draft: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const addServiceLine = () => {
        if (serviceLines.length >= 4) {
            return;
        }
        const sharedDiag = serviceLines[0]?.diagnostic || '';
        const sharedDiagDesc = serviceLines[0]?.diagnosticDescription || '';
        const newLine = {
            id: Date.now(),
            serialNumber: serviceLines.length + 1,
            diagnostic: sharedDiag,
            diagnosticDescription: sharedDiagDesc,
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
            // One diagnostic for all rows: replicate to every line
            const foundDiag = diagnostics.find(d => (d.code || '').toUpperCase() === (value || '').trim().toUpperCase());
            const desc = foundDiag ? foundDiag.description : '';
            updatedLines.forEach((line, i) => {
                updatedLines[i] = { ...line, diagnostic: value, diagnosticDescription: desc };
            });
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
        ongoingInteractions,
        completedInteractionsForPatient,
        handleStartInteraction,
        handleSaveInteraction,
        handleSaveDraft,
        confirmCancel,
        moveToIncomplete,
        handleOpenPatientDetails,
        referral,
        setReferral,
        medications,
        addMedication: () => setMedications([...medications, { name: '', dosageAmount: '', dosageUnit: '', suspension: 'tablet', frequency: '', duration: '', refills: 0 }]),
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
