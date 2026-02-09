import React from 'react';

const ReferralBlock = ({ referral, setReferral }) => {
    const handleChange = (field, value) => {
        setReferral(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                    <div className="text-lg font-bold text-slate-900 normal-case">Referral/Requisition</div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em] mb-1.5 block px-1">Type</label>
                        <select
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                            value={referral.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            <option value="">Select Type</option>
                            <option value="specialist">Specialist Referral</option>
                            <option value="lab">Lab Requisition</option>
                            <option value="imaging">Imaging Requisition</option>
                            <option value="physio">Physiotherapy</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em] mb-1.5 block px-1">Reason for Referral</label>
                        <input
                            type="text"
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium"
                            placeholder="Enter reason..."
                            value={referral.reason}
                            onChange={(e) => handleChange('reason', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em] mb-1.5 block px-1">Results Date</label>
                        <input
                            type="date"
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                            value={referral.date}
                            onChange={(e) => handleChange('date', e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em] mb-1.5 block px-1">To Whom</label>
                    <input
                        type="text"
                        className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-medium"
                        placeholder="Specialist or Clinic Name..."
                        value={referral.to}
                        onChange={(e) => handleChange('to', e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default ReferralBlock;
