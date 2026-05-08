import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useOfficerTab from '../hooks/useOfficerTab';
import ScheduledInteractionsTable from './ScheduledInteractionsTable';
import IncompleteInteractionsTable from './IncompleteInteractionsTable';
import OngoingInteractionsView from './OngoingInteractionsView';
import CompletedInteractionsTable from './CompletedInteractionsTable';
import PatientDetailsModal from './PatientDetailsModal';
import CancelInteractionModal from './CancelInteractionModal';
import MediaViewerModal from './MediaViewerModal';
import PastInteractionsSidebar from './PastInteractionsSidebar';
import ReportDetailsModal from './ReportDetailsModal';
import TakeActionModal from './TakeActionModal';
import { reportService } from '../services/reportService';
import supabaseStorageService from '../services/supabaseService';
import { formatDateMMDDYYYY, getVisitorSerialDisplay } from '../utils/formatUtils';

const OFFICER_MAIN_TABS = {
    INTERACTIONS: 'interactions',
    REPORT_REVIEWS: 'report_reviews'
};

const OfficerTab = ({ userData, interactions, lastVisits = {}, visitors, isLoadingInteractions = false, onRefreshInteractions, onInteractionClick, handleRegisterPatient, interactionFilter = 'all', setInteractionFilter }) => {
    const [activeMainTab, setActiveMainTab] = useState(OFFICER_MAIN_TABS.INTERACTIONS);

    const {
        selectedPatient,
        showPatientDetailModal,
        setShowPatientDetailModal,
        activeInteractionId,
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
        ccReason, setCcReason,
        subjective, setSubjective,
        objective, setObjective,
        assessmentPlan, setAssessmentPlan,
        ccReasonPad, setCcReasonPad,
        subjectivePad, setSubjectivePad,
        objectivePad, setObjectivePad,
        assessmentPlanPad, setAssessmentPlanPad,
        serviceLines,
        addServiceLine,
        removeServiceLine,
        updateServiceLine,
        services,
        diagnostics,
        isSaving,
        activePatientVisitorId,
        pastInteractionsForSidebar,
        scheduledInteractions,
        phoneConsultInteractions,
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
        openBillingTabNext,
        setOpenBillingTabNext,
        isEditingCompleted,
        isLoadingEdit,
        originalPadSheetCounts,
        confirmCancel,
        moveToIncomplete,
        handleOpenPatientDetails,
        referral,
        setReferral,
        medications,
        addMedication,
        removeMedication,
        updateMedication,
        additionalNotes,
        setAdditionalNotes,
        savedNotes,
        followup,
        setFollowup,
        vitals,
        setVitals
    } = useOfficerTab(userData, interactions, visitors, onRefreshInteractions);

    const [showPatientHistoryOverlay, setShowPatientHistoryOverlay] = useState(false);

    // Closed interactions tab is temporarily hidden (code kept, UI removed).
    useEffect(() => {
        if (activeViewTab === 'closed') setActiveViewTab('completed');
    }, [activeViewTab, setActiveViewTab]);

    const handleOpenLabRequisition = useCallback(
        (interaction) => {
            if (!interaction?.id) return;
            const currentPath = window.location.pathname || '';
            const parts = currentPath.split('/').filter(Boolean);
            const serialFromPath = parts[0] || '';
            if (!serialFromPath) return;
            const url = `/${serialFromPath}/user/dashboard/lab-requisition/${interaction.id}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        },
        []
    );

    const handleOpenReferralForm = useCallback((interaction, referralType) => {
        if (!interaction?.id) return;
        const type = String(referralType || '').trim();
        const currentPath = window.location.pathname || '';
        const parts = currentPath.split('/').filter(Boolean);
        const serialFromPath = parts[0] || '';
        if (!serialFromPath) return;

        if (type === 'lab') {
            const url = `/${serialFromPath}/user/dashboard/lab-requisition/${interaction.id}`;
            window.open(url, '_blank', 'noopener,noreferrer');
            return;
        }

        const slug =
            type === 'general_services_claim'
                ? 'general-services-claim'
                : type === 'diagnostic'
                  ? 'diagnostic'
                  : type === 'cardio_health'
                    ? 'cardio-health'
                    : '';

        if (!slug) return;
        const url = `/${serialFromPath}/user/dashboard/forms/${slug}/${interaction.id}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    /** When starting from Phone consults tab, switch to Interactions main tab so the ongoing panel is visible. */
    const handleStartInteractionFromUI = useCallback((interactionId) => {
        if (activeViewTab === 'phone_consults') {
            setActiveViewTab('ongoing');
        }
        handleStartInteraction(interactionId);
    }, [activeViewTab, setActiveViewTab, handleStartInteraction]);

    // Report reviews tab
    const [reportsForReview, setReportsForReview] = useState([]);
    const [isLoadingReportsForReview, setIsLoadingReportsForReview] = useState(false);
    const [reportReviewUrls, setReportReviewUrls] = useState({});
    const [viewingReportForReview, setViewingReportForReview] = useState(null);
    const [isSigningReport, setIsSigningReport] = useState(false);
    const [showTakeActionModal, setShowTakeActionModal] = useState(false);
    const [reportForTakeAction, setReportForTakeAction] = useState(null);
    const [actionConfirmation, setActionConfirmation] = useState(null); // { report, actionType }
    const [resultFilter, setResultFilter] = useState('all');

    const handleConfirmAction = async () => {
        if (!actionConfirmation) return;
        const { report, actionType } = actionConfirmation;
        setIsSigningReport(true);
        try {
            // Sign and set action
            await reportService.updateReport(report.id, {
                signed: true,
                action: actionType,
                reviewed: true
            });

            // If phone or followup, trigger registration
            if (actionType === 'phone_consult' || actionType === 'followup') {
                const visitor = visitors.find(v => v.id === report.patientId);
                if (visitor && handleRegisterPatient && userData?.id && userData?.serial) {
                    const config = actionType === 'phone_consult'
                        ? {
                            reasonForVisit: 'new_visit',
                            visitMode: 'on_phone',
                            assignToOfficerId: userData.id,
                            assignOfficerSerial: userData.serial
                        }
                        : {
                            reasonForVisit: 'followup',
                            visitMode: 'physical',
                            parentInteractionId: '',
                            assignToOfficerId: userData.id,
                            assignOfficerSerial: userData.serial
                        };
                    await handleRegisterPatient(visitor, config);
                    onRefreshInteractions?.();
                }
            }

            loadReportsForReview();
            setActionConfirmation(null);
        } catch (err) {
            console.error('Failed to take action:', err);
        } finally {
            setIsSigningReport(false);
        }
    };

    const loadReportsForReview = useCallback(async () => {
        const entityId = userData?.entityId;
        if (!entityId) return;
        setIsLoadingReportsForReview(true);
        try {
            const list = await reportService.getForReview(entityId, resultFilter);
            setReportsForReview(list || []);
        } catch (err) {
            console.error('Failed to load reports for review:', err);
            setReportsForReview([]);
        } finally {
            setIsLoadingReportsForReview(false);
        }
    }, [userData?.entityId, resultFilter]);

    // Load report reviews when Officer tab mounts (so "Report reviews (N)" count is correct upfront)
    useEffect(() => {
        if (userData?.entityId) {
            loadReportsForReview();
        }
    }, [userData?.entityId, loadReportsForReview]);

    useEffect(() => {
        if (activeMainTab === OFFICER_MAIN_TABS.REPORT_REVIEWS && userData?.entityId) {
            loadReportsForReview();
        }
    }, [activeMainTab, userData?.entityId, loadReportsForReview]);

    const [loadingReportUrl, setLoadingReportUrl] = useState(false);

    useEffect(() => {
        if (!viewingReportForReview?.fileMetadata?.supabasePath) {
            setLoadingReportUrl(false);
            return;
        }
        const path = viewingReportForReview.fileMetadata.supabasePath;
        if (reportReviewUrls[path]) {
            setLoadingReportUrl(false);
            return;
        }
        let cancelled = false;
        setLoadingReportUrl(true);
        supabaseStorageService.getFileUrl('CRM testing', path)
            .then((url) => {
                if (!cancelled) {
                    setReportReviewUrls(prev => ({ ...prev, [path]: url }));
                }
            })
            .catch((e) => {
                if (!cancelled) console.error(`Error fetching URL for report ${viewingReportForReview.id}:`, e);
            })
            .finally(() => {
                if (!cancelled) setLoadingReportUrl(false);
            });
        return () => { cancelled = true; };
    }, [viewingReportForReview?.id, viewingReportForReview?.fileMetadata?.supabasePath]);

    const getReportUrlForReview = (report) => {
        if (!report?.fileMetadata?.supabasePath) return null;
        return reportReviewUrls[report.fileMetadata.supabasePath] || null;
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
            return imagePath;
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${API_URL.replace('/api', '')}/${imagePath}`;
    };

    const getVisitorName = (visitorId) => {
        const v = visitors.find((v) => v.id === visitorId);
        if (!v) return 'Unknown patient';
        return `${v.firstName || ''}${v.firstName ? ' ' : ''}${v.middleName ? v.middleName + ' ' : ''}${v.lastName || ''}`.trim() || 'Unknown patient';
    };

    const getVisitorSerial = (visitorId) => {
        const v = visitors.find((v) => v.id === visitorId);
        if (!v) return 'N/A';
        const raw = v.serial ?? (v.entitySerial ? `${v.entitySerial}-${v.serial || ''}` : v.serial || '');
        if (!raw) return 'N/A';
        const s = String(raw);
        const num = s.includes('-') ? s.split('-').pop() : s;
        return num ? String(num).padStart(6, '0') : 'N/A';
    };

    const formatDate = (dateString, includeTime = true) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        const datePart = `${mm}-${dd}-${yyyy}`;

        if (!includeTime) return datePart;

        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${datePart} ${hh}:${min}`;
    };

    // Tab counts: number of entries in each tab's table
    const mainTabCounts = useMemo(() => ({
        interactions: scheduledInteractions.length + phoneConsultInteractions.length + ongoingInteractions.length + incompleteInteractions.length + completedInteractions.length,
        reportReviews: reportsForReview.length
    }), [scheduledInteractions.length, phoneConsultInteractions.length, ongoingInteractions.length, incompleteInteractions.length, completedInteractions.length, reportsForReview.length]);

    return (
        <div className="flex flex-col min-h-0 flex-1 space-y-6 overflow-hidden">
            {/* Main tab row: Interactions | Phone consults | Report reviews — and time filter when not on Report reviews */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveMainTab(OFFICER_MAIN_TABS.INTERACTIONS)}
                        className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all shrink-0 ${activeMainTab === OFFICER_MAIN_TABS.INTERACTIONS ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Interactions ({mainTabCounts.interactions})
                    </button>
                    <button
                        onClick={() => setActiveMainTab(OFFICER_MAIN_TABS.REPORT_REVIEWS)}
                        className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all shrink-0 ${activeMainTab === OFFICER_MAIN_TABS.REPORT_REVIEWS ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Report reviews ({mainTabCounts.reportReviews})
                    </button>
                </div>
                {/* 
                {activeMainTab !== OFFICER_MAIN_TABS.REPORT_REVIEWS && !(activeMainTab === OFFICER_MAIN_TABS.INTERACTIONS && activeViewTab === 'ongoing') && setInteractionFilter && (
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold normal-case tracking-wide text-slate-500">Time filter</span>
                        <div className="flex bg-slate-200/50 p-1 rounded-xl flex-wrap gap-1">
                            {['today', 'this_week', 'this_month', 'last_three_months', 'all'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setInteractionFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${interactionFilter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    {f === 'this_week' ? 'This week' : f === 'this_month' ? 'This month' : f === 'last_three_months' ? 'Last 3 months' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                */}
            </div>

            {/* Interactions tab: existing sub-tabs and content (unchanged) */}
            {activeMainTab === OFFICER_MAIN_TABS.INTERACTIONS && (
            <>
            {/* Tab Navigation – compact like Operations > Interactions (doctor tabs) */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200 w-fit overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveViewTab('scheduled')}
                    className={`flex items-center gap-1.5 min-w-0 px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${activeViewTab === 'scheduled' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Scheduled ({scheduledInteractions.length})
                </button>
                <button
                    onClick={() => setActiveViewTab('phone_consults')}
                    className={`flex items-center gap-1.5 min-w-0 px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${activeViewTab === 'phone_consults' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone consults ({phoneConsultInteractions.length})
                </button>
                <button
                    onClick={() => setActiveViewTab('ongoing')}
                    className={`flex items-center gap-1.5 min-w-0 px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${activeViewTab === 'ongoing' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isEditingCompleted ? 'Editing interaction' : `Ongoing (${ongoingInteractions.length})`}
                </button>
                <button
                    onClick={() => setActiveViewTab('incomplete')}
                    className={`flex items-center gap-1.5 min-w-0 px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${activeViewTab === 'incomplete' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Incomplete ({incompleteInteractions.length})
                </button>
                <button
                    onClick={() => setActiveViewTab('completed')}
                    className={`flex items-center gap-1.5 min-w-0 px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${activeViewTab === 'completed' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Completed ({completedInteractions.length})
                </button>
                {/*
                // Closed tab hidden for now (kept for later use)
                <button
                    onClick={() => setActiveViewTab('closed')}
                    className={`flex items-center gap-1.5 min-w-0 px-2 py-1 rounded text-xs font-medium transition-all shrink-0 ${activeViewTab === 'closed' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Closed ({closedInteractions.length})
                </button>
                */}
            </div>

            {/* Scheduled Tab */}
            {activeViewTab === 'scheduled' && (
                <div className="flex flex-col flex-1 min-h-0">
                    <ScheduledInteractionsTable
                    scheduledInteractions={scheduledInteractions}
                    isLoading={isLoadingInteractions}
                    handleOpenPatientDetails={handleOpenPatientDetails}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    handleStartInteraction={handleStartInteraction}
                    ongoingInteractions={ongoingInteractions}
                    blockStartNewInteraction={ongoingInteractions.length > 0 || (isEditingCompleted && !!activeInteractionId)}
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                    lastVisits={lastVisits}
                    visitors={visitors}
                />
                </div>
            )}

            {/* Completed Tab */}
            {activeViewTab === 'completed' && (
                <div className="flex flex-col flex-1 min-h-0">
                    <CompletedInteractionsTable
                        variant="completed"
                        completedInteractions={completedInteractions}
                        isLoading={isLoadingInteractions}
                        handleOpenPatientDetails={handleOpenPatientDetails}
                        getVisitorName={getVisitorName}
                        getVisitorSerial={getVisitorSerial}
                        formatDate={formatDate}
                        onInteractionClick={onInteractionClick}
                        onEditCompleted={handleEditCompleted}
                        blockEditCompleted={ongoingInteractions.length > 0}
                        interactions={interactions}
                        lastVisits={lastVisits}
                        title="Completed interactions"
                        emptyMessage="No completed interactions"
                        loadingMessage="Loading completed interactions…"
                    />
                </div>
            )}

            {/*
            // Closed tab panel hidden for now (kept for later use)
            {activeViewTab === 'closed' && (
                <div className="flex flex-col flex-1 min-h-0">
                    <CompletedInteractionsTable
                        variant="closed"
                        completedInteractions={closedInteractions}
                        isLoading={isLoadingInteractions}
                        handleOpenPatientDetails={handleOpenPatientDetails}
                        getVisitorName={getVisitorName}
                        getVisitorSerial={getVisitorSerial}
                        formatDate={formatDate}
                        onInteractionClick={onInteractionClick}
                        onEditCompleted={handleEditCompleted}
                        blockEditCompleted={ongoingInteractions.length > 0}
                        interactions={interactions}
                        lastVisits={lastVisits}
                        title="Closed interactions"
                        emptyMessage="No closed interactions"
                        loadingMessage="Loading closed interactions…"
                    />
                </div>
            )}
            */}

            {/* Incomplete Tab */}
            {activeViewTab === 'incomplete' && (
                <div className="flex flex-col flex-1 min-h-0">
                    <IncompleteInteractionsTable
                    incompleteInteractions={incompleteInteractions}
                    isLoading={isLoadingInteractions}
                    handleOpenPatientDetails={handleOpenPatientDetails}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    handleStartInteraction={handleStartInteraction}
                    blockResume={ongoingInteractions.length > 0 || (isEditingCompleted && !!activeInteractionId)}
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                />
                </div>
            )}

            {/* Ongoing Tab */}
            {activeViewTab === 'ongoing' && (
                <div className="flex flex-col xl:flex-row gap-6 items-stretch h-[calc(100vh-140px)] min-h-0 overflow-hidden">
                    <div className="flex-1 w-full xl:min-w-0 min-h-0 overflow-hidden flex flex-col relative">
                        {/* Patient History button - inside ongoing content, top-right, small screens only */}
                        {activeInteractionId && (
                            <div className="xl:hidden absolute top-0 right-0 z-20 pt-2 pr-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPatientHistoryOverlay(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700"
                                >
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Patient History
                                </button>
                            </div>
                        )}
                        <OngoingInteractionsView
                            isLoading={isLoadingInteractions}
                            isLoadingEdit={isLoadingEdit}
                            originalPadSheetCounts={originalPadSheetCounts}
                            ongoingInteractions={ongoingInteractions}
                            editingInteraction={isEditingCompleted ? (interactions.find(i => i.id === activeInteractionId) || null) : null}
                            initialSubTab={openBillingTabNext ? 'billing' : undefined}
                            onClearInitialSubTab={() => setOpenBillingTabNext(false)}
                            visitors={visitors}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}
                            setShowCancelModal={setShowCancelModal}
                            handleOpenPatientDetails={handleOpenPatientDetails}
                            ccReason={ccReason}
                            setCcReason={setCcReason}
                            ccReasonPad={ccReasonPad}
                            setCcReasonPad={setCcReasonPad}
                            subjective={subjective}
                            setSubjective={setSubjective}
                            subjectivePad={subjectivePad}
                            setSubjectivePad={setSubjectivePad}
                            objective={objective}
                            setObjective={setObjective}
                            objectivePad={objectivePad}
                            setObjectivePad={setObjectivePad}
                            assessmentPlan={assessmentPlan}
                            setAssessmentPlan={setAssessmentPlan}
                            assessmentPlanPad={assessmentPlanPad}
                            setAssessmentPlanPad={setAssessmentPlanPad}
                            serviceLines={serviceLines}
                            addServiceLine={addServiceLine}
                            removeServiceLine={removeServiceLine}
                            updateServiceLine={updateServiceLine}
                            services={services}
                            diagnostics={diagnostics}
                            handleSaveInteraction={handleSaveInteraction}
                            handleSaveDraft={handleSaveDraft}
                            handleSaveEdit={handleSaveEdit}
                            handleCloseEditMode={handleCloseEditMode}
                            isEditingCompleted={isEditingCompleted}
                            patientReports={patientReports}
                            loadReports={loadReports}
                            setViewingMedia={setViewingMedia}
                            isSaving={isSaving}
                            referral={referral}
                            setReferral={setReferral}
                            medications={medications}
                            addMedication={addMedication}
                            removeMedication={removeMedication}
                            updateMedication={updateMedication}
                            additionalNotes={additionalNotes}
                            setAdditionalNotes={setAdditionalNotes}
                            savedNotes={savedNotes}
                            followup={followup}
                            setFollowup={setFollowup}
                            formatDate={formatDate}
                            onInteractionClick={onInteractionClick}
                            interactions={interactions}
                            doctorName={userData?.name || ''}
                            doctorBillingNumber={userData?.billingNumber || ''}
                            onOpenLabRequisition={handleOpenLabRequisition}
                            onOpenReferralForm={handleOpenReferralForm}
                            vitals={vitals}
                            setVitals={setVitals}
                        />
                    </div>
                    {/* Patient History - sidebar on xl+, overlay on smaller screens */}
                    {activeInteractionId && (
                        <>
                            {/* Desktop: sidebar beside ongoing */}
                            <div className="hidden xl:flex xl:max-h-full xl:min-h-0 xl:overflow-hidden shrink-0 flex-col">
                                <PastInteractionsSidebar
                                    activePatientVisitorId={activePatientVisitorId}
                                    visitor={visitors.find((v) => v.id === activePatientVisitorId)}
                                    interactions={interactions}
                                    pastInteractionsOverride={pastInteractionsForSidebar}
                                    activeInteractionId={activeInteractionId}
                                    patientReports={patientReports}
                                    onInteractionClick={onInteractionClick}
                                />
                            </div>
                            {/* Small screen: side drawer with shaded backdrop */}
                            <div className={`xl:hidden fixed inset-0 z-[60] pointer-events-none transition-opacity duration-300 ${showPatientHistoryOverlay ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} aria-hidden={!showPatientHistoryOverlay}>
                                {/* Shaded backdrop - click to close */}
                                <div
                                    className="absolute inset-0 bg-black/50"
                                    onClick={() => setShowPatientHistoryOverlay(false)}
                                    aria-hidden="true"
                                />
                                {/* Side drawer panel - slides in from right, starts below top bar */}
                                <div
                                    className={`absolute top-14 right-0 h-[calc(100vh-3.5rem)] w-[307px] max-w-[85vw] bg-white shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-out rounded-tl-xl ${showPatientHistoryOverlay ? 'translate-x-0' : 'translate-x-full'}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close button at top of drawer */}
                                    {/* <div className="flex justify-end p-3 border-b border-slate-100 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowPatientHistoryOverlay(false)}
                                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                                            title="Close"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div> */}
                                    <PastInteractionsSidebar
                                        isOverlay={true}
                                        activePatientVisitorId={activePatientVisitorId}
                                        visitor={visitors.find((v) => v.id === activePatientVisitorId)}
                                        interactions={interactions}
                                        pastInteractionsOverride={pastInteractionsForSidebar}
                                        activeInteractionId={activeInteractionId}
                                        patientReports={patientReports}
                                        onInteractionClick={onInteractionClick}
                                        onCloseOverlay={() => setShowPatientHistoryOverlay(false)}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Phone Consults Tab */}
            {activeViewTab === 'phone_consults' && (
                <div className="flex flex-col flex-1 min-h-0">
                    <ScheduledInteractionsTable
                        scheduledInteractions={phoneConsultInteractions}
                        isLoading={isLoadingInteractions}
                        handleOpenPatientDetails={handleOpenPatientDetails}
                        getVisitorName={getVisitorName}
                        getVisitorSerial={getVisitorSerial}
                        formatDate={formatDate}
                        handleStartInteraction={handleStartInteractionFromUI}
                        ongoingInteractions={ongoingInteractions}
                        blockStartNewInteraction={ongoingInteractions.length > 0 || (isEditingCompleted && !!activeInteractionId)}
                        onInteractionClick={onInteractionClick}
                        interactions={interactions}
                        lastVisits={lastVisits}
                        visitors={visitors}
                        hideWaitingTime={true}
                        title="Phone consults"
                        subtitle="Phone consultations assigned to you"
                        emptyMessage="No phone consults"
                        loadingMessage="Loading phone consults…"
                        showPhoneColumn={true}
                    />
                </div>
            )}
            </>
            )}



            {/* Report reviews */}
            {activeMainTab === OFFICER_MAIN_TABS.REPORT_REVIEWS && (
                <div className="flex flex-col flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                    <div className="mb-4 shrink-0">
                        <h2 className="text-lg font-semibold text-slate-900">Report reviews</h2>
                        <p className="text-xs text-slate-500 mt-1">Unreviewed reports from any upload</p>
                    </div>
                    <div className="overflow-x-auto flex-1 min-h-0 border border-slate-100 rounded-lg">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700">Patient ID</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 border-l border-slate-100">Report details</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 border-l border-slate-100">Patient</th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 border-l border-slate-100">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>Result</span>
                                            <select 
                                                value={resultFilter} 
                                                onChange={(e) => setResultFilter(e.target.value)}
                                                className="text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="all">All</option>
                                                <option value="positive">Positive</option>
                                                <option value="negative">Negative</option>
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 border-l border-slate-100">Status</th>
                                    <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-slate-700 border-l border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingReportsForReview ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
                                                <span className="text-slate-500 text-sm font-medium">Loading reports…</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportsForReview.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-slate-400 text-sm">No reports to review</td>
                                    </tr>
                                ) : (
                                    reportsForReview.map((report) => {
                                        const visitor = visitors.find((v) => v.id === report.patientId);
                                        const reportTypeLabel = (report.reportType || '').replace(/_/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || '—';
                                        const isSigned = !!report.signed;
                                        return (
                                            <tr
                                                key={report.id}
                                                onClick={() => setViewingReportForReview(report)}
                                                className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-3 sm:px-4 py-3 align-middle text-sm font-bold text-slate-900">
                                                    {visitor ? getVisitorSerialDisplay(visitor) : '—'}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">
                                                    <div>{reportTypeLabel}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        Procedure: {formatDateMMDDYYYY(report.procedureDate) || '—'} · {report.labMetadata?.labName ? `Lab: ${report.labMetadata.labName}` : ''}
                                                        {report.notes ? ` · ${String(report.notes).slice(0, 40)}${report.notes.length > 40 ? '…' : ''}` : ''}
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">
                                                    {visitor ? (
                                                        <>
                                                            <span className="font-medium">{getVisitorName(visitor.id)}</span>
                                                            <span className="text-slate-500"> · DOB: {formatDateMMDDYYYY(visitor.dateOfBirth) || '—'}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 align-middle border-l border-slate-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${report?.result?.toLowerCase() === 'negative' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${report?.result?.toLowerCase() === 'negative' ? 'text-green-700' : 'text-red-700'}`}>
                                                            {report?.result || 'Positive'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 align-middle border-l border-slate-100">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${isSigned ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-orange-100 text-orange-800 border border-orange-300'}`}>
                                                        {isSigned 
                                                            ? (report.action === 'other' || !report.action ? 'Signed' : (report.action === 'phone_consult' ? 'Phone consult' : 'Followup'))
                                                            : 'Under review'}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-4 py-3 align-middle text-right border-l border-slate-100" onClick={(e) => e.stopPropagation()}>
                                                    {!isSigned && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setActionConfirmation({ report, actionType: 'phone_consult' })}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                                            >
                                                                Phone consult
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActionConfirmation({ report, actionType: 'followup' })}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                                            >
                                                                Followup
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setActionConfirmation({ report, actionType: 'other' })}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                                                            >
                                                                Other
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showPatientDetailModal && selectedPatient && (
                <PatientDetailsModal
                    selectedPatient={selectedPatient}
                    setShowPatientDetailModal={setShowPatientDetailModal}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    completedInteractionsForPatient={completedInteractionsForPatient}
                    lastVisits={lastVisits}
                    formatDate={formatDate}
                    onInteractionClick={onInteractionClick}
                    getImageUrl={getImageUrl}
                    setViewingMedia={setViewingMedia}
                    isLoadingReports={isLoadingReports}
                    patientReports={patientReports}
                    entityId={userData?.entityId}
                    entitySerial={userData?.entitySerial}
                    interactions={interactions}
                    officers={[]}
                    onUploadSuccess={loadReports}
                    handlePatientClick={handleOpenPatientDetails}
                    visitors={visitors}
                />
            )}

            {isCleaning && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4 min-w-[280px]">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
                        <p className="text-sm font-semibold text-slate-700 text-center">{cleanupMessage || 'Cleaning…'}</p>
                    </div>
                </div>
            )}

            <CancelInteractionModal
                showCancelModal={showCancelModal}
                setShowCancelModal={setShowCancelModal}
                moveToIncomplete={moveToIncomplete}
                confirmCancel={async () => {
                    const interaction = activeInteractionId != null ? interactions.find((i) => i.id === activeInteractionId) : null;
                    const wasPhoneConsult = interaction?.visitMode === 'on_phone';
                    await confirmCancel();
                    if (wasPhoneConsult) setActiveViewTab('phone_consults');
                }}
            />

            <MediaViewerModal
                viewingMedia={viewingMedia}
                setViewingMedia={setViewingMedia}
            />

            {viewingReportForReview && (
                <ReportDetailsModal
                    report={viewingReportForReview}
                    reportUrl={getReportUrlForReview(viewingReportForReview)}
                    isLoadingReportUrl={loadingReportUrl}
                    interactions={interactions}
                    onClose={() => setViewingReportForReview(null)}
                    reviewMode={true}
                    isSigning={isSigningReport}
                    onSignReport={async () => {
                        setIsSigningReport(true);
                        try {
                            await reportService.updateReport(viewingReportForReview.id, { signed: true });
                            loadReportsForReview();
                            setViewingReportForReview(null);
                        } catch (err) {
                            console.error('Failed to sign report:', err);
                        } finally {
                            setIsSigningReport(false);
                        }
                    }}
                />
            )}

            {actionConfirmation && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Action</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Are you sure you want to take the <strong>{actionConfirmation.actionType.replace('_', ' ')}</strong> action for this report? This will also mark the report as signed.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setActionConfirmation(null)}
                                disabled={isSigningReport}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                                No
                            </button>
                            <button
                                onClick={() => handleConfirmAction()}
                                disabled={isSigningReport}
                                className="px-6 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSigningReport ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    'Yes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficerTab;
