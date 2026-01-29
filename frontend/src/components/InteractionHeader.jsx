import React from 'react';

const InteractionHeader = ({ interaction, getVisitorName, getVisitorSerial, setShowCancelModal, handleSaveInteraction, handleSaveDraft, isSaving, onInteractionClick, lastVisit }) => {
    return (
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10 w-full">
            <div className="flex items-center gap-4">
                <div
                    className="bg-blue-50 p-2 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => onInteractionClick(interaction)}
                    title="View Session Details"
                >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter">
                            {getVisitorName(interaction.visitorId) || '-'}
                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-widest">
                                {getVisitorSerial(interaction.visitorId) || '-'}
                            </span>
                        </h2>
                        {lastVisit && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Previous Visit:</span>
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{lastVisit}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-black">
                        <button
                            onClick={() => onInteractionClick(interaction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            {interaction.interactionSerial || 'REG--'}
                        </button>
                        <span>•</span>
                        <span className="text-emerald-500 flex items-center gap-1.5">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            Active Session
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                    Cancel / Hold
                </button>
                <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors disabled:opacity-50"
                >
                    Save Draft
                </button>
                <button
                    type="button"
                    onClick={handleSaveInteraction}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Complete & Sign
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default InteractionHeader;
