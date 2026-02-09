import React, { useState } from 'react';
import useOfficerTab from '../hooks/useOfficerTab';
import ScheduledInteractionsTable from './ScheduledInteractionsTable';
import IncompleteInteractionsTable from './IncompleteInteractionsTable';
import OngoingInteractionsView from './OngoingInteractionsView';
import CompletedInteractionsTable from './CompletedInteractionsTable';
import PatientDetailsModal from './PatientDetailsModal';
import CancelInteractionModal from './CancelInteractionModal';
import MediaViewerModal from './MediaViewerModal';
import PastInteractionsSidebar from './PastInteractionsSidebar';

const OfficerTab = ({ userData, interactions, visitors, isLoadingInteractions = false, onRefreshInteractions, onInteractionClick }) => {
    const {
        selectedPatient,
        showPatientDetailModal,
        setShowPatientDetailModal,
        activeInteractionId,
        activeViewTab,
        setActiveViewTab,
        showCancelModal,
        setShowCancelModal,
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
        addMedication,
        removeMedication,
        updateMedication,
        additionalNotes,
        setAdditionalNotes,
        savedNotes,
        followup,
        setFollowup
    } = useOfficerTab(userData, interactions, visitors, onRefreshInteractions);

    const [showPatientHistoryOverlay, setShowPatientHistoryOverlay] = useState(false);

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

    return (
        <div className="flex flex-col min-h-0 flex-1 space-y-6 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-xl w-fit overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveViewTab('scheduled')}
                    className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeViewTab === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Scheduled
                </button>
                <button
                    onClick={() => setActiveViewTab('ongoing')}
                    className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeViewTab === 'ongoing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Ongoing
                </button>
                <button
                    onClick={() => setActiveViewTab('incomplete')}
                    className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeViewTab === 'incomplete' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Incomplete
                </button>
                <button
                    onClick={() => setActiveViewTab('completed')}
                    className={`px-3 py-1.5 sm:px-6 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${activeViewTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Completed
                </button>
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
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                />
                </div>
            )}

            {/* Completed Tab */}
            {activeViewTab === 'completed' && (
                <div className="flex flex-col flex-1 min-h-0">
                    <CompletedInteractionsTable
                    completedInteractions={completedInteractions}
                    isLoading={isLoadingInteractions}
                    handleOpenPatientDetails={handleOpenPatientDetails}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                />
                </div>
            )}

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
                            ongoingInteractions={ongoingInteractions}
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
                        />
                    </div>
                    {/* Patient History - sidebar on xl+, overlay on smaller screens */}
                    {activeInteractionId && (
                        <>
                            {/* Desktop: sidebar beside ongoing */}
                            <div className="hidden xl:flex xl:max-h-full xl:min-h-0 xl:overflow-hidden shrink-0 flex-col">
                                <PastInteractionsSidebar
                                    activePatientVisitorId={activePatientVisitorId}
                                    interactions={interactions}
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
                                        interactions={interactions}
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

            {/* Modals */}
            {showPatientDetailModal && selectedPatient && (
                <PatientDetailsModal
                    selectedPatient={selectedPatient}
                    setShowPatientDetailModal={setShowPatientDetailModal}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    completedInteractionsForPatient={completedInteractionsForPatient}
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

            <CancelInteractionModal
                showCancelModal={showCancelModal}
                setShowCancelModal={setShowCancelModal}
                moveToIncomplete={moveToIncomplete}
                confirmCancel={confirmCancel}
            />

            <MediaViewerModal
                viewingMedia={viewingMedia}
                setViewingMedia={setViewingMedia}
            />
        </div>
    );
};

export default OfficerTab;
