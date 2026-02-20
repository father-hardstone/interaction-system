import React from 'react';

const WEEK_OPTIONS = [1, 2, 3, 5, 6];
const MONTH_OPTIONS = [1, 2, 3, 6];

const FollowupBlock = ({ followup, setFollowup }) => {
    const handleCheckboxChange = (e) => {
        setFollowup(prev => ({ ...prev, required: e.target.checked }));
    };

    const handleDateChange = (e) => {
        setFollowup(prev => ({ ...prev, date: e.target.value }));
    };

    const handleIntervalWeeks = (value) => {
        setFollowup(prev => ({ ...prev, intervalWeeks: value, intervalMonths: null }));
    };

    const handleIntervalMonths = (value) => {
        setFollowup(prev => ({ ...prev, intervalMonths: value, intervalWeeks: null }));
    };

    // Calculate tomorrow's date for min attribute
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    const enabled = followup.required;

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className={`w-1 h-6 rounded-full shadow-sm ${followup.required ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                    <span className="text-base font-bold text-slate-900 normal-case">Followup</span>
                    {followup.addedLater && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Added later</span>
                    )}
                </div>
                <label className="relative flex items-center gap-2 cursor-pointer shrink-0 w-5 h-5">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={followup.required}
                        onChange={handleCheckboxChange}
                    />
                    <div className="absolute inset-0 w-5 h-5 border-2 border-slate-200 rounded-md bg-slate-50 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
                    <svg className="absolute left-0 w-5 h-5 p-0.5 text-white pointer-events-none scale-0 peer-checked:scale-100 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </label>
                <div className={`flex items-center gap-2 min-w-0 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <input
                        type="date"
                        min={minDate}
                        className="flex-1 min-w-[140px] max-w-[180px] p-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-500 transition-all font-semibold text-slate-700"
                        value={followup.date || ''}
                        onChange={handleDateChange}
                        disabled={!enabled}
                    />
                </div>
            </div>

            <div className={`space-y-4 pl-7 ${enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <div>
                    <div className="text-xs font-semibold text-slate-500 normal-case tracking-wide mb-2">Weeks</div>
                    <div className="flex flex-wrap gap-2">
                        {WEEK_OPTIONS.map((n) => (
                            <label key={n} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="followup-interval"
                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                    checked={followup.intervalWeeks === n}
                                    onChange={() => handleIntervalWeeks(n)}
                                    disabled={!enabled}
                                />
                                <span className="text-sm font-medium text-slate-700">{n} {n === 1 ? 'week' : 'weeks'}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="text-xs font-semibold text-slate-500 normal-case tracking-wide mb-2">Months</div>
                    <div className="flex flex-wrap gap-2">
                        {MONTH_OPTIONS.map((n) => (
                            <label key={n} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    name="followup-interval"
                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                    checked={followup.intervalMonths === n}
                                    onChange={() => handleIntervalMonths(n)}
                                    disabled={!enabled}
                                />
                                <span className="text-sm font-medium text-slate-700">{n} {n === 1 ? 'month' : 'months'}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FollowupBlock;
