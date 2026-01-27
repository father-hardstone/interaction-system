import React from 'react';

const ServicesBillingBlock = ({
    serviceLines,
    addServiceLine,
    removeServiceLine,
    updateServiceLine
}) => {
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
                    <div key={index} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 bg-white border border-slate-100 rounded-lg p-3 hover:border-blue-200 transition-colors">

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-xs font-bold text-slate-400 shrink-0">
                            {line.serialNumber}
                        </div>

                        {/* Diagnostic Code First */}
                        <div className="flex-1 min-w-[120px]">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">DIAG CODE</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-full bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                placeholder="Code"
                                value={line.diagnostic}
                                onChange={(e) => updateServiceLine(index, 'diagnostic', e.target.value)}
                            />
                        </div>

                        <div className="flex-[2] min-w-[150px] hidden sm:block">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">DESCRIPTION</label>
                            <div className="px-3 py-2 text-sm text-slate-500 truncate h-[38px] flex items-center border-b border-transparent">
                                {line.diagnosticDescription || '---'}
                            </div>
                        </div>

                        <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>

                        {/* Billing Code Second */}
                        <div className="flex-1 min-w-[120px]">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">BILLING CODE</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-full bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-300"
                                placeholder="Code"
                                value={line.billingCode}
                                onChange={(e) => updateServiceLine(index, 'billingCode', e.target.value)}
                            />
                        </div>

                        <div className="flex-[2] min-w-[150px] hidden sm:block">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">DESCRIPTION</label>
                            <div className="px-3 py-2 text-sm text-slate-500 truncate h-[38px] flex items-center border-b border-transparent">
                                {line.billingDescription || '---'}
                            </div>
                        </div>

                        <div className="w-[80px] text-right shrink-0 hidden sm:block">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block pr-1">FEE</label>
                            <div className="text-sm font-bold text-blue-600 h-[38px] flex items-center justify-end px-1">
                                {line.totalFee ? `$${line.totalFee}` : '$0.00'}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeServiceLine(index)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors ml-2"
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
                        className="text-xs font-bold text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Billing Line
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServicesBillingBlock;
