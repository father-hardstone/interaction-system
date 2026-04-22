import React from 'react';

/**
 * Preview sheet after “Process for Ministry”, plus confirm-before-file modal.
 */
export default function BillingStatementModals({
    processImageUrl,
    processStatementDate,
    onCloseSheet,
    onOpenMinistryConfirm,
    showMinistryConfirm,
    onDismissConfirm,
    onConfirmMinistry,
    isMinistryProcessing,
    sheetBlocked,
}) {
    return (
        <>
            {processImageUrl && (
                <div
                    className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 px-2 sm:px-4"
                    onClick={() => !sheetBlocked && onCloseSheet?.()}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900">Processed Billing Sheet</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!sheetBlocked) onCloseSheet?.();
                                }}
                                disabled={sheetBlocked}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-100 flex items-start justify-center p-2 sm:p-4">
                            <img
                                src={processImageUrl}
                                alt="Billing Statement"
                                className="w-full h-auto max-w-[1200px] md:max-w-[1400px] shadow bg-white"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50">
                            <button
                                type="button"
                                disabled={sheetBlocked}
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = processImageUrl;
                                    const safeDate = (processStatementDate || '').replace(/[^0-9-]/g, '');
                                    link.download = safeDate ? `billing-statement-${safeDate}.png` : 'billing-statement.png';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Download
                            </button>
                            <button
                                type="button"
                                disabled={sheetBlocked}
                                onClick={() => onOpenMinistryConfirm?.()}
                                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send to Ministry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMinistryConfirm && (
                <div
                    className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 px-4"
                    onClick={() => !isMinistryProcessing && onDismissConfirm?.()}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Process for ministry</h3>
                        <p className="text-sm text-slate-600">
                            Are you sure you want to process this claim for ministry? Confirmed claims will move to{' '}
                            <span className="font-semibold">Filed Claims</span>.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={isMinistryProcessing}
                                onClick={() => onDismissConfirm?.()}
                                className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isMinistryProcessing}
                                onClick={() => onConfirmMinistry?.()}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 min-w-[8.5rem]"
                            >
                                {isMinistryProcessing ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Processing…
                                    </>
                                ) : (
                                    'Yes, process'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
