import React from 'react';

const AdditionalNotesBlock = ({ additionalNotes, setAdditionalNotes, savedNotes, formatDate, isEditingCompleted = false, editCount = 0 }) => {
    const formatTs = (ts) => (formatDate ? formatDate(ts, true) : (ts ? new Date(ts).toLocaleString() : ''));
    const renderNoteContent = (note) => {
        const text = note.text || '';
        const editMatch = text.match(/^Edit \((\d+)\)\n?/);
        if (editMatch) {
            const heading = `Edit (${editMatch[1]})`;
            const body = text.slice(editMatch[0].length).trim();
            return { heading, body };
        }
        return { heading: null, body: text };
    };

    return (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex items-center gap-2 shrink-0 mb-3">
                <div className="w-1 h-6 rounded-full bg-slate-400 shadow-sm"></div>
                <span className="text-base font-bold text-slate-900 normal-case">Additional Notes</span>
                {isEditingCompleted && editCount > 0 && (
                    <span className="text-xs font-semibold text-slate-500 normal-case">(Edits: {editCount})</span>
                )}
            </div>

            {savedNotes && savedNotes.length > 0 && (
                <div className="mb-4 space-y-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                    {isEditingCompleted ? (
                        savedNotes.map((note, idx) => {
                            const { heading, body } = renderNoteContent(note);
                            return (
                                <div key={idx} className="bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-sm">
                                    <div className="text-[10px] text-slate-500 font-semibold mb-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatTs(note.timestamp)}
                                    </div>
                                    {heading && <div className="text-xs font-bold text-blue-600 mb-1 normal-case">{heading}</div>}
                                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{body || '—'}</p>
                                </div>
                            );
                        })
                    ) : (
                        <>
                            <div className="text-xs font-semibold text-slate-400 normal-case tracking-wider px-1">Note History</div>
                            {savedNotes.map((note, idx) => (
                                <div key={idx} className="bg-yellow-50/50 border border-yellow-100 px-2.5 py-2 rounded-lg text-xs text-slate-700">
                                    <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatTs(note.timestamp)}
                                    </div>
                                    <p className="whitespace-pre-wrap font-medium leading-relaxed">{note.text}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <input
                    type="text"
                    className="flex-1 min-w-[200px] p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all font-medium placeholder:text-slate-300"
                    placeholder={isEditingCompleted ? 'Add additional notes (will be saved as Edit (n))...' : 'Add private notes (timestamped on save)...'}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                />
            </div>
        </div>
    );
};

export default AdditionalNotesBlock;
