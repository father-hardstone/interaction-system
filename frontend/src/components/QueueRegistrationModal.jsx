import { useState } from 'react';
import { getRegistrationDisplayId } from '../utils/formatUtils';

const QueueRegistrationModal = ({
    isOpen,
    onClose,
    interaction,
    officers = [],
    getVisitorName,
    onAssign,
}) => {
    const [selectedOfficerId, setSelectedOfficerId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeOfficers = officers.filter(o => o.active !== 'false' && (!o.deletedAt || o.deletedAt === ''));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!interaction || !selectedOfficerId || !onAssign) return;
        const officer = activeOfficers.find(o => o.id === selectedOfficerId);
        if (!officer) return;
        setIsSubmitting(true);
        try {
            const success = await Promise.resolve(onAssign(interaction, officer));
            if (success) {
                setSelectedOfficerId('');
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedOfficerId('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Queue registration</h2>
                            <p className="text-sm text-slate-500 mt-1">Assign this registration to a doctor</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {interaction && (
                        <>
                            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-4">
                                <div className="text-xs font-semibold text-slate-400 normal-case tracking-wide">Registration</div>
                                <div className="mt-1 flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center justify-center min-w-[2rem] text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        {getRegistrationDisplayId(interaction)}
                                    </span>
                                    <span className="font-semibold text-slate-900">{getVisitorName(interaction.visitorId)}</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Select doctor</label>
                                <select
                                    value={selectedOfficerId}
                                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                                    className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                    required
                                >
                                    <option value="">Choose a doctor</option>
                                    {activeOfficers.map((o) => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                                {activeOfficers.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No active doctors available</p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedOfficerId || isSubmitting}
                                        className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isSubmitting ? 'Queuing…' : 'Queue'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueRegistrationModal;
