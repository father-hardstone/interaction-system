import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BILLING_TYPES } from './constants';
import {
    getVisitorName,
    getVisitorSerial,
    getOfficerName,
    getOfficerSerial,
    calculateAge,
    formatDate
} from './utils';

const formatAccountingNumber = (v) => {
    const d = (v || '').replace(/\D/g, '').slice(0, 6);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
};
const parseAccountingNumber = (v) => (v || '').replace(/\D/g, '').slice(0, 6);

const getSuffixFromBillingCode = (code) => {
    const first = (code || '').trim().charAt(0);
    return /[A-Za-z]/.test(first) ? first.toUpperCase() : '';
};

const FEE_FIELD_BY_BILLING_TYPE = {
    hcp: 'hcpFee',
    t_fee: 'tFee',
    p_fee: 'pFee',
    s_fee: 'sFee'
};

const BillNowModal = ({
    isOpen,
    onClose,
    interaction,
    visitors = [],
    officers = [],
    services = [],
    diagnostics = [],
    onSave
}) => {
    const [billingType, setBillingType] = useState('hcp');
    const [showBillingDropdown, setShowBillingDropdown] = useState(null);
    const [showDiagnosticDropdown, setShowDiagnosticDropdown] = useState(null);
    const [billingDropdownRect, setBillingDropdownRect] = useState(null);
    const [diagnosticDropdownRect, setDiagnosticDropdownRect] = useState(null);
    const [cpsocode, setCpsocode] = useState('');
    const [accountingNumber, setAccountingNumber] = useState('');
    const [billingLines, setBillingLines] = useState([]);

    const visitor = visitors.find((v) => v.id === interaction?.visitorId);

    const getFeeForService = useCallback((serviceCode, feeType) => {
        const svc = services.find((s) => (s.code || '').toUpperCase() === (serviceCode || '').toUpperCase());
        if (!svc) return 0;
        const field = FEE_FIELD_BY_BILLING_TYPE[feeType] || 'hcpFee';
        return parseFloat(svc[field]) || 0;
    }, [services]);

    const applyFeesFromBillingType = useCallback((lines) => {
        return lines.map((line) => {
            // When line has a service, always use the fee for the selected billing type (even if 0)
            if (line.service) {
                const fee = getFeeForService(line.service, billingType);
                return { ...line, totalFee: fee };
            }
            return { ...line, totalFee: line.totalFee ?? '' };
        });
    }, [billingType, getFeeForService]);

    useEffect(() => {
        if (isOpen && interaction) {
            setBillingType('hcp');
            setCpsocode('');
            const lines = interaction.serviceLines || [];
            const topAcct = parseAccountingNumber(interaction.accountingNumber ?? '');
            setAccountingNumber(topAcct);
            // Pre-fill billing code from doctor's entry (billingCode or service) in interaction
            const rawLines = lines.length === 0
                ? [{ serialNumber: 1, suffix: '', service: '', diagnostic: '', accountingNumber: topAcct, totalFee: '' }]
                : lines.map((l) => {
                    const service = (l.billingCode || l.service || '').trim();
                    return {
                        serialNumber: l.serialNumber ?? 0,
                        suffix: getSuffixFromBillingCode(service),
                        service,
                        diagnostic: l.diagnostic || '',
                        accountingNumber: parseAccountingNumber(l.accountingNumber ?? topAcct),
                        totalFee: l.totalFee ?? ''
                    };
                });
            // Apply fees based on initial billing type (hcp)
            const withFees = rawLines.map((l) => {
                const fee = l.service ? getFeeForService(l.service, 'hcp') : (l.totalFee ?? '');
                return { ...l, totalFee: fee };
            });
            setBillingLines(withFees);
        }
    }, [isOpen, interaction, getFeeForService]);

    // When billing type changes, recalculate fees for lines with a service selected
    useEffect(() => {
        if (!isOpen || !interaction) return;
        setBillingLines((prev) => applyFeesFromBillingType(prev));
    }, [billingType, isOpen, interaction, applyFeesFromBillingType]);

    if (!isOpen || !interaction) return null;

    const doctorName = getOfficerName(interaction.officerId, officers);
    const doctorId = getOfficerSerial(interaction.officerId, officers);
    const patientName = getVisitorName(interaction.visitorId, visitors);
    const patientId = getVisitorSerial(interaction.visitorId, visitors);
    const age = calculateAge(visitor?.dateOfBirth);
    const healthCard = visitor?.healthCardNumber || '-';
    const healthVersion = visitor?.healthCardVersion || '-';
    const healthExpiry = visitor?.healthCardExpiryDate || '-';
    const gender = visitor?.gender || '-';
    const dob = visitor?.dateOfBirth || '-';
    const interactionDate = formatDate(interaction.editedAt || interaction.createdAt, false);

    const updateBillingLine = (index, field, value) => {
        setBillingLines((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleServiceSelect = (index, serviceCode) => {
        const fee = serviceCode ? getFeeForService(serviceCode, billingType) : '';
        const suffix = getSuffixFromBillingCode(serviceCode);
        setBillingLines((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                service: serviceCode,
                suffix,
                totalFee: fee
            };
            return next;
        });
    };


    const addBillingLine = () => {
        setBillingLines((prev) => [
            ...prev,
            {
                serialNumber: prev.length + 1,
                suffix: '',
                service: '',
                diagnostic: '',
                accountingNumber: accountingNumber,
                totalFee: ''
            }
        ]);
    };

    const removeBillingLine = (index) => {
        if (billingLines.length <= 1) return;
        setBillingLines((prev) => {
            const next = prev.filter((_, i) => i !== index);
            return next.map((l, i) => ({ ...l, serialNumber: i + 1 }));
        });
    };

    const totalFee = billingLines.reduce((sum, l) => sum + parseFloat(l.totalFee || 0), 0);

    const handleSave = () => {
        onSave?.({ billingType, cpsocode, accountingNumber, billingLines });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={onClose}>
            <div
                className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-6">Bill Now</h2>

                {/* Doctor - single line, bordered */}
                <div className="flex flex-wrap items-end gap-4 p-4 mb-4 border border-slate-200 rounded-xl bg-slate-50/30">
                    <div className="min-w-[80px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Doctor ID</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{doctorId}</div>
                    </div>
                    <div className="min-w-[120px] flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Doctor Name</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{doctorName}</div>
                    </div>
                    <div className="min-w-[100px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CPSO Code</label>
                        <input
                            type="text"
                            value={cpsocode}
                            onChange={(e) => setCpsocode(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                            placeholder="CPSO"
                        />
                    </div>
                    <div className="min-w-[100px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Accounting Number</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={8}
                            value={formatAccountingNumber(accountingNumber)}
                            onChange={(e) => setAccountingNumber(parseAccountingNumber(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-mono"
                            placeholder="12-34-56"
                        />
                    </div>
                </div>

                {/* Patient - single line, bordered */}
                <div className="flex flex-wrap items-end gap-4 p-4 mb-4 border border-slate-200 rounded-xl bg-slate-50/30">
                    <div className="min-w-[80px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Patient ID</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{patientId}</div>
                    </div>
                    <div className="min-w-[140px] flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Patient Name</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{patientName}</div>
                    </div>
                    <div className="min-w-[60px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Age</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{age}</div>
                    </div>
                </div>

                {/* Card details - single line, bordered */}
                <div className="flex flex-wrap items-end gap-4 p-4 mb-4 border border-slate-200 rounded-xl bg-slate-50/30">
                    <div className="min-w-[100px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Health Card No</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{healthCard}</div>
                    </div>
                    <div className="min-w-[70px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Version</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{healthVersion}</div>
                    </div>
                    <div className="min-w-[90px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expiry Date</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{healthExpiry}</div>
                    </div>
                    <div className="min-w-[70px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gender</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{gender}</div>
                    </div>
                    <div className="min-w-[100px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">DOB</label>
                        <div className="px-3 py-2 bg-white rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{dob}</div>
                    </div>
                </div>

                {/* Billing type + Interaction date */}
                <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div className="min-w-[120px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fee Type</label>
                        <select
                            value={billingType}
                            onChange={(e) => setBillingType(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {BILLING_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[120px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Interaction Date</label>
                        <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-700 border border-slate-200">{interactionDate}</div>
                    </div>
                </div>

                {/* Billing lines - editable */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Lines</label>
                        <button
                            type="button"
                            onClick={addBillingLine}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                            + Add Line
                        </button>
                    </div>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase w-10">#</th>
                                    <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase w-20">Suffix</th>
                                    <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Billing</th>
                                    <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase">Diagnostic</th>
                                    <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase w-28">Accounting #</th>
                                    <th className="px-3 py-2 text-left text-[10px] font-black text-slate-400 uppercase w-24">Fee</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {billingLines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                {line.serialNumber || idx + 1}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700">
                                                {getSuffixFromBillingCode(line.service) || '—'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 relative">
                                            <div className="flex items-stretch border border-slate-200 rounded overflow-hidden bg-white min-w-[180px] focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                                                <input
                                                    type="text"
                                                    value={line.service ?? ''}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        const svc = services.find((s) => (s.code || '').toUpperCase() === v.trim().toUpperCase());
                                                        const suffix = getSuffixFromBillingCode(v);
                                                        setBillingLines((prev) => {
                                                            const next = [...prev];
                                                            next[idx] = {
                                                                ...next[idx],
                                                                service: v,
                                                                suffix,
                                                                totalFee: svc ? getFeeForService(v.trim(), billingType) : (prev[idx].totalFee ?? '')
                                                            };
                                                            return next;
                                                        });
                                                    }}
                                                    onFocus={(e) => {
                                                        const rect = e.target.getBoundingClientRect();
                                                        setBillingDropdownRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
                                                        setShowBillingDropdown(idx);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowBillingDropdown(null), 180)}
                                                    className="w-[7ch] min-w-[7ch] px-2 py-1.5 text-sm border-r border-slate-200 focus:ring-0 focus:outline-none"
                                                    placeholder="Code"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={(() => {
                                                        const svc = services.find((s) => (s.code || '').toUpperCase() === (line.service || '').trim().toUpperCase());
                                                        return svc?.description ?? '';
                                                    })()}
                                                    className="flex-1 min-w-0 max-w-[100px] px-2 py-1.5 text-sm text-slate-500 bg-slate-50 border-0 cursor-default truncate"
                                                    placeholder="—"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 relative">
                                            <div className="flex items-stretch border border-slate-200 rounded overflow-hidden bg-white min-w-[100px] focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                                                <input
                                                    type="text"
                                                    value={line.diagnostic ?? ''}
                                                    onChange={(e) => updateBillingLine(idx, 'diagnostic', e.target.value)}
                                                    onFocus={(e) => {
                                                        const rect = e.target.getBoundingClientRect();
                                                        setDiagnosticDropdownRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 220) });
                                                        setShowDiagnosticDropdown(idx);
                                                    }}
                                                    onBlur={() => setTimeout(() => setShowDiagnosticDropdown(null), 180)}
                                                    className="w-[7ch] min-w-[7ch] px-2 py-1.5 text-sm border-r border-slate-200 focus:ring-0 focus:outline-none"
                                                    placeholder="Dx"
                                                />
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={(() => {
                                                        const diag = diagnostics.find((d) => (d.code || '').toUpperCase() === (line.diagnostic || '').trim().toUpperCase());
                                                        return diag?.description ?? '';
                                                    })()}
                                                    className="flex-1 min-w-0 max-w-[100px] px-2 py-1.5 text-sm text-slate-500 bg-slate-50 border-0 cursor-default truncate"
                                                    placeholder="—"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={8}
                                                value={formatAccountingNumber(line.accountingNumber ?? accountingNumber)}
                                                onChange={(e) => updateBillingLine(idx, 'accountingNumber', parseAccountingNumber(e.target.value))}
                                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                                placeholder="12-34-56"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={line.totalFee}
                                                onChange={(e) => updateBillingLine(idx, 'totalFee', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => removeBillingLine(idx)}
                                                disabled={billingLines.length <= 1}
                                                className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                            <tfoot className="bg-slate-50 border-t border-slate-200">
                                <tr>
                                    <td colSpan={5} className="px-3 py-2 text-right font-bold text-slate-600">Total</td>
                                    <td className="px-3 py-2 text-right font-bold text-slate-900">${totalFee.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Portal-rendered dropdowns (high z-index, own scroll, not clipped by parent) */}
                {showBillingDropdown !== null && billingDropdownRect && services.length > 0 && (() => {
                    const idx = showBillingDropdown;
                    const line = billingLines[idx] || {};
                    const filtered = services.filter((s) => !(line.service || '').trim() || (s.code || '').toUpperCase().includes((line.service || '').trim().toUpperCase()) || (s.description || '').toUpperCase().includes((line.service || '').trim().toUpperCase()));
                    return createPortal(
                        <div
                            className="fixed z-[9999] max-h-48 overflow-y-auto overflow-x-hidden bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[200px]"
                            style={{ top: billingDropdownRect.top, left: billingDropdownRect.left, width: billingDropdownRect.width }}
                        >
                            <div className="text-[9px] font-black text-slate-400 uppercase px-3 py-1.5 border-b border-slate-100 sticky top-0 bg-white">Available codes</div>
                            {filtered.map((s, si) => (
                                <button
                                    key={`svc-${si}-${s.code}`}
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50"
                                    onMouseDown={(e) => { e.preventDefault(); handleServiceSelect(idx, s.code); setShowBillingDropdown(null); }}
                                >
                                    <span className="font-semibold text-slate-700">{s.code}</span> {s.description ? `- ${s.description}` : ''}
                                </button>
                            ))}
                        </div>,
                        document.body
                    );
                })()}
                {showDiagnosticDropdown !== null && diagnosticDropdownRect && diagnostics.length > 0 && (() => {
                    const idx = showDiagnosticDropdown;
                    const line = billingLines[idx] || {};
                    const filtered = diagnostics.filter((d) => {
                        const q = (line.diagnostic || '').trim().toUpperCase();
                        return !q || (d.code || '').toUpperCase().includes(q) || (d.description || '').toUpperCase().includes(q);
                    });
                    return createPortal(
                        <div
                            className="fixed z-[9999] max-h-48 overflow-y-auto overflow-x-hidden bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[220px]"
                            style={{ top: diagnosticDropdownRect.top, left: diagnosticDropdownRect.left, width: diagnosticDropdownRect.width }}
                        >
                            <div className="text-[9px] font-black text-slate-400 uppercase px-3 py-1.5 border-b border-slate-100 sticky top-0 bg-white">Available codes</div>
                            {filtered.map((d, di) => (
                                <button
                                    key={`diag-${idx}-${di}-${d.code}-${d.description}`}
                                    type="button"
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50"
                                    onMouseDown={(e) => { e.preventDefault(); updateBillingLine(idx, 'diagnostic', d.code); setShowDiagnosticDropdown(null); }}
                                >
                                    <span className="font-semibold text-slate-700">{d.code}</span> {d.description ? `- ${d.description}` : ''}
                                </button>
                            ))}
                        </div>,
                        document.body
                    );
                })()}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-200 text-slate-800 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillNowModal;
