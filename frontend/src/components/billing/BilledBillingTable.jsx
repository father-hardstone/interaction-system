import React from 'react';
import { getVisitorName, getVisitorSerialDisplay, getOfficerName, formatDate, formatDateMMDDYYYY, formatPhoneDisplay, formatHealthCardDisplay, getRegistrationDisplayId } from './utils';
import { getAgeYearsMonthsDisplay } from '../../utils/formatUtils';

const BilledBillingTable = ({
    billedInteractions,
    visitors = [],
    officers = [],
    onInteractionClick,
    onOpenPatientDetails
}) => {
    const getTotalFee = (interaction) => {
        const lines = interaction.serviceLines || [];
        return lines.reduce((sum, l) => sum + parseFloat(l.totalFee || 0), 0).toFixed(2);
    };

    const getVisitor = (visitorId) => visitors.find((v) => v.id === visitorId);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Version</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Registration</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Doctor</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Completed</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billedInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                                    No billed appointments.
                                </td>
                            </tr>
                        ) : (
                            billedInteractions.map((interaction) => {
                                const visitor = getVisitor(interaction.visitorId);
                                return (
                                    <tr
                                    key={interaction.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                    onClick={() => onInteractionClick?.(interaction)}
                                >
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 hidden md:table-cell text-sm">
                                        {visitor ? (
                                            <>
                                                {formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}
                                                {visitor.dateOfBirth && <span className="text-slate-500 ml-1">({getAgeYearsMonthsDisplay(visitor)})</span>}
                                            </>
                                        ) : '-'}
                                    </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onOpenPatientDetails?.(interaction.visitorId)}
                                                className="text-left"
                                            >
                                                <div className="font-medium text-sm">
                                                    {getVisitorName(interaction.visitorId, visitors)}
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{getVisitorSerialDisplay(interaction.visitorId, visitors)}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{visitor ? formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-' : '-'}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor ? formatHealthCardDisplay(visitor.healthCardNumber || '') || '-' : '-'}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor?.healthCardVersion || '-'}</td>
                                        <td className="px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onInteractionClick?.(interaction)}
                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 normal-case tracking-tight"
                                            >
                                                {getRegistrationDisplayId(interaction)}
                                            </button>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{getOfficerName(interaction.officerId, officers)}</td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{formatDate(interaction.editedAt || interaction.createdAt, true)}</td>
                                        <td className="px-4 sm:px-6 py-4 text-right font-semibold text-slate-900">${getTotalFee(interaction)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BilledBillingTable;
