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

    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md mt-8">
            <div className="flex items-center gap-3 mb-1">
                <div className="w-1 h-8 rounded-full bg-slate-900 shadow-sm"></div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">Financial Ledger</label>
                    <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">Billing Information</div>
                </div>
            </div>

            <div className="space-y-3">
                {serviceLines.map((line, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-3 bg-white rounded-lg p-3 hover:bg-slate-50/50 transition-colors">

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-xs font-bold text-slate-400 shrink-0">
                            {line.serialNumber}
                        </div>

                        {/* Diagnostic: narrow code + read-only description */}
                        <div className="flex-[1] min-w-[120px] max-w-[200px] relative">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">DIAG CODE</label>
                            <div className="flex items-stretch border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                                <input
                                    type="text"
                                    className="w-[7ch] min-w-[7ch] px-2 py-2 text-sm border-r border-slate-200 focus:outline-none placeholder:text-slate-300"
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
                                <input
                                    type="text"
                                    readOnly
                                    value={(() => {
                                        const diag = diagnostics.find((d) => (d.code || '').toUpperCase() === (line.diagnostic || '').trim().toUpperCase());
                                        return diag?.description ?? '';
                                    })()}
                                    className="flex-1 min-w-0 max-w-[100px] px-2 py-2 text-sm text-slate-500 bg-slate-50 border-0 cursor-default truncate"
                                    placeholder="—"
                                />
                            </div>
                        </div>

                        {/* Billing: narrow code + read-only description */}
                        <div className="flex-[1] min-w-[120px] max-w-[200px] relative">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">BILLING CODE</label>
                            <div className="flex items-stretch border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:bg-white focus-within:border-blue-500 transition-all">
                                <input
                                    type="text"
                                    className="w-[7ch] min-w-[7ch] px-2 py-2 text-sm border-r border-slate-200 focus:outline-none placeholder:text-slate-300"
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
                                <input
                                    type="text"
                                    readOnly
                                    value={(() => {
                                        const svc = services.find((s) => (s.code || '').toUpperCase() === (line.billingCode || '').trim().toUpperCase());
                                        return svc?.description ?? '';
                                    })()}
                                    className="flex-1 min-w-0 max-w-[100px] px-2 py-2 text-sm text-slate-500 bg-slate-50 border-0 cursor-default truncate"
                                    placeholder="—"
                                />
                            </div>
                        </div>

                        <div className="w-[70px] text-right shrink-0">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block pr-1">FEE</label>
                            <div className="text-sm font-bold text-blue-600 h-[38px] flex items-center justify-end px-1">
                                {line.totalFee ? `$${line.totalFee}` : '$0.00'}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeServiceLine(index)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={addServiceLine}
                        disabled={serviceLines.length >= maxLines}
                        className="text-xs font-bold text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Billing Line
                    </button>
                </div>

                {/* Portal-rendered dropdowns (high z-index, own scroll, not clipped by parent) */}
                {showDiagDropdown !== null && diagDropdownRect && diagnostics.length > 0 && (() => {
                    const idx = showDiagDropdown;
                    const line = serviceLines[idx] || {};
                    const filtered = diagnostics.filter((d) => {
                        const q = (line.diagnostic || '').trim().toUpperCase();
                        return !q || (d.code || '').toUpperCase().includes(q) || (d.description || '').toUpperCase().includes(q);
                    });
                    return createPortal(
                        <div
                            className="fixed z-[9999] max-h-48 overflow-y-auto overflow-x-hidden bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[200px] max-w-[280px]"
                            style={{ top: diagDropdownRect.top, left: diagDropdownRect.left, width: diagDropdownRect.width }}
                        >
                            <div className="text-[9px] font-black text-slate-400 uppercase px-3 py-1.5 border-b border-slate-100 sticky top-0 bg-white">Available codes</div>
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
                        return !q || (s.code || '').toUpperCase().includes(q) || (s.description || '').toUpperCase().includes(q);
                    });
                    return createPortal(
                        <div
                            className="fixed z-[9999] max-h-48 overflow-y-auto overflow-x-hidden bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[200px] max-w-[280px]"
                            style={{ top: billingDropdownRect.top, left: billingDropdownRect.left, width: billingDropdownRect.width }}
                        >
                            <div className="text-[9px] font-black text-slate-400 uppercase px-3 py-1.5 border-b border-slate-100 sticky top-0 bg-white">Available codes</div>
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
        </div>
    );
};

export default ServicesBillingBlock;
