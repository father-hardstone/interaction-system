import React from 'react';
import { stripEntityPrefix } from '../utils/formatUtils';

const UnbilledInteractionsTable = ({
    unbilledInteractions,
    handleOpenPatientDetails,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    showOfficer = false,
    getOfficerName = () => 'N/A',
    onInteractionClick,
    interactions = [],
    onBillNow
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
                                <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Registration</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Patient Details</span>
                            </th>
                            {showOfficer && (
                                <th className="px-4 py-3 text-left">
                                    <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Assigned Doctor</span>
                                </th>
                            )}
                            <th className="px-4 py-3 text-left">
                                <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Last Visit</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Completed</span>
                            </th>
                            {onBillNow && (
                                <th className="px-4 py-3 text-right">
                                    <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Actions</span>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {unbilledInteractions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={showOfficer ? (onBillNow ? 6 : 5) : (onBillNow ? 5 : 4)}
                                    className="px-4 py-12 text-center text-xs text-slate-400"
                                >
                                    No unbilled interactions found.
                                </td>
                            </tr>
                        ) : (
                            unbilledInteractions.map((interaction) => (
                                <tr
                                    key={interaction.id}
                                    className="hover:bg-slate-50 cursor-pointer"
                                    onClick={() => onInteractionClick(interaction)}
                                >
                                    <td className="px-4 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onInteractionClick(interaction)}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors normal-case tracking-tight"
                                        >
                                            {stripEntityPrefix(interaction.interactionSerial) || 'REG-PENDING'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleOpenPatientDetails(interaction.visitorId)
                                            }
                                            className="text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors normal-case text-left"
                                        >
                                            {getVisitorName(interaction.visitorId)}
                                        </button>
                                        <div className="text-xs font-semibold text-slate-400 mt-0.5 tracking-wider">
                                            {getVisitorSerial(interaction.visitorId)}
                                        </div>
                                    </td>
                                    {showOfficer && (
                                        <td className="px-4 py-4 align-middle">
                                            <div className="text-xs font-semibold text-slate-700 normal-case tracking-tight">
                                                {getOfficerName(interaction.officerId)}
                                            </div>
                                            <div className="text-xs font-medium text-slate-400 normal-case tracking-widest mt-0.5">
                                                ID: {interaction.officerSerial || '-'}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-4 py-4 align-middle text-xs font-semibold text-slate-500 italic">
                                        {getLastVisit(interaction)}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-xs font-semibold text-slate-500 italic">
                                        {formatDate(interaction.editedAt || interaction.createdAt)}
                                    </td>
                                    {onBillNow && (
                                        <td className="px-4 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onBillNow(interaction)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Bill Now</span>
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnbilledInteractionsTable;
