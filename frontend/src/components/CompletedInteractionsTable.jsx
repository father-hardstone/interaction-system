import React from 'react';
import { getRegistrationDisplayId } from '../utils/formatUtils';

/** Diagnostic codes from interaction.serviceLines, comma-separated. */
const getDiagCodes = (interaction) => {
    const lines = interaction?.serviceLines;
    if (!Array.isArray(lines) || lines.length === 0) return '—';
    const codes = lines.map(l => (l.diagnostic && String(l.diagnostic).trim()) || null).filter(Boolean);
    if (codes.length === 0) return '—';
    return codes.map(c => c.toUpperCase()).join(', ');
};

/** Service/billing codes from interaction.serviceLines, comma-separated. */
const getServiceCodes = (interaction) => {
    const lines = interaction?.serviceLines;
    if (!Array.isArray(lines) || lines.length === 0) return '—';
    const codes = lines.map(l => (l.service || l.billingCode || '').trim()).filter(Boolean);
    if (codes.length === 0) return '—';
    return codes.map(c => c.toUpperCase()).join(', ');
};

const CompletedInteractionsTable = ({
    completedInteractions,
    isLoading = false,
    handleOpenPatientDetails,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    onInteractionClick,
    onEditCompleted,
    blockEditCompleted = false,
    interactions = [],
    lastVisits = {},
    title = 'Completed interactions',
    emptyMessage = 'No completed interactions',
    loadingMessage = 'Loading completed interactions…',
    variant = 'completed' // 'completed' | 'closed'
}) => {
    const isClosed = variant === 'closed';
    const dateLabel = isClosed ? 'Closed at' : 'Completed at';
    const getDateValue = (interaction) => {
        if (isClosed && interaction.closedAt) return formatDate(interaction.closedAt);
        return formatDate(interaction.completedAt || interaction.editedAt || interaction.createdAt);
    };
    const isEdited = (interaction) => (interaction.editCount ?? 0) > 0 || !!(interaction.editedAt && interaction.completedAt);
    const colCount = 5 + (isClosed ? 2 : 0); // ID, Patient, dateLabel, Edited at, Actions; + Diag, Service for closed

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                        {title.includes('Closed') ? 'All key fields present and billing and diagnostic codes also present. Ready for billing.' : 'All key fields filled, but diagnosis and billing codes are missing.'}
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 min-h-0 border border-slate-100 rounded-lg">
                <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Patient</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">{dateLabel}</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Edited at</th>
                            {isClosed && (
                                <>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Diag codes</th>
                                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Service codes</th>
                                </>
                            )}
                            <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={colCount} className="px-4 sm:px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">{loadingMessage}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : completedInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={colCount} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            completedInteractions.map((interaction) => (
                                <tr
                                    key={interaction.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                    onClick={() => onInteractionClick(interaction)}
                                >
                                    <td className="px-4 sm:px-6 py-4 align-middle">
                                        <span className="text-sm font-semibold text-blue-600 inline-flex items-center gap-1.5 flex-wrap">
                                            {getRegistrationDisplayId(interaction)}
                                            {isEdited(interaction) && (
                                                <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 shrink-0">Edited</span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenPatientDetails(interaction.visitorId)}
                                            className="text-left hover:text-blue-700 transition-colors flex items-center gap-2 flex-wrap"
                                        >
                                            <span className="font-medium text-sm text-slate-900">{getVisitorName(interaction.visitorId)}</span>
                                            {interaction.visitMode === 'on_phone' && (
                                                <span className="shrink-0 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Phone consult</span>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden md:table-cell">{getDateValue(interaction)}</td>
                                    <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden lg:table-cell">{interaction.editedAt ? formatDate(interaction.editedAt) : '—'}</td>
                                    {isClosed && (
                                        <>
                                            <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden xl:table-cell">{getDiagCodes(interaction)}</td>
                                            <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden xl:table-cell">{getServiceCodes(interaction)}</td>
                                        </>
                                    )}
                                    <td className="px-4 sm:px-6 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            {onEditCompleted && (
                                                <button
                                                    type="button"
                                                    onClick={() => !blockEditCompleted && onEditCompleted(interaction)}
                                                    disabled={blockEditCompleted}
                                                    title={blockEditCompleted ? 'Finish or cancel your current interaction first' : undefined}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${blockEditCompleted ? 'text-slate-400 border border-slate-200 bg-slate-50 cursor-not-allowed' : 'text-blue-600 border border-blue-200 hover:bg-blue-50'}`}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {!isClosed && onEditCompleted && (
                                                <button
                                                    type="button"
                                                    onClick={() => !blockEditCompleted && onEditCompleted(interaction, { openBillingTab: true })}
                                                    disabled={blockEditCompleted}
                                                    title={blockEditCompleted ? 'Finish or cancel your current interaction first' : undefined}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${blockEditCompleted ? 'text-slate-400 border border-slate-200 bg-slate-50 cursor-not-allowed' : 'text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}
                                                >
                                                    Close it
                                                </button>
                                            )}
                                        </div>
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

export default CompletedInteractionsTable;
