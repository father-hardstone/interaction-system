import React from 'react';
import { stripEntityPrefix } from '../utils/formatUtils';

const FollowupInteractionsTable = ({
    followupInteractions,
    handleOpenPatientDetails,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    showOfficer = false,
    getOfficerName = () => 'N/A',
    onInteractionClick,
    interactions = [],
    handleRegisterFollowup,
    registeringFollowupForId
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

    const getFollowupStatus = (interaction) => {
        // In this table we only show interactions that require followup, so we always show a status
        const followupId = interaction.followupRequired?.followupInteractionId || interaction.followupInteractionId;
        if (!followupId) return { label: 'Not scheduled', color: 'text-red-600', bg: 'bg-red-50' };
        const followupInteraction = interactions.find(i => i.id === followupId);
        if (!followupInteraction) return { label: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-50' };
        return followupInteraction.completed
            ? { label: 'Followup done', color: 'text-green-600', bg: 'bg-green-50' }
            : { label: 'Scheduled', color: 'text-blue-600', bg: 'bg-blue-50' };
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
                            <th className="px-4 py-3 text-left">
                                <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Followup Status</span>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em]">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {followupInteractions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={showOfficer ? 7 : 6}
                                    className="px-4 py-12 text-center text-xs text-slate-400"
                                >
                                    No follow-up interactions found.
                                </td>
                            </tr>
                        ) : (
                            followupInteractions.map((interaction) => (
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
                                        <div className="text-xs font-medium text-slate-400 mt-0.5 tracking-wider">
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
                                    <td className="px-4 py-4 align-middle">
                                        {(() => {
                                            const status = getFollowupStatus(interaction);
                                            return (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.color} ${status.bg || 'bg-slate-50'} border border-current/10`}>
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                        {handleRegisterFollowup && (
                                            (interaction.followupRequired?.followupInteractionId || interaction.followupInteractionId) ? (
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold cursor-not-allowed"
                                                >
                                                    Followup registered.
                                                </button>
                                            ) : registeringFollowupForId === interaction.id ? (
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm cursor-wait"
                                                >
                                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span>Registering…</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRegisterFollowup(interaction)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    <span>Register Followup</span>
                                                </button>
                                            )
                                        )}
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

export default FollowupInteractionsTable;
