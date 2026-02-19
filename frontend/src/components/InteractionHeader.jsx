import React, { useState, useRef, useEffect } from 'react';

const WEEK_OPTIONS = [1, 2, 3, 5, 6];
const MONTH_OPTIONS = [1, 2, 3, 6];

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
    handleOpenPatientDetails,
    followup,
    setFollowup
}) => {
    const [followupTooltipOpen, setFollowupTooltipOpen] = useState(false);
    const followupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (followupRef.current && !followupRef.current.contains(e.target)) {
                setFollowupTooltipOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const serial = getVisitorSerial(interaction.visitorId) || '-';
    const name = getVisitorName(interaction.visitorId) || '-';
    const hasSpecialNotes = visitor && visitor.specialNotes && visitor.specialNotes !== '-';

    const handleFollowupCheckboxChange = (e) => {
        const checked = e.target.checked;
        setFollowup?.(prev => ({ ...prev, required: checked }));
        setFollowupTooltipOpen(checked);
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

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
                {setFollowup && followup && (
                    <div className="flex items-center gap-2 mr-2 sm:mr-4 border-r border-slate-200 pr-2 sm:pr-4 relative" ref={followupRef}>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={!!followup.required}
                                onChange={handleFollowupCheckboxChange}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Followup required</span>
                        </label>
                        {followup.required && followupTooltipOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-[200]">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                                        <input
                                            type="date"
                                            min={minDate}
                                            value={followup.date || ''}
                                            onChange={(e) => setFollowup(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 mb-1">Weeks</div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                                            {WEEK_OPTIONS.map((n) => (
                                                <label key={n} className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="followup-interval-header"
                                                        className="w-3.5 h-3.5 text-blue-600 border-slate-300"
                                                        checked={followup.intervalWeeks === n}
                                                        onChange={() => setFollowup(prev => ({ ...prev, intervalWeeks: n, intervalMonths: null }))}
                                                    />
                                                    <span className="text-xs text-slate-700">{n}w</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-500 mb-1">Months</div>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                                            {MONTH_OPTIONS.map((n) => (
                                                <label key={n} className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="followup-interval-header"
                                                        className="w-3.5 h-3.5 text-blue-600 border-slate-300"
                                                        checked={followup.intervalMonths === n}
                                                        onChange={() => setFollowup(prev => ({ ...prev, intervalMonths: n, intervalWeeks: null }))}
                                                    />
                                                    <span className="text-xs text-slate-700">{n}m</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
