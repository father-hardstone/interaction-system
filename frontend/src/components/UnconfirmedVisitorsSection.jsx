import React from 'react';
import { formatPhoneDisplay, getVisitorSerialDisplay, formatHealthCardDisplay, formatDateMMDDYYYY, getAgeYearsMonthsDisplay } from '../utils/formatUtils';

const UnconfirmedVisitorsSection = ({
    visitors,
    isLoading,
    onEdit,
    onApprove,
    onPatientClick,
    formatDate
}) => {
    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-4 sm:p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Unconfirmed Patients</h2>
                    <p className="text-sm text-slate-500 mt-1">Tentative profiles awaiting verification and approval</p>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date of Birth</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Health Card</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                            <span className="text-sm font-semibold text-slate-600">Loading unconfirmed patients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : visitors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p>No unconfirmed patients at this time.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((visitor) => (
                                    <tr
                                        key={visitor.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group"
                                        onClick={() => onPatientClick(visitor)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                                                {visitor.firstName || visitor.lastName ? `${visitor.firstName} ${visitor.lastName}`.trim() : 'New Onboarding Request'}
                                            </div>
                                            {visitor.onboardingToken?.used && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 mt-1 uppercase">Form Submitted</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}
                                            {visitor.dateOfBirth && (
                                                <span className="text-slate-400 ml-1">({getAgeYearsMonthsDisplay(visitor)})</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{getVisitorSerialDisplay(visitor)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{formatHealthCardDisplay(visitor.healthCardNumber) || '-'}</td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => onEdit(visitor)}
                                                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => onApprove(visitor)}
                                                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-100 transition-all"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UnconfirmedVisitorsSection;
