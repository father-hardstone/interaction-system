import { stripEntityPrefix } from '../utils/formatUtils';

const REASON_FOR_VISIT_OPTIONS = [
    { value: 'new_visit', label: 'New visit' },
    { value: 'followup', label: 'Followup' },
    { value: 'refill_medicine', label: 'Refill medicine' }
];

const VISIT_MODE_OPTIONS = [
    { value: 'physical', label: 'Physical' },
    { value: 'on_phone', label: 'Phone consult' }
];

const RegisterConfirmationModal = ({
    open,
    pendingRegisterVisitor,
    reasonForVisit,
    setReasonForVisit,
    visitMode,
    setVisitMode,
    parentInteractionId,
    setParentInteractionId,
    newVisitNotes,
    setNewVisitNotes,
    priorVisitsForPatient = [],
    formatDate,
    isCreatingInteraction = false,
    onClose,
    onConfirm
}) => {
    if (!open) return null;

    const patientName = pendingRegisterVisitor
        ? `${pendingRegisterVisitor.firstName || ''} ${pendingRegisterVisitor.lastName || ''}`.trim()
        : 'this patient';

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4 pb-4 pt-0 !mt-0">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => !isCreatingInteraction && onClose?.()}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">Confirm Registration</h3>
                    <p className="text-slate-600 text-sm mb-4 text-center">
                        Register an interaction for {patientName}?
                    </p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Visit mode</label>
                            <div className="flex gap-4">
                                {VISIT_MODE_OPTIONS.map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="visitMode"
                                            value={opt.value}
                                            checked={(visitMode || 'physical') === opt.value}
                                            onChange={() => setVisitMode?.(opt.value)}
                                            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for visit</label>
                            <select
                                value={reasonForVisit}
                                onChange={(e) => {
                                    setReasonForVisit?.(e.target.value);
                                    setParentInteractionId?.('');
                                }}
                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            >
                                {REASON_FOR_VISIT_OPTIONS.map((opt) => (
                                    <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {reasonForVisit === 'new_visit' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes (optional)</label>
                                <input
                                    type="text"
                                    value={newVisitNotes}
                                    onChange={(e) => setNewVisitNotes?.(e.target.value)}
                                    placeholder="e.g. reason for visit, chief complaint"
                                    className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        )}

                        {(reasonForVisit === 'followup' || reasonForVisit === 'refill_medicine') && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    {reasonForVisit === 'followup' ? 'Prior visit (followup to)' : 'Prior visit (refill from)'}
                                    <span className="text-slate-400 font-normal ml-0.5">(optional)</span>
                                </label>
                                <select
                                    value={parentInteractionId}
                                    onChange={(e) => setParentInteractionId?.(e.target.value)}
                                    className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="">— Select prior visit —</option>
                                    {priorVisitsForPatient.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {stripEntityPrefix(i.interactionSerial) || 'REG'} — {formatDate?.(i.editedAt || i.createdAt, true)}
                                        </option>
                                    ))}
                                </select>
                                {priorVisitsForPatient.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No completed visits found for this patient.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => !isCreatingInteraction && onClose?.()}
                            disabled={isCreatingInteraction}
                            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            No, cancel
                        </button>
                        <button
                            onClick={() => onConfirm?.()}
                            disabled={isCreatingInteraction}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-200/50 disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            {isCreatingInteraction ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registering...
                                </>
                            ) : (
                                'Yes, register'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterConfirmationModal;

