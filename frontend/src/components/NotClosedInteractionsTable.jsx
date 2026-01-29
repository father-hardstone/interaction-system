import React from 'react';

const NotClosedInteractionsTable = ({
    notClosedInteractions,
    handleOpenPatientDetails,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    showOfficer = false,
    getOfficerName = () => 'N/A',
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
            <div className="border border-slate-100 rounded-lg overflow-auto max-h-[calc(100vh-280px)] min-h-[200px] flex-1">
                <table className="min-w-full divide-y divide-slate-100 text-sm min-w-[600px]">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient Details</span>
                            </th>
                            {showOfficer && (
                                <th className="px-4 py-3 text-left">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Doctor</span>
                                </th>
                            )}
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Visit</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Edited</span>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {notClosedInteractions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={showOfficer ? 6 : 5}
                                    className="px-4 py-12 text-center text-xs text-slate-400"
                                >
                                    No not-closed interactions found.
                                </td>
                            </tr>
                        ) : (
                            notClosedInteractions.map((interaction) => (
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
                                    {showOfficer && (
                                        <td className="px-4 py-4 align-middle">
                                            <div className="text-xs font-black text-slate-700 uppercase tracking-tight">
                                                {getOfficerName(interaction.officerId)}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                ID: {interaction.officerSerial || '-'}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-4 py-4 align-middle text-xs font-bold text-slate-500 italic">
                                        {getLastVisit(interaction)}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-xs font-bold text-slate-500 italic">
                                        {formatDate(interaction.editedAt || interaction.createdAt)}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-right">
                                        {/* Read-only for receptionist */}
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

export default NotClosedInteractionsTable;
