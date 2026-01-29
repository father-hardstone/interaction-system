import React from 'react';

const AdditionalNotesBlock = ({ additionalNotes, setAdditionalNotes, savedNotes, formatDate }) => {
    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-slate-400 shadow-sm"></div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">Session Logs</label>
                        <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">Additional Notes</div>
                    </div>
                </div>
            </div>

            {savedNotes && savedNotes.length > 0 && (
                <div className="space-y-3 mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Note History</div>
                    {savedNotes.map((note, idx) => (
                        <div key={idx} className="bg-yellow-50/50 border border-yellow-100 p-3 rounded-xl text-sm text-slate-700 shadow-sm">
                            <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDate ? formatDate(note.timestamp) : new Date(note.timestamp).toLocaleString()}
                            </div>
                            <p className="whitespace-pre-wrap font-medium leading-relaxed">{note.text}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative">
                <textarea
                    className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all min-h-[100px] resize-none font-medium placeholder:text-slate-300"
                    placeholder="Add private notes or observations (will be timestamped on save)..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                />
            </div>
        </div>
    );
};

export default AdditionalNotesBlock;
