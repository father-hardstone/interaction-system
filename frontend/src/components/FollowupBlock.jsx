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
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full shadow-sm ${followup.required ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">Continuity of Care</label>
                        <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">Follow-up</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer group/check">
                    <div className="relative">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={followup.required}
                            onChange={handleCheckboxChange}
                        />
                        <div className="w-6 h-6 border-2 border-slate-200 rounded-lg bg-slate-50 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                            <svg className="w-4 h-4 text-white scale-0 peer-checked:scale-100 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-sm font-black text-slate-600 group-hover/check:text-slate-900 transition-colors uppercase tracking-wider">Required?</span>
                </label>

                <div className={`flex-1 transition-all duration-300 ${followup.required ? 'opacity-100 translate-x-0' : 'opacity-30 pointer-events-none -translate-x-2'}`}>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Follow-up Date</label>
                        <input
                            type="date"
                            min={minDate}
                            className="w-full sm:w-64 p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-bold text-slate-700"
                            value={followup.date || ''}
                            onChange={handleDateChange}
                            disabled={!followup.required}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FollowupBlock;
