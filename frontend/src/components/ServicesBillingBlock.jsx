import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const ServicesBillingBlock = ({
    serviceLines,
    addServiceLine,
    removeServiceLine,
    updateServiceLine,
    services = [],
    diagnostics = []
}) => {
    const [showDiagDropdown, setShowDiagDropdown] = useState(null);
    const [showBillingDropdown, setShowBillingDropdown] = useState(null);
    const [diagDropdownRect, setDiagDropdownRect] = useState(null);
    const [billingDropdownRect, setBillingDropdownRect] = useState(null);
    const maxLines = 4;

    const sharedDiagnostic = serviceLines[0]?.diagnostic ?? '';
    const sharedDiagDesc = serviceLines[0] ? (diagnostics.find((d) => (d.code || '').toUpperCase() === (serviceLines[0].diagnostic || '').trim().toUpperCase())?.description ?? serviceLines[0].diagnosticDescription ?? '') : '';

    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-slate-900 shadow-sm"></div>
                    <div className="text-lg font-bold text-slate-900 normal-case">Billing Information</div>
                </div>
                <button
                    type="button"
                    onClick={addServiceLine}
                    disabled={serviceLines.length >= maxLines}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Billing Line
                </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                <table className="w-full border-collapse min-w-[640px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-12">Sr</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[90px]">Diag Code</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider min-w-[140px]">Description</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[90px]">Billing Code</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider min-w-[140px]">Description</th>
                            <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[72px]">Fee</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceLines.map((line, index) => (
                            <tr key={line.id || index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                                <td className="px-3 py-2 align-middle">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                                        {line.serialNumber}
                                    </span>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <div className="relative">
                                        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                                            <input
                                                type="text"
                                                className="w-full min-w-[7ch] px-2 py-2 text-sm focus:outline-none placeholder:text-slate-300"
                                                placeholder="Code"
                                                value={line.diagnostic}
                                                onChange={(e) => updateServiceLine(index, 'diagnostic', e.target.value)}
                                                onFocus={(e) => {
                                                    const rect = e.target.getBoundingClientRect();
                                                    setDiagDropdownRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
                                                    setShowDiagDropdown(index);
                                                }}
                                                onBlur={() => setTimeout(() => setShowDiagDropdown(null), 150)}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <div className="text-sm text-slate-500 truncate max-w-[200px]" title={sharedDiagDesc}>
                                        {sharedDiagDesc || '—'}
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <div className="relative">
                                        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                                            <input
                                                type="text"
                                                className="w-full min-w-[7ch] px-2 py-2 text-sm focus:outline-none placeholder:text-slate-300"
                                                placeholder="Code"
                                                value={line.billingCode}
                                                onChange={(e) => updateServiceLine(index, 'billingCode', e.target.value)}
                                                onFocus={(e) => {
                                                    const rect = e.target.getBoundingClientRect();
                                                    setBillingDropdownRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
                                                    setShowBillingDropdown(index);
                                                }}
                                                onBlur={() => setTimeout(() => setShowBillingDropdown(null), 150)}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <div className="text-sm text-slate-500 truncate max-w-[200px]" title={line.billingDescription}>
                                        {line.billingDescription || '—'}
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-middle text-right">
                                    <span className="text-sm font-semibold text-blue-600">
                                        {line.totalFee ? `$${line.totalFee}` : '$0.00'}
                                    </span>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <button
                                        type="button"
                                        onClick={() => removeServiceLine(index)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded"
                                        title="Remove line"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Portal-rendered dropdowns */}
            {showDiagDropdown !== null && diagDropdownRect && diagnostics.length > 0 && (() => {
                const idx = showDiagDropdown;
                const line = serviceLines[idx] || {};
                const filtered = diagnostics.filter((d) => {
                    const q = (line.diagnostic || '').trim().toUpperCase();
                    return !q || ((d.code || '').toUpperCase().includes(q) || (d.description || '').toUpperCase().includes(q));
                });
                return createPortal(
                    <div
                        className="fixed z-[9999] max-h-48 overflow-y-auto overflow-x-hidden bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[200px] max-w-[280px]"
                        style={{ top: diagDropdownRect.top, left: diagDropdownRect.left, width: diagDropdownRect.width }}
                    >
                        <div className="text-xs font-semibold text-slate-400 normal-case px-3 py-1.5 border-b border-slate-100 sticky top-0 bg-white">Available Codes</div>
                        {filtered.map((d, di) => (
                            <button key={`diag-${idx}-${di}-${d.code || di}`} type="button" className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50" onClick={() => { updateServiceLine(idx, 'diagnostic', d.code); setShowDiagDropdown(null); }}>
                                <span className="font-semibold text-slate-700">{d.code}</span> {d.description ? `- ${d.description}` : ''}
                            </button>
                        ))}
                    </div>,
                    document.body
                );
            })()}
            {showBillingDropdown !== null && billingDropdownRect && services.length > 0 && (() => {
                const idx = showBillingDropdown;
                const line = serviceLines[idx] || {};
                const filtered = services.filter((s) => {
                    const q = (line.billingCode || '').trim().toUpperCase();
                    return !q || ((s.code || '').toUpperCase().includes(q) || (s.description || '').toUpperCase().includes(q));
                });
                return createPortal(
                    <div
                        className="fixed z-[9999] max-h-48 overflow-y-auto overflow-x-hidden bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[200px] max-w-[280px]"
                        style={{ top: billingDropdownRect.top, left: billingDropdownRect.left, width: billingDropdownRect.width }}
                    >
                        <div className="text-xs font-semibold text-slate-400 normal-case px-3 py-1.5 border-b border-slate-100 sticky top-0 bg-white">Available Codes</div>
                        {filtered.map((s, si) => (
                            <button key={`svc-${idx}-${si}-${s.code || si}`} type="button" className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50" onClick={() => { updateServiceLine(idx, 'billingCode', s.code); setShowBillingDropdown(null); }}>
                                <span className="font-semibold text-slate-700">{s.code}</span> {s.description ? `- ${s.description}` : ''}
                            </button>
                        ))}
                    </div>,
                    document.body
                );
            })()}
        </div>
    );
};

export default ServicesBillingBlock;
