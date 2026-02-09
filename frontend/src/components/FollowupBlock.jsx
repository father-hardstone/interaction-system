import React from 'react';

const FollowupBlock = ({ followup, setFollowup }) => {
    const handleCheckboxChange = (e) => {
        setFollowup(prev => ({ ...prev, required: e.target.checked }));
    };

    const handleDateChange = (e) => {
        setFollowup(prev => ({ ...prev, date: e.target.value }));
    };

    // Calculate tomorrow's date for min attribute
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-1 h-6 rounded-full shadow-sm ${followup.required ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                    <span className="text-base font-bold text-slate-900 normal-case">Followup</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer group/check shrink-0">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={followup.required}
                            onChange={handleCheckboxChange}
                        />
                        <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-slate-50 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                            <svg className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 group-hover/check:text-slate-900 transition-colors normal-case">Required?</span>
                </label>
                <div className={`flex items-center gap-2 min-w-0 transition-all duration-300 ${followup.required ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <input
                        type="date"
                        min={minDate}
                        className="flex-1 min-w-[140px] max-w-[180px] p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                        value={followup.date || ''}
                        onChange={handleDateChange}
                        disabled={!followup.required}
                    />
                </div>
            </div>
        </div>
    );
};

export default FollowupBlock;
