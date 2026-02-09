import React from 'react';
import { stripEntityPrefix } from '../utils/formatUtils';

const ScheduledInteractionsTable = ({
    scheduledInteractions,
    isLoading = false,
    handleOpenPatientDetails,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    handleStartInteraction,
    ongoingInteractions,
    onInteractionClick,
    interactions = []
}) => {
    const getLastVisit = (interaction) => {
        const patientHistory = interactions
            .filter(past => past.visitorId === interaction.visitorId && past.completed && past.id !== interaction.id)
            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));

        if (patientHistory.length > 0) {
            return formatDate(patientHistory[0].editedAt || patientHistory[0].createdAt, true);
        }
        return '-';
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
                <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Registration</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Patient</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Last Visit</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Created</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-4 sm:px-6 py-16 text-center">
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
                                <td colSpan={5} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">
                                    No scheduled interactions
                                </td>
                            </tr>
                        ) : (
                            scheduledInteractions.map((interaction) => (
                                <tr
                                    key={interaction.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                    onClick={() => onInteractionClick(interaction)}
                                >
                                    <td className="px-4 sm:px-6 py-4 align-middle">
                                        <span className="text-sm font-semibold text-blue-600">{stripEntityPrefix(interaction.interactionSerial) || 'REG-PENDING'}</span>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenPatientDetails(interaction.visitorId)}
                                            className="text-left hover:text-blue-700 transition-colors"
                                        >
                                            <div className="font-medium text-sm text-slate-900">{getVisitorName(interaction.visitorId)}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5">ID: {getVisitorSerial(interaction.visitorId)}</div>
                                        </button>
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden lg:table-cell">{getLastVisit(interaction)}</td>
                                    <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden md:table-cell">{formatDate(interaction.createdAt)}</td>
                                    <td className="px-4 sm:px-6 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
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
