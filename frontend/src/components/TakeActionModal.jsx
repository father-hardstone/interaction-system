import React, { useState, useEffect } from 'react';

const ACTION_OPTIONS = [
    { value: '', label: 'Select an action…' },
    { value: 'phone_consult', label: 'Book a phone consult' },
    { value: 'followup', label: 'Book a followup' },
    { value: 'no_action', label: 'Take no action' }
];

const TakeActionModal = ({ show, onClose, report, visitors = [], onProceed }) => {
    const [selectedAction, setSelectedAction] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            setSelectedAction('');
            setIsSubmitting(false);
        }
    }, [show]);

    if (!show) return null;

    const visitor = report?.patientId ? visitors.find((v) => v.id === report.patientId) : null;
    const canProceed = selectedAction !== '' && !isSubmitting;

    const handleProceed = async () => {
        if (!canProceed) return;
        if (selectedAction === 'no_action') {
            onClose();
            return;
        }
        if (typeof onProceed !== 'function') return;
        setIsSubmitting(true);
        try {
            const result = await Promise.resolve(onProceed(selectedAction, visitor));
            if (result === true) onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[2600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Take action</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {visitor ? `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim() || 'Patient' : 'Report'} — choose an action
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">Action</label>
                    <select
                        value={selectedAction}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        {ACTION_OPTIONS.map((opt) => (
                            <option key={opt.value || 'empty'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleProceed}
                        disabled={!canProceed}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Processing…</span>
                            </>
                        ) : (
                            'Proceed'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TakeActionModal;
