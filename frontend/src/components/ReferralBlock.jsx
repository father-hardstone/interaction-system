import React from 'react';

const ReferralBlock = ({ referral, setReferral, onOpenReferralForm }) => {
    const handleChange = (field, value) => {
        setReferral(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1 gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-1 h-8 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                    <div className="text-lg font-bold text-slate-900 normal-case">Referral/Requisition</div>
                    {referral.addedLater && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Added later</span>
                    )}
                </div>
                {referral?.type === 'lab' && (
                    <button
                        type="button"
                        onClick={onOpenLabRequisition}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Lab requisition form
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="text-xs font-semibold text-slate-500 normal-case tracking-wide mb-1.5 block">Type of referral</label>
                    <div className="flex items-stretch gap-2">
                        <button
                            type="button"
                            onClick={onOpenReferralForm}
                            disabled={!onOpenReferralForm || !String(referral?.type || '').trim()}
                            title={!String(referral?.type || '').trim() ? 'Select a referral type to generate the form' : 'Generate the referral form'}
                            className="inline-flex items-center justify-center px-3 rounded-xl text-[11px] font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            Generate form
                        </button>
                        <select
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                            value={referral.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            <option value="">Select type</option>
                            <option value="lab">Lab Requisition</option>
                            <option value="general_services_claim">General services claim form</option>
                            <option value="diagnostic">Diagnostic form</option>
                            <option value="cardio_health">Cardio health form</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 normal-case tracking-wide mb-1.5 block">Description</label>
                    <input
                        type="text"
                        className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium"
                        placeholder="Clinical indication / description..."
                        value={referral.reason}
                        onChange={(e) => handleChange('reason', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 normal-case tracking-wide mb-1.5 block">Referred to</label>
                    <input
                        type="text"
                        className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium"
                        placeholder="Specialist or clinic name..."
                        value={referral.to}
                        onChange={(e) => handleChange('to', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ReferralBlock;
