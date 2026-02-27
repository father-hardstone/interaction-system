import React, { useMemo } from 'react';
import { getVisitorName, getVisitorSerialDisplay } from './utils';

const UnbilledBillingTable = ({
    unbilledInteractions,
    isLoading = false,
    visitors = [],
    onBillNow,
    onInteractionClick
}) => {
    const visitorById = useMemo(() => {
        const map = new Map();
        for (const v of visitors) map.set(v.id, v);
        return map;
    }, [visitors]);

    const getServiceCodesDisplay = (interaction) => {
        const codes = (interaction?.serviceLines || [])
            .map((l) => (l?.service || '').trim())
            .filter(Boolean);
        const uniq = Array.from(new Set(codes));
        return uniq.length > 0 ? uniq.join(', ') : '—';
    };

    const getDiagnosticCodesDisplay = (interaction) => {
        const codes = (interaction?.serviceLines || [])
            .map((l) => (l?.diagnostic || '').trim())
            .filter(Boolean);
        const uniq = Array.from(new Set(codes));
        return uniq.length > 0 ? uniq.join(', ') : '—';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
            <p className="text-sm text-slate-500 px-4 sm:px-6 py-3 border-b border-slate-200 shrink-0">These interactions are now ready for billing.</p>
            <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full border-collapse min-w-[900px]">
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Record #</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Patient</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Service code(s)</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Diagnostic code(s)</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700"># of service</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-4 sm:px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">Loading unbilled appointments…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : unbilledInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No unbilled appointments.
                                </td>
                            </tr>
                        ) : (
                            unbilledInteractions.map((interaction, idx) => {
                                const visitor = visitorById.get(interaction.visitorId);
                                const patientName = getVisitorName(interaction.visitorId, visitors);
                                const patientId = getVisitorSerialDisplay(interaction.visitorId, visitors);
                                return (
                                    <tr
                                        key={interaction.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                        onClick={() => onInteractionClick?.(interaction)}
                                    >
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm font-medium">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-900 text-sm font-semibold">
                                            {patientName}{' '}
                                            <span className="text-slate-500 font-medium">
                                                ({patientId || '—'})
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {getServiceCodesDisplay(interaction)}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {getDiagnosticCodesDisplay(interaction)}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {/* Keep empty for now */}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => onBillNow?.(interaction)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                                            >
                                                Bill Now
                                            </button>
                                        </td>
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

export default UnbilledBillingTable;
