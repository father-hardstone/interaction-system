import React from 'react';

const CompletedInteractionsTable = ({ completedInteractions, getVisitorName, formatDate, onInteractionClick, interactions = [] }) => {
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
                        {completedInteractions.slice(0, 5).map((interaction) => (
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompletedInteractionsTable;
