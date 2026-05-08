import React, { useState, useEffect } from 'react';
import DrawingPad from './DrawingPad';

const padHasContent = (pv) => {
    if (!pv) return false;
    if (typeof pv === 'string' && pv.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(pv);
            return Array.isArray(arr) && arr.some(s => s && (s.startsWith('data:image') || (typeof s === 'string' && s.includes('/interactions/'))));
        } catch {
            return !!pv;
        }
    }
    return !!(pv && (pv.startsWith('data:image') || pv.includes('/interactions/')));
};

const SoapBlock = ({ label, value, onChange, padValue, onPadChange, required = false, placeholder, enableSheets = false, readOnly = false, padReadOnly, existingSheetCount = 0, addedLaterSheetIndices, padHeight = "400px" }) => {
    const padIsReadOnly = padReadOnly !== undefined ? padReadOnly : readOnly;
    const [mode, setMode] = useState('handwriting');

    // When text is read-only, default to the view that has content so fields populate like create view
    useEffect(() => {
        if (!readOnly) return;
        if (padHasContent(padValue)) setMode('handwriting');
        else if (value && String(value).trim()) setMode('text');
    }, [readOnly, padValue, value]);

    return (
        <div className="space-y-3 bg-white rounded-2xl shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full shadow-sm ${required ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                    <div className="text-lg font-bold text-slate-900 normal-case">{label}</div>
                    {required && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-full border border-blue-100 normal-case tracking-widest ml-1">Required</span>
                    )}
                </div>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setMode('text')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === 'text' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        TEXT
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('handwriting')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${mode === 'handwriting' ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        DRAW
                    </button>
                </div>
            </div>

            <div className="relative">
                {mode === 'text' ? (
                    readOnly ? (
                        <textarea
                            readOnly
                            className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-slate-50 min-h-[180px] resize-none font-medium leading-relaxed text-slate-700 cursor-default"
                            placeholder={placeholder}
                            value={value}
                            onChange={() => {}}
                        />
                    ) : (
                        <textarea
                            className="w-full p-4 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all min-h-[180px] resize-none placeholder:text-slate-300 font-medium leading-relaxed"
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    )
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <DrawingPad
                            label="Handwriting"
                            value={padValue}
                            onChange={onPadChange}
                            minHeight={padHeight}
                            enableSheets={enableSheets}
                            readOnly={padIsReadOnly}
                            existingSheetCount={existingSheetCount}
                            addedLaterSheetIndices={addedLaterSheetIndices}
                        />
                    </div>
                )}
            </div>

            {((mode === 'handwriting' && value) || (mode === 'text' && padValue)) && (
                <div className="flex items-center gap-1.5 py-1 px-2 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                    <div className="flex -space-x-1">
                        <div className={`w-2 h-2 rounded-full border border-white ${value ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                        <div className={`w-2 h-2 rounded-full border border-white ${padValue ? 'bg-emerald-400' : 'bg-transparent'}`}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 normal-case tracking-tighter">Mixed inputs recorded</span>
                </div>
            )}
        </div>
    );
};

export default SoapBlock;
