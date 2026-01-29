import React from 'react';

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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Scheduled interactions
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Patients assigned to you and waiting to be seen
                    </p>
                </div>
            </div>

            <div className="border border-slate-100 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm min-w-[600px]">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Details</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Visit</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Created At</span>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-16 text-center">
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
                                <td
                                    colSpan={5}
                                    className="px-4 py-12 text-center text-xs text-slate-400"
                                >
                                    No scheduled interactions
                                </td>
                            </tr>
                        ) : (
                        scheduledInteractions.map((interaction) => (
                            <tr key={interaction.id} className="hover:bg-slate-50">
                                <td className="px-4 py-4 align-middle">
                                    <button
                                        onClick={() => onInteractionClick(interaction)}
                                        className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-tight"
                                    >
                                        {interaction.interactionSerial || 'REG-PENDING'}
                                    </button>
                                </td>
                                <td className="px-4 py-4 align-middle">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleOpenPatientDetails(interaction.visitorId)
                                        }
                                        className="text-sm font-black text-slate-900 hover:text-blue-700 transition-colors uppercase text-left"
                                    >
                                        {getVisitorName(interaction.visitorId)}
                                    </button>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">
                                        {getVisitorSerial(interaction.visitorId)}
                                    </div>
                                </td>
                                <td className="px-4 py-4 align-middle text-xs font-bold text-slate-500 italic">
                                    {getLastVisit(interaction)}
                                </td>
                                <td className="px-4 py-4 align-middle text-xs font-bold text-slate-500 italic">
                                    {formatDate(interaction.createdAt)}
                                </td>
                                <td className="px-4 py-4 align-middle text-right">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleStartInteraction(interaction.id)
                                        }
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
