import React from 'react';
import { getVisitorName, getVisitorSerial, getOfficerName, formatDate } from './utils';

const UnbilledBillingTable = ({
    unbilledInteractions,
    visitors = [],
    officers = [],
    interactions = [],
    onBillNow,
    onInteractionClick,
    onOpenPatientDetails
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Unbilled</h3>
            <div className="border border-slate-100 rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patient</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Doctor</span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Completed</span>
                            </th>
                            <th className="px-4 py-3 text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {unbilledInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-xs text-slate-400">
                                    No unbilled appointments.
                                </td>
                            </tr>
                        ) : (
                            unbilledInteractions.map((interaction) => (
                                <tr key={interaction.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4 align-middle">
                                        <button
                                            type="button"
                                            onClick={() => onInteractionClick?.(interaction)}
                                            className="text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-tight"
                                        >
                                            {interaction.interactionSerial || 'REG-PENDING'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 align-middle">
                                        <button
                                            type="button"
                                            onClick={() => onOpenPatientDetails?.(interaction.visitorId)}
                                            className="text-left"
                                        >
                                            <div className="text-sm font-bold text-slate-900">
                                                {getVisitorName(interaction.visitorId, visitors)}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400">{getVisitorSerial(interaction.visitorId, visitors)}</div>
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 align-middle text-xs font-bold text-slate-700">
                                        {getOfficerName(interaction.officerId, officers)}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-xs font-bold text-slate-500">
                                        {formatDate(interaction.editedAt || interaction.createdAt, true)}
                                    </td>
                                    <td className="px-4 py-4 align-middle text-right">
                                        <button
                                            type="button"
                                            onClick={() => onBillNow?.(interaction)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Bill Now
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

export default UnbilledBillingTable;
