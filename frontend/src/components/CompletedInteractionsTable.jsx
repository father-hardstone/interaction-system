import React from 'react';
import { stripEntityPrefix } from '../utils/formatUtils';

const CompletedInteractionsTable = ({
    completedInteractions,
    isLoading = false,
    handleOpenPatientDetails,
    getVisitorName,
    getVisitorSerial,
    formatDate,
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
                    <h2 className="text-lg font-semibold text-slate-900">Completed interactions</h2>
                    <p className="text-xs text-slate-500 mt-1">Recently completed visits</p>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 min-h-0 border border-slate-100 rounded-lg">
                <table className="w-full border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Registration</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Patient</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Last Visit</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-4 sm:px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">Loading completed interactions…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : completedInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">
                                    No completed interactions
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
                                    <td className="px-4 sm:px-6 py-4 align-middle text-sm text-slate-600 hidden md:table-cell">{formatDate(interaction.editedAt || interaction.createdAt)}</td>
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
