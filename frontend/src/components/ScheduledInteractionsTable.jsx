import React, { useState, useEffect } from 'react';
import { getReasonForVisitLabel, formatTimeOnly, getAgeYearsMonthsDisplay, formatPhoneDisplay } from '../utils/formatUtils';

/** Wait time from registration (createdAt) to now, in whole minutes. */
const getWaitMinutesAgo = (createdAt, now) => {
    if (!createdAt) return null;
    const start = new Date(createdAt).getTime();
    const diffMs = now - start;
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / 60000);
};

/** Background class for Reason of visit cell (slightly tinted). */
const getReasonCellBg = (reason) => {
    const r = (reason || '').trim();
    if (r === 'followup') return 'bg-green-100';
    if (r === 'refill_medicine') return 'bg-amber-100';
    return 'bg-blue-100'; // new_visit or default
};

const ScheduledInteractionsTable = ({
    scheduledInteractions,
    isLoading = false,
    handleOpenPatientDetails,
    getVisitorName,
    formatDate,
    handleStartInteraction,
    ongoingInteractions,
    blockStartNewInteraction = false,
    onInteractionClick,
    interactions = [],
    lastVisits = {},
    visitors = [],
    hideWaitingTime = false,
    title = 'Scheduled interactions',
    subtitle = 'Patients assigned to you and waiting to be seen',
    emptyMessage = 'No scheduled interactions',
    loadingMessage = 'Loading scheduled interactions…',
    showPhoneColumn = false
}) => {
    const [tick, setTick] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTick(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    /** Most recent completed interaction for this patient (from backend lastVisits when available; else from interactions). */
    const getLastVisitInteraction = (interaction) => {
        const fromBackend = lastVisits[interaction.visitorId];
        if (fromBackend && fromBackend.id !== interaction.id) return fromBackend;
        const patientHistory = interactions
            .filter(past => past.visitorId === interaction.visitorId && past.completed && past.id !== interaction.id)
            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
        return patientHistory.length > 0 ? patientHistory[0] : null;
    };

    const getLastVisitDate = (interaction) => {
        const last = getLastVisitInteraction(interaction);
        if (!last) return '—';
        return formatDate(last.editedAt || last.createdAt, false);
    };

    /** All diagnostic codes from last visit, comma-separated, uppercase (e.g. A002, A003). */
    const getLastVisitDiagCodes = (interaction) => {
        const last = getLastVisitInteraction(interaction);
        const lines = last?.serviceLines;
        if (!Array.isArray(lines) || lines.length === 0) return '—';
        const codes = lines.map(l => (l.diagnostic && String(l.diagnostic).trim()) || null).filter(Boolean);
        if (codes.length === 0) return '—';
        return codes.map(c => c.toUpperCase()).join(', ');
    };

    /** All billing/service codes from last visit, comma-separated, uppercase. */
    const getLastVisitBillingCodes = (interaction) => {
        const last = getLastVisitInteraction(interaction);
        const lines = last?.serviceLines;
        if (!Array.isArray(lines) || lines.length === 0) return '—';
        const codes = lines.map(l => (l.service || l.billingCode || '').trim()).filter(Boolean);
        if (codes.length === 0) return '—';
        return codes.map(c => c.toUpperCase()).join(', ');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
            </div>

            <div className="overflow-x-auto flex-1 min-h-0 border border-slate-100 rounded-lg">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-200 sticky top-0 z-10">
                            <th className="w-9 px-1 py-3 text-center text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50">#</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Name</th>
                            {showPhoneColumn && (
                                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Phone</th>
                            )}
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Special notes</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Registration</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Age</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Reason of visit</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Last visit</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Diag code</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Billing</th>
                            <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={showPhoneColumn ? 11 : 10} className="px-4 sm:px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">{loadingMessage}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : scheduledInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={showPhoneColumn ? 11 : 10} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            scheduledInteractions.map((interaction, queueIndex) => {
                                const waitMins = getWaitMinutesAgo(interaction.createdAt, tick);
                                const visitor = visitors.find(v => v.id === interaction.visitorId);
                                return (
                                <tr
                                    key={interaction.id}
                                    className="border-b border-slate-100 hover:bg-slate-50/30 transition-all cursor-pointer"
                                    onClick={() => onInteractionClick(interaction)}
                                >
                                    <td className="w-9 px-1 py-3 align-middle text-center bg-slate-50/50">
                                        <span className="text-sm font-semibold text-blue-600">{queueIndex + 1}</span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 align-middle border-l border-slate-100" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" onClick={() => handleOpenPatientDetails(interaction.visitorId)} className="text-left hover:text-blue-700 transition-colors">
                                            <div className="font-medium text-sm text-slate-900">{getVisitorName(interaction.visitorId)}</div>
                                        </button>
                                    </td>
                                    {showPhoneColumn && (
                                        <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">
                                            {formatPhoneDisplay(visitor?.phoneM || visitor?.phone) || '—'}
                                        </td>
                                    )}
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm border-l border-slate-100">
                                        {(visitor?.specialNotes && String(visitor.specialNotes).trim() && visitor.specialNotes !== '-') ? (
                                            <span className="text-red-600 font-medium" title={String(visitor.specialNotes).trim()}>{String(visitor.specialNotes).trim()}</span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">
                                        {formatTimeOnly(interaction.createdAt)}{!hideWaitingTime && waitMins !== null ? ` (${waitMins})` : ''}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getAgeYearsMonthsDisplay(visitor)}</td>
                                    <td className={`px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100 ${getReasonCellBg(interaction.reasonForVisit)}`}>
                                        <div>{getReasonForVisitLabel(interaction.reasonForVisit)}</div>
                                        {(interaction.reasonForVisitNotes || '').trim() && (
                                            <div className="text-xs text-slate-600 mt-0.5 line-clamp-2" title={interaction.reasonForVisitNotes.trim()}>{interaction.reasonForVisitNotes.trim()}</div>
                                        )}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitDate(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitDiagCodes(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitBillingCodes(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-right bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => handleStartInteraction(interaction.id)}
                                            disabled={blockStartNewInteraction}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 ${blockStartNewInteraction ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            <span>{blockStartNewInteraction ? 'Finish current first' : 'Start interaction'}</span>
                                        </button>
                                    </td>
                                </tr>
                            ); })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduledInteractionsTable;
