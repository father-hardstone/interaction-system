import React from 'react';

const CompletedInteractionsTable = ({ completedInteractions, isLoading = false, getVisitorName, formatDate, onInteractionClick, interactions = [] }) => {
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col pt-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Recently completed
                    </h2>
                </div>
            </div>
            <div className="border border-slate-100 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Registration</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Last Visit</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Completed</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">Loading recently completed…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : completedInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-xs text-slate-400">
                                    No recently completed interactions
                                </td>
                            </tr>
                        ) : (
                        completedInteractions.slice(0, 5).map((interaction) => (
                            <tr key={interaction.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => onInteractionClick(interaction)}
                                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        {interaction.interactionSerial}
                                    </button>
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => onInteractionClick(interaction)}
                                        className="text-slate-900 hover:text-blue-600 transition-colors"
                                    >
                                        {getVisitorName(interaction.visitorId)}
                                    </button>
                                </td>
                                <td className="px-4 py-2 text-slate-500">{getLastVisit(interaction)}</td>
                                <td className="px-4 py-2 text-slate-500">{formatDate(interaction.editedAt || interaction.createdAt)}</td>
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
