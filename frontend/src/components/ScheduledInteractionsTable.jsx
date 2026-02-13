import React, { useState, useEffect } from 'react';
import { getRegistrationDisplayId, getReasonForVisitLabel, formatAccountingNumber, formatTimeOnly } from '../utils/formatUtils';

/** Wait time from registration (createdAt) to now, in whole minutes. Updates when tick changes. */
const getWaitMinutesAgo = (createdAt, now) => {
    if (!createdAt) return null;
    const start = new Date(createdAt).getTime();
    const diffMs = now - start;
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / 60000);
};

const formatWaitTime = (createdAt, now) => {
    const mins = getWaitMinutesAgo(createdAt, now);
    if (mins === null) return '—';
    return mins === 0 ? '0 min ago' : `${mins} min ago`;
};

/** Very light background class for Reason of visit cell only. */
const getReasonCellBg = (reason) => {
    const r = (reason || '').trim();
    if (r === 'followup') return 'bg-green-50/80';
    if (r === 'refill_medicine') return 'bg-amber-50/80';
    return 'bg-blue-50/80'; // new_visit or default
};

const ScheduledInteractionsTable = ({
    scheduledInteractions,
    isLoading = false,
    handleOpenPatientDetails,
    getVisitorName,
    formatDate,
    handleStartInteraction,
    ongoingInteractions,
    onInteractionClick,
    interactions = [],
    lastVisits = {}
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

    /** Duration in minutes from startedAt to completedAt of the last visit. */
    const getLastVisitDuration = (interaction) => {
        const last = getLastVisitInteraction(interaction);
        if (!last?.startedAt || !last?.completedAt) return '—';
        const start = new Date(last.startedAt).getTime();
        const end = new Date(last.completedAt).getTime();
        if (isNaN(start) || isNaN(end) || end < start) return '—';
        const mins = Math.round((end - start) / 60000);
        return mins <= 0 ? '—' : `${mins} min`;
    };

    const getLastVisitDiagCode = (interaction) => {
        const last = getLastVisitInteraction(interaction);
        const code = last?.serviceLines?.[0]?.diagnostic;
        return (code && String(code).trim()) ? String(code).trim() : '—';
    };

    /** Billing code from last visit: prefer service code (service), then accounting number. */
    const getLastVisitBillingCode = (interaction) => {
        const last = getLastVisitInteraction(interaction);
        const line = last?.serviceLines?.[0];
        if (!line) return '—';
        const serviceCode = (line.service || '').trim();
        const accountingNum = (line.accountingNumber || '').trim();
        if (serviceCode) return serviceCode;
        if (accountingNum) return formatAccountingNumber(accountingNum);
        return '—';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Scheduled interactions</h2>
                    <p className="text-xs text-slate-500 mt-1">Patients assigned to you and waiting to be seen</p>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 min-h-0 border border-slate-100 rounded-lg">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                        <tr className="border-b border-slate-200 sticky top-0 z-10">
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50">Registration</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Patient</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Registration time</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Wait time</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Reason of visit</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Last visit</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Duration</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Diag code</th>
                            <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border-l border-slate-100">Billing code</th>
                            <th className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={10} className="px-4 sm:px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">Loading scheduled interactions…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : scheduledInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">
                                    No scheduled interactions
                                </td>
                            </tr>
                        ) : (
                            scheduledInteractions.map((interaction) => (
                                <tr
                                    key={interaction.id}
                                    className="border-b border-slate-100 hover:bg-slate-50/30 transition-all cursor-pointer"
                                    onClick={() => onInteractionClick(interaction)}
                                >
                                    <td className="px-3 sm:px-4 py-3 align-middle bg-slate-50/50">
                                        <span className="text-sm font-semibold text-blue-600">{getRegistrationDisplayId(interaction)}</span>
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 align-middle border-l border-slate-100" onClick={(e) => e.stopPropagation()}>
                                        <button type="button" onClick={() => handleOpenPatientDetails(interaction.visitorId)} className="text-left hover:text-blue-700 transition-colors">
                                            <div className="font-medium text-sm text-slate-900">{getVisitorName(interaction.visitorId)}</div>
                                        </button>
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{formatTimeOnly(interaction.createdAt)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm font-medium text-slate-700 border-l border-slate-100">{formatWaitTime(interaction.createdAt, tick)}</td>
                                    <td className={`px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100 ${getReasonCellBg(interaction.reasonForVisit)}`}>{getReasonForVisitLabel(interaction.reasonForVisit)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitDate(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitDuration(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitDiagCode(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-sm text-slate-700 border-l border-slate-100">{getLastVisitBillingCode(interaction)}</td>
                                    <td className="px-3 sm:px-4 py-3 align-middle text-right bg-slate-50/50" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => handleStartInteraction(interaction.id)}
                                            disabled={ongoingInteractions.length > 0}
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 ${ongoingInteractions.length > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            <span>{ongoingInteractions.length > 0 ? 'Finish current first' : 'Start interaction'}</span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScheduledInteractionsTable;
