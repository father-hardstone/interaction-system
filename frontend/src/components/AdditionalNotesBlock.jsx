import React from 'react';

const AdditionalNotesBlock = ({ additionalNotes, setAdditionalNotes, savedNotes, formatDate }) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-1 h-6 rounded-full bg-slate-400 shadow-sm"></div>
                    <span className="text-base font-bold text-slate-900 normal-case">Additional Notes</span>
                </div>
                <input
                    type="text"
                    className="flex-1 min-w-[200px] p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-medium placeholder:text-slate-300"
                    placeholder="Add private notes (timestamped on save)..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                />
            </div>

            {savedNotes && savedNotes.length > 0 && (
                <div className="mt-3 space-y-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-xs font-semibold text-slate-400 normal-case tracking-wider px-1">Note History</div>
                    {savedNotes.map((note, idx) => (
                        <div key={idx} className="bg-yellow-50/50 border border-yellow-100 px-2.5 py-2 rounded-lg text-xs text-slate-700">
                            <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDate ? formatDate(note.timestamp) : new Date(note.timestamp).toLocaleString()}
                            </div>
                            <p className="whitespace-pre-wrap font-medium leading-relaxed">{note.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdditionalNotesBlock;
