import React from 'react';
import useOfficerTab from '../hooks/useOfficerTab';
import ScheduledInteractionsTable from './ScheduledInteractionsTable';
import IncompleteInteractionsTable from './IncompleteInteractionsTable';
import OngoingInteractionsView from './OngoingInteractionsView';
import CompletedInteractionsTable from './CompletedInteractionsTable';
import PatientDetailsModal from './PatientDetailsModal';
import CancelInteractionModal from './CancelInteractionModal';
import MediaViewerModal from './MediaViewerModal';
import PastInteractionsSidebar from './PastInteractionsSidebar';

const OfficerTab = ({ userData, interactions, visitors, onRefreshInteractions, onInteractionClick }) => {
    const {
        selectedPatient,
        showPatientDetailModal,
        setShowPatientDetailModal,
        expandedInteractionIds,
        setExpandedInteractionIds,
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
        if (v.serial && v.serial.includes('-')) return v.serial;
        return v.entitySerial ? `${v.entitySerial}-${v.serial}` : v.serial || 'N/A';
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
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveViewTab('scheduled')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeViewTab === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Scheduled
                </button>
                <button
                    onClick={() => setActiveViewTab('ongoing')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeViewTab === 'ongoing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Ongoing
                </button>
                <button
                    onClick={() => setActiveViewTab('incomplete')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeViewTab === 'incomplete' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Incomplete
                </button>
            </div>

            {/* Scheduled Tab */}
            {activeViewTab === 'scheduled' && (
                <ScheduledInteractionsTable
                    scheduledInteractions={scheduledInteractions}
                    handleOpenPatientDetails={handleOpenPatientDetails}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    handleStartInteraction={handleStartInteraction}
                    ongoingInteractions={ongoingInteractions}
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                />
            )}

            {/* Incomplete Tab */}
            {activeViewTab === 'incomplete' && (
                <IncompleteInteractionsTable
                    incompleteInteractions={incompleteInteractions}
                    handleOpenPatientDetails={handleOpenPatientDetails}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    handleStartInteraction={handleStartInteraction}
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                />
            )}

            {/* Ongoing Tab */}
            {activeViewTab === 'ongoing' && (
                <div className="flex flex-col xl:flex-row gap-6 items-start h-[calc(100vh-140px)]">
                    <div className="flex-1 w-full lg:min-w-0 h-full overflow-hidden">
                        <OngoingInteractionsView
                            ongoingInteractions={ongoingInteractions}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}
                            setShowCancelModal={setShowCancelModal}
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
                    {activeInteractionId && (
                        <PastInteractionsSidebar
                            ongoingInteractions={ongoingInteractions}
                            activePatientVisitorId={activePatientVisitorId}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}
                            interactions={interactions}
                            activeInteractionId={activeInteractionId}
                            expandedInteractionIds={expandedInteractionIds}
                            setExpandedInteractionIds={setExpandedInteractionIds}
                            diagnostics={diagnostics}
                            getImageUrl={getImageUrl}
                            setViewingMedia={setViewingMedia}
                            patientReports={patientReports}
                            handleOpenPatientDetails={handleOpenPatientDetails}
                        />
                    )}
                </div>
            )}

            {/* Completed interactions footer */}
            {activeViewTab === 'scheduled' && completedInteractions.length > 0 && (
                <CompletedInteractionsTable
                    completedInteractions={completedInteractions}
                    getVisitorName={getVisitorName}
                    formatDate={formatDate}
                    onInteractionClick={onInteractionClick}
                    interactions={interactions}
                />
            )}

            {/* Modals */}
            {showPatientDetailModal && selectedPatient && (
                <PatientDetailsModal
                    selectedPatient={selectedPatient}
                    setShowPatientDetailModal={setShowPatientDetailModal}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    completedInteractionsForPatient={completedInteractionsForPatient}
                    expandedInteractionIds={expandedInteractionIds}
                    setExpandedInteractionIds={setExpandedInteractionIds}
                    formatDate={formatDate}
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
