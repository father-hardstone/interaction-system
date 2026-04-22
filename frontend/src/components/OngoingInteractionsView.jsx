import React, { useState, useMemo, useEffect } from 'react';
import InteractionHeader from './InteractionHeader';
import SoapBlock from './SoapBlock';
import ServicesBillingBlock from './ServicesBillingBlock';
import ReferralBlock from './ReferralBlock';
import MedicationBlock from './MedicationBlock';
import AdditionalNotesBlock from './AdditionalNotesBlock';

const padHasContent = (pv) => {
    if (!pv) return false;
    if (typeof pv === 'string' && pv.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(pv);
            return Array.isArray(arr) && arr.some(s => s && (s.startsWith('data:image') || (typeof s === 'string' && s.includes('/interactions/'))));
        } catch {
            return !!pv;
        }
    }
    return !!(pv && (pv.startsWith('data:image') || pv.includes('/interactions/')));
};

const OngoingInteractionsView = ({
    ongoingInteractions,
    editingInteraction = null,
    visitors = [],
    isLoading = false,
    isLoadingEdit = false,
    originalPadSheetCounts = { cc: 0, s: 0, o: 0, ap: 0 },
    getVisitorName,
    getVisitorSerial,
    setShowCancelModal,
    ccReason,
    setCcReason,
    ccReasonPad,
    setCcReasonPad,
    subjective,
    setSubjective,
    subjectivePad,
    setSubjectivePad,
    objective,
    setObjective,
    objectivePad,
    setObjectivePad,
    assessmentPlan,
    setAssessmentPlan,
    assessmentPlanPad,
    setAssessmentPlanPad,
    serviceLines,
    addServiceLine,
    removeServiceLine,
    updateServiceLine,
    services,
    diagnostics,
    handleSaveInteraction,
    handleSaveDraft,
    handleSaveEdit,
    handleCloseEditMode,
    isEditingCompleted = false,
    isSaving,
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
    formatDate,
    onInteractionClick,
    interactions,
    handleOpenPatientDetails,
    initialSubTab,
    onClearInitialSubTab,
    doctorName = '',
    onOpenLabRequisition,
}) => {
    const [activeTab, setActiveTab] = useState('cc');

    useEffect(() => {
        if (initialSubTab === 'billing') {
            setActiveTab('billing');
            onClearInitialSubTab?.();
        }
    }, [initialSubTab, onClearInitialSubTab]);

    const completionStatus = useMemo(() => {
        const hasCc = !!(ccReason?.trim() || padHasContent(ccReasonPad));
        const hasS = !!(subjective?.trim() || padHasContent(subjectivePad));
        const hasO = !!(objective?.trim() || padHasContent(objectivePad));
        const hasAp = !!(assessmentPlan?.trim() || padHasContent(assessmentPlanPad));
        const hasMeds = medications?.some(m => m.name?.trim());
        const hasReferral = !!(referral?.type?.trim());
        const hasFollowup = !!(followup?.required && followup?.date);
        const hasNotes = !!(additionalNotes?.trim() || (savedNotes?.length > 0));
        const hasBilling = serviceLines?.some(l => l.billingCode?.trim());

        return {
            cc: hasCc,
            s: hasS,
            o: hasO,
            ap: hasAp,
            medications: hasMeds,
            referral: hasReferral,
            followup: hasFollowup,
            notes: hasNotes,
            billing: hasBilling
        };
    }, [ccReason, ccReasonPad, subjective, subjectivePad, objective, objectivePad, assessmentPlan, assessmentPlanPad, medications, referral, followup, additionalNotes, savedNotes, serviceLines]);

    const tabConfig = [
        { id: 'cc', label: 'CC' },
        { id: 's', label: 'S' },
        { id: 'o', label: 'O' },
        { id: 'ap', label: 'A&P' },
        { id: 'medications', label: 'Meds' },
        { id: 'referral', label: 'Referral' },
        { id: 'notes', label: 'Notes' },
        { id: 'billing', label: 'Billing' }
    ];

    const renderTabContent = (interaction) => {
        switch (activeTab) {
            case 'cc':
                return (
                    <SoapBlock
                        label="CC / Reason"
                        value={ccReason}
                        onChange={setCcReason}
                        padValue={ccReasonPad}
                        onPadChange={setCcReasonPad}
                        required={true}
                        placeholder="Enter reason for visit..."
                        enableSheets={true}
                        readOnly={isEditingCompleted}
                        padReadOnly={isEditingCompleted}
                        existingSheetCount={originalPadSheetCounts.cc}
                        addedLaterSheetIndices={interaction?.ccReason?.addedLaterSheetIndices}
                    />
                );
            case 's':
                return (
                    <SoapBlock
                        label="S"
                        value={subjective}
                        onChange={setSubjective}
                        padValue={subjectivePad}
                        onPadChange={setSubjectivePad}
                        required={true}
                        placeholder="Patient's history and symptoms..."
                        enableSheets={true}
                        readOnly={isEditingCompleted}
                        padReadOnly={isEditingCompleted}
                        existingSheetCount={originalPadSheetCounts.s}
                        addedLaterSheetIndices={interaction?.subjective?.addedLaterSheetIndices}
                    />
                );
            case 'o':
                return (
                    <SoapBlock
                        label="O"
                        value={objective}
                        onChange={setObjective}
                        padValue={objectivePad}
                        onPadChange={setObjectivePad}
                        required={true}
                        placeholder="Physical exam findings, vitals..."
                        enableSheets={true}
                        readOnly={isEditingCompleted}
                        padReadOnly={isEditingCompleted}
                        existingSheetCount={originalPadSheetCounts.o}
                        addedLaterSheetIndices={interaction?.objective?.addedLaterSheetIndices}
                    />
                );
            case 'ap':
                return (
                    <SoapBlock
                        label="A & P"
                        value={assessmentPlan}
                        onChange={setAssessmentPlan}
                        padValue={assessmentPlanPad}
                        onPadChange={setAssessmentPlanPad}
                        required={false}
                        placeholder="Diagnosis and treatment plan..."
                        enableSheets={true}
                        readOnly={isEditingCompleted}
                        padReadOnly={isEditingCompleted}
                        existingSheetCount={originalPadSheetCounts.ap}
                        addedLaterSheetIndices={interaction?.assessmentPlan?.addedLaterSheetIndices}
                    />
                );
            case 'medications':
                return (
                    <MedicationBlock
                        visitor={visitors.find((v) => v.id === interaction.visitorId)}
                        medications={medications}
                        addMedication={addMedication}
                        updateMedication={updateMedication}
                        removeMedication={removeMedication}
                        patientName={getVisitorName(interaction.visitorId) || ''}
                        doctorName={doctorName}
                    />
                );
            case 'referral':
                return (
                    <ReferralBlock
                        referral={referral}
                        setReferral={setReferral}
                        onOpenLabRequisition={
                            onOpenLabRequisition
                                ? () => onOpenLabRequisition(interaction)
                                : undefined
                        }
                    />
                );
            case 'notes':
                return (
                    <AdditionalNotesBlock
                        additionalNotes={additionalNotes}
                        setAdditionalNotes={setAdditionalNotes}
                        savedNotes={savedNotes}
                        formatDate={formatDate}
                        isEditingCompleted={isEditingCompleted}
                        editCount={interaction?.editCount ?? 0}
                    />
                );
            case 'billing':
                return (
                    <ServicesBillingBlock
                        serviceLines={serviceLines}
                        addServiceLine={addServiceLine}
                        removeServiceLine={removeServiceLine}
                        updateServiceLine={updateServiceLine}
                        services={services}
                        diagnostics={diagnostics}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {(isLoading || (isLoadingEdit && isEditingCompleted)) ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 bg-white rounded-xl border border-slate-200">
                    <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-500">{isLoadingEdit && isEditingCompleted ? 'Loading interaction…' : 'Loading ongoing interactions…'}</span>
                </div>
            ) : !editingInteraction && ongoingInteractions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 bg-white rounded-xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-500">No ongoing interactions</span>
                    <span className="text-xs text-slate-400">Start an interaction from the Scheduled tab</span>
                </div>
            ) : (
                (editingInteraction ? [editingInteraction] : ongoingInteractions).map((interaction) => (
                    <div key={interaction.id} className="bg-white rounded-xl shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
                        <InteractionHeader
                            interaction={interaction}
                            visitor={visitors.find((v) => v.id === interaction.visitorId)}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}
                            setShowCancelModal={setShowCancelModal}
                            handleSaveInteraction={handleSaveInteraction}
                            handleSaveDraft={handleSaveDraft}
                            handleSaveEdit={handleSaveEdit}
                            handleCloseEditMode={handleCloseEditMode}
                            isEditingCompleted={isEditingCompleted}
                            isSaving={isSaving}
                            onInteractionClick={onInteractionClick}
                            handleOpenPatientDetails={handleOpenPatientDetails}
                            followup={followup}
                            setFollowup={setFollowup}
                        />

                        {/* Left-aligned vertical tabs with progress on the right */}
                        <div className="flex flex-1 min-h-0">
                            <div className="flex flex-col shrink-0 border-r border-slate-200 bg-white py-2 justify-center">
                                {tabConfig.map(({ id, label }) => {
                                    const filled = completionStatus[id];
                                    const isSoap = ['s', 'o', 'ap'].includes(id);
                                    const isActive = activeTab === id;
                                    const borderClass = isActive ? 'border-r-blue-600' : filled ? 'border-r-green-500' : 'border-r-yellow-400';
                                    const textBgClass = isActive
                                        ? 'text-blue-600 bg-blue-50/50'
                                        : filled
                                            ? 'text-slate-700 hover:bg-green-50/50'
                                            : 'text-slate-500 hover:bg-yellow-50/50';
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setActiveTab(id)}
                                            className={`shrink-0 w-full text-left pl-4 pr-3 py-2.5 transition-colors border-r-4 -mr-px ${borderClass} ${isSoap ? 'text-base font-bold' : 'text-sm font-semibold'} ${textBgClass}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-auto pt-4 px-4 sm:pt-6 sm:px-6 pb-0 bg-slate-50/50">
                                <div className="max-w-none min-h-0">
                                    {renderTabContent(interaction)}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default OngoingInteractionsView;
