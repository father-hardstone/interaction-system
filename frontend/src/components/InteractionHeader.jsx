import React from 'react';

const InteractionHeader = ({
    interaction,
    visitor,
    getVisitorName,
    getVisitorSerial,
    setShowCancelModal,
    handleSaveInteraction,
    handleSaveDraft,
    handleSaveEdit,
    handleCloseEditMode,
    isEditingCompleted,
    isSaving,
    onInteractionClick,
    handleOpenPatientDetails
}) => {
    const serial = getVisitorSerial(interaction.visitorId) || '-';
    const name = getVisitorName(interaction.visitorId) || '-';
    const hasSpecialNotes = visitor && visitor.specialNotes && visitor.specialNotes !== '-';

    return (
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:justify-between md:items-center md:gap-4 bg-white sticky top-0 z-10 w-full">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
                <button
                    type="button"
                    onClick={() => handleOpenPatientDetails?.(interaction.visitorId)}
                    className="text-left group w-fit"
                >
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="shrink-0 text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 normal-case tracking-widest">
                            {serial}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 normal-case tracking-tighter group-hover:text-blue-600 transition-colors flex items-center gap-2 flex-wrap">
                            {name}
                            {(interaction.editCount ?? 0) > 0 && (
                                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Edited</span>
                            )}
                        </h2>
                    </div>
                </button>
                {hasSpecialNotes && (
                    <p className="text-sm text-slate-700 truncate max-w-full" title={visitor.specialNotes}>
                        <span className="font-semibold text-red-600">Special notes:</span>{' '}
                        <span className="text-slate-700">{visitor.specialNotes}</span>
                    </p>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                <button
                    type="button"
                    onClick={isEditingCompleted ? handleCloseEditMode : () => setShowCancelModal(true)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                    Cancel
                </button>
                {!isEditingCompleted && (
                    <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors disabled:opacity-50"
                    >
                        Save Draft
                    </button>
                )}
                <button
                    type="button"
                    onClick={isEditingCompleted ? handleSaveEdit : handleSaveInteraction}
                    disabled={isSaving}
                    className="px-4 py-1.5 sm:px-6 sm:py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : isEditingCompleted ? (
                        'Save'
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Complete
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default InteractionHeader;
