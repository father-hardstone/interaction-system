import React, { useState, useRef, useEffect } from 'react';
import PatientHealthWarningTooltip from './PatientHealthWarningTooltip';

const WEEK_OPTIONS = [1, 2, 3, 5, 6];
const MONTH_OPTIONS = [1, 2, 3, 6];

/** YYYY-MM-DD for date input from today + weeks or months */
function getEndDateFromInterval(intervalWeeks, intervalMonths) {
    const d = new Date();
    if (intervalWeeks != null) {
        d.setDate(d.getDate() + 7 * intervalWeeks);
    } else if (intervalMonths != null) {
        d.setMonth(d.getMonth() + intervalMonths);
    } else {
        return '';
    }
    return d.toISOString().split('T')[0];
}

/** Format YYYY-MM-DD as mm/dd/yyyy for display */
function formatFollowupDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const pad = (n) => (n < 10 ? '0' + n : String(n));
    return `${pad(m)}/${pad(d)}/${y}`;
}

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
    const hasRedZone =
        (visitor?.allergies && visitor.allergies !== 'N/A') ||
        (visitor?.drugReactions && visitor.drugReactions !== 'N/A') ||
        (visitor?.specialNotes && visitor.specialNotes !== '-');

    const handleFollowupCheckboxChange = (e) => {
        const checked = e.target.checked;
        if (checked) {
            setFollowup?.(prev => ({ ...prev, required: true }));
            setFollowupTooltipOpen(true);
        } else {
            setFollowup?.(prev => ({
                ...prev,
                required: false,
                date: '',
                intervalWeeks: null,
                intervalMonths: null
            }));
            setFollowupTooltipOpen(false);
        }
    };

    const handleIntervalChange = (intervalWeeks, intervalMonths) => {
        const date = getEndDateFromInterval(intervalWeeks ?? null, intervalMonths ?? null);
        setFollowup?.(prev => ({
            ...prev,
            intervalWeeks: intervalWeeks ?? null,
            intervalMonths: intervalMonths ?? null,
            date: date || prev.date
        }));
        setFollowupTooltipOpen(false);
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
                    <div className="flex items-baseline gap-2 flex-wrap items-center">
                        <span className="shrink-0 text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 normal-case tracking-widest">
                            {serial}
                        </span>
                        {hasRedZone && visitor && (
                            <PatientHealthWarningTooltip visitor={visitor} className="shrink-0" />
                        )}
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 normal-case tracking-tighter group-hover:text-blue-600 transition-colors flex items-center gap-2 flex-wrap">
                            {name}
                            {interaction.visitMode === 'on_phone' && (
                                <span className="shrink-0 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Phone consult</span>
                            )}
                            {(interaction.editCount ?? 0) > 0 && (
                                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Edited</span>
                            )}
                        </h2>
                    </div>
                </button>
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
                            {followup.required && followup.date && (
                                <>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">{formatFollowupDate(followup.date)}</span>
                                </>
                            )}
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
                                                        onChange={() => handleIntervalChange(n, null)}
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
                                                        onChange={() => handleIntervalChange(null, n)}
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
