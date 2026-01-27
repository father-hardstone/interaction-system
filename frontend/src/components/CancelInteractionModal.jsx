import React from 'react';

const CancelInteractionModal = ({ showCancelModal, setShowCancelModal, moveToIncomplete, confirmCancel }) => {
    if (!showCancelModal) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Interaction?</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        What would you like to do with this interaction? You can either cancel it entirely or save it to your incomplete list to resume later.
                    </p>

                    <div className="grid grid-cols-1 gap-3">
                        <button
                            onClick={moveToIncomplete}
                            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Move to Incomplete
                        </button>
                        <button
                            onClick={confirmCancel}
                            className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Cancel & Return to Queue
                        </button>
                        <button
                            onClick={() => setShowCancelModal(false)}
                            className="w-full py-2 px-4 text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
                        >
                            Go back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CancelInteractionModal;
