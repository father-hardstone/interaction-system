import React from 'react';
import InteractionHeader from './InteractionHeader';
import SoapBlock from './SoapBlock';
import ServicesBillingBlock from './ServicesBillingBlock';
import ReferralBlock from './ReferralBlock';
import MedicationBlock from './MedicationBlock';
import AdditionalNotesBlock from './AdditionalNotesBlock';
import FollowupBlock from './FollowupBlock';

const OngoingInteractionsView = ({
    ongoingInteractions,
    isLoading = false,
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
    interactions
}) => {
    return (
        <div className="space-y-6 h-full flex flex-col">
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 bg-white rounded-xl border border-slate-200">
                    <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-500">Loading ongoing interactions…</span>
                </div>
            ) : ongoingInteractions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 bg-white rounded-xl border border-slate-200">
                    <span className="text-sm font-semibold text-slate-500">No ongoing interactions</span>
                    <span className="text-xs text-slate-400">Start an interaction from the Scheduled tab</span>
                </div>
            ) : (
            ongoingInteractions.map((interaction) => (
                <div key={interaction.id} className="bg-white rounded-xl shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
                    {/* Calculate Last Visit for the header */}
                    {(() => {
                        const patientHistory = interactions
                            .filter(i => i.visitorId === interaction.visitorId && i.completed && i.id !== interaction.id)
                            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));

                        const lastVisitDate = patientHistory.length > 0
                            ? formatDate(patientHistory[0].editedAt || patientHistory[0].createdAt, false)
                            : 'First Visit';

                        return (
                            <InteractionHeader
                                interaction={interaction}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                setShowCancelModal={setShowCancelModal}
                                handleSaveInteraction={handleSaveInteraction}
                                handleSaveDraft={handleSaveDraft}
                                isSaving={isSaving}
                                onInteractionClick={onInteractionClick}
                                lastVisit={lastVisitDate}
                            />
                        );
                    })()}

                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                        <div className="max-w-none mx-auto space-y-6 pb-20 min-h-0">
                            <SoapBlock
                                label="CC / Reason"
                                value={ccReason}
                                onChange={setCcReason}
                                padValue={ccReasonPad}
                                onPadChange={setCcReasonPad}
                                required={true}
                                placeholder="Enter reason for visit..."
                            />

                            <SoapBlock
                                label="S"
                                value={subjective}
                                onChange={setSubjective}
                                padValue={subjectivePad}
                                onPadChange={setSubjectivePad}
                                required={true}
                                placeholder="Patient's history and symptoms..."
                            />

                            <SoapBlock
                                label="O"
                                value={objective}
                                onChange={setObjective}
                                padValue={objectivePad}
                                onPadChange={setObjectivePad}
                                required={true}
                                placeholder="Physical exam findings, vitals..."
                            />

                            <SoapBlock
                                label="A & P"
                                value={assessmentPlan}
                                onChange={setAssessmentPlan}
                                padValue={assessmentPlanPad}
                                onPadChange={setAssessmentPlanPad}
                                required={false}
                                placeholder="Diagnosis and treatment plan..."
                            />

                            {/* Row 3: Medications */}
                            <MedicationBlock
                                medications={medications}
                                addMedication={addMedication}
                                updateMedication={updateMedication}
                                removeMedication={removeMedication}
                            />

                            {/* Row 4: Referral */}
                            <ReferralBlock
                                referral={referral}
                                setReferral={setReferral}
                            />

                            {/* Row 5: Followup */}
                            <FollowupBlock
                                followup={followup}
                                setFollowup={setFollowup}
                            />

                            {/* Row 6: Additional Notes */}
                            <AdditionalNotesBlock
                                additionalNotes={additionalNotes}
                                setAdditionalNotes={setAdditionalNotes}
                                savedNotes={savedNotes}
                                formatDate={formatDate}
                            />

                            {/* Row 7: Billing */}
                            <ServicesBillingBlock
                                serviceLines={serviceLines}
                                addServiceLine={addServiceLine}
                                removeServiceLine={removeServiceLine}
                                updateServiceLine={updateServiceLine}
                                services={services}
                                diagnostics={diagnostics}
                            />
                        </div>
                    </div>
                </div>
            ))
            )}
        </div>
    );
};

export default OngoingInteractionsView;
