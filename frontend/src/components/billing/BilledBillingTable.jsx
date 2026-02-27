import React, { useState, useEffect } from 'react';
import { getVisitorName, getVisitorSerialDisplay } from './utils';

const BilledBillingTable = ({
    billedInteractions,
    isLoading = false,
    visitors = [],
    officers = [],
    onInteractionClick,
    onOpenPatientDetails,
    onUnbill,
    onProcessForMinistry,
    isGeneratingSheet = false
}) => {
    const getVisitor = (visitorId) => visitors.find((v) => v.id === visitorId);

    const [selectedRowKeys, setSelectedRowKeys] = useState(() => new Set());

    useEffect(() => {
        // Reset selection when the billed interactions list changes
        setSelectedRowKeys(new Set());
    }, [billedInteractions]);

    const formatFeeType = (interaction) => {
        const t = (interaction?.billingType || '').toLowerCase();
        if (t === 'hcp') return 'HCP';
        if (t === 't_fee') return 'T-Fee';
        if (t === 'p_fee') return 'P-Fee';
        if (t === 's_fee') return 'S-Fee';
        return t || '—';
    };

    const flatRows = billedInteractions.flatMap((interaction) => {
        const visitor = getVisitor(interaction.visitorId);
        const patientId = getVisitorSerialDisplay(interaction.visitorId, visitors);
        const patientName = getVisitorName(interaction.visitorId, visitors);
        const lines = Array.isArray(interaction.serviceLines) && interaction.serviceLines.length > 0
            ? interaction.serviceLines
            : [{ service: '', diagnostic: '', serialNumber: 1, totalFee: interaction.totalFee || 0 }];
        const feeTypeLabel = formatFeeType(interaction);
        return lines.map((line, idx) => ({
            key: `${interaction.id}-${idx}`,
            interaction,
            line,
            idx,
            patientId,
            patientName,
            feeTypeLabel
        }));
    });

    const allSelected = flatRows.length > 0 && flatRows.every((r) => selectedRowKeys.has(r.key));
    const selectedCount = flatRows.reduce((sum, r) => sum + (selectedRowKeys.has(r.key) ? 1 : 0), 0);

    const toggleRow = (key) => {
        setSelectedRowKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const toggleAll = () => {
        setSelectedRowKeys((prev) => {
            const next = new Set();
            if (!allSelected) {
                flatRows.forEach((r) => next.add(r.key));
            }
            return next;
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-white">
                    <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={allSelected}
                            disabled={isGeneratingSheet || flatRows.length === 0}
                            onChange={toggleAll}
                        />
                        <span>Select all</span>
                    </label>
                    <button
                        type="button"
                        disabled={selectedCount <= 1 || isGeneratingSheet}
                        onClick={() => {
                            const selectedRows = flatRows.filter((r) => selectedRowKeys.has(r.key));
                            if (selectedRows.length <= 1) return;
                            const baseRows = selectedRows.map((r) => {
                                const { interaction: i, line: ln, idx: lineIdx, patientId: pid, patientName: pname, feeTypeLabel: feeT, key: k } = r;
                                const rawDate = i.completedAt || i.editedAt || i.createdAt || '';
                                const totalFeeNum = typeof ln.totalFee === 'number'
                                    ? ln.totalFee
                                    : (parseFloat(ln.totalFee || 0) || 0);
                                return {
                                    key: k,
                                    interactionId: i.id,
                                    patientId: pid,
                                    patientName: pname,
                                    accountingNumber: i.accountingNumber || '',
                                    serviceDate: rawDate,
                                    serviceCode: ln.service || '',
                                    diagnosticCode: ln.diagnostic || '',
                                    lineNumber: ln.serialNumber ?? lineIdx + 1,
                                    totalFee: totalFeeNum,
                                    feeTypeLabel: feeT,
                                    refDoctor: i.referral?.to || ''
                                };
                            });
                            onProcessForMinistry?.(baseRows);
                        }}
                        className="px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingSheet ? 'Processing…' : 'Process Bulk for Ministry'}
                    </button>
                </div>
                <table className="w-full border-collapse min-w-[900px]">
                    <thead className="sticky top-0 z-10 bg-white">
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 sm:px-3 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 w-10">
                                {/* Row checkbox column */}
                            </th>
                            <th className="px-2 sm:px-4 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Accounting #</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Service</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Diag</th>
                            <th className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-slate-700">#</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Total fee</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Fee type</th>
                            <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">RefDocNo</th>
                            <th className="px-4 sm:px-6 py-4 text-right text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={11} className="px-4 sm:px-6 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-slate-500">Loading billed appointments…</span>
                                    </div>
                                </td>
                            </tr>
                        ) : billedInteractions.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                                    No billed appointments.
                                </td>
                            </tr>
                        ) : (
                            flatRows.map((row) => {
                                const { interaction, line, idx, key, patientId, patientName, feeTypeLabel } = row;
                                return (
                                    <tr
                                        key={key}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                        onClick={() => onInteractionClick?.(interaction)}
                                    >
                                        <td className="px-4 sm:px-3 py-4">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={selectedRowKeys.has(key)}
                                                disabled={isGeneratingSheet}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleRow(key);
                                                }}
                                            />
                                        </td>
                                        <td className="px-2 sm:px-4 py-4 font-medium text-slate-900 text-xs sm:text-sm">
                                            {idx === 0 ? patientId : ''}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700">
                                            {idx === 0 ? patientName : ''}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm font-mono">
                                            {interaction.accountingNumber || '—'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {(() => {
                                                const code = (line.service || '').trim();
                                                if (!code) return '—';
                                                const suffix = code.charAt(0).toUpperCase();
                                                return `${code}  ${suffix}`;
                                            })()}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {line.diagnostic || '—'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center text-slate-700 text-sm">
                                            {line.serialNumber ?? idx + 1}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right text-slate-700 text-sm">
                                            {typeof line.totalFee === 'number'
                                                ? `$${line.totalFee.toFixed(2)}`
                                                : `$${(parseFloat(line.totalFee || 0) || 0).toFixed(2)}`}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {feeTypeLabel}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                            {interaction.referral?.to || '—'}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="inline-flex items-center gap-2">
                                                {idx === 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onUnbill?.(interaction)}
                                                    disabled={isGeneratingSheet}
                                                    className="px-3 py-1 bg-slate-200 text-slate-800 rounded-md text-xs sm:text-sm hover:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Unbill
                                                </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    disabled={isGeneratingSheet}
                                                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs sm:text-sm hover:bg-blue-100 border border-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const selectedRows = flatRows.filter((r) => selectedRowKeys.has(r.key));
                                                        const baseRows = (selectedRows.length > 1 ? selectedRows : [row]).map((r) => {
                                                            const { interaction: i, line: ln, idx: lineIdx, patientId: pid, patientName: pname, feeTypeLabel: feeT, key: k } = r;
                                                            const rawDate = i.completedAt || i.editedAt || i.createdAt || '';
                                                            const totalFeeNum = typeof ln.totalFee === 'number'
                                                                ? ln.totalFee
                                                                : (parseFloat(ln.totalFee || 0) || 0);
                                                            return {
                                                                key: k,
                                                                interactionId: i.id,
                                                                patientId: pid,
                                                                patientName: pname,
                                                                accountingNumber: i.accountingNumber || '',
                                                                serviceDate: rawDate,
                                                                serviceCode: ln.service || '',
                                                                diagnosticCode: ln.diagnostic || '',
                                                                lineNumber: ln.serialNumber ?? lineIdx + 1,
                                                                totalFee: totalFeeNum,
                                                                feeTypeLabel: feeT,
                                                                refDoctor: i.referral?.to || ''
                                                            };
                                                        });
                                                        onProcessForMinistry?.(baseRows);
                                                    }}
                                                >
                                                    Process for Ministry
                                                </button>
                                            </div>
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

export default BilledBillingTable;
