import { useEffect, useMemo, useState } from 'react';
import supabaseStorageService from '../../services/supabaseService';
import { instituteService } from '../../services/instituteService';
import { outgoingLogService } from '../../services/outgoingLogService';

const MODES = [
    { id: 'print', label: 'Print the prescription as a handout' },
    { id: 'email', label: 'Email the prescription' },
    { id: 'fax', label: 'Fax the prescription' }
];

function overlayCloseOnEsc(handler) {
    return (e) => {
        if (e.key === 'Escape') handler?.();
    };
}

function openPrintWindow(url) {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(
        `<html><head><title>Document</title></head><body style="margin:0;background:#ccc;"><img src="${url}" alt="Document" style="display:block;max-width:100%;height:auto;" /></body></html>`
    );
    w.document.close();
}

const OutgoingLogPreviewModal = ({ open, onClose, entityId, item }) => {
    const [mode, setMode] = useState('print');
    const [includePatient, setIncludePatient] = useState(true);
    const [includeInstitute, setIncludeInstitute] = useState(false);

    const [patientEmail, setPatientEmail] = useState('');
    const [patientFax, setPatientFax] = useState('');

    const [institutes, setInstitutes] = useState([]);
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [instituteEmail, setInstituteEmail] = useState('');
    const [instituteFax, setInstituteFax] = useState('');

    const [docUrl, setDocUrl] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setMode('print');
        setIncludePatient(true);
        setIncludeInstitute(false);
        setPatientEmail('');
        setPatientFax('');
        setInstitutes([]);
        setSelectedInstituteId('');
        setInstituteEmail('');
        setInstituteFax('');
        setDocUrl('');
        setError('');
        setIsSubmitting(false);
    }, [open, item?.id]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = overlayCloseOnEsc(() => {
            if (!isSubmitting) onClose?.();
        });
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose, isSubmitting]);

    useEffect(() => {
        if (!open) return;
        if (!entityId) return;
        instituteService
            .getByEntity(entityId)
            .then((list) => setInstitutes(list || []))
            .catch(() => setInstitutes([]));
    }, [open, entityId]);

    useEffect(() => {
        const inst = institutes.find((i) => i.id === selectedInstituteId);
        if (!inst) return;
        setInstituteEmail(inst.email || '');
        setInstituteFax(inst.fax || '');
    }, [selectedInstituteId, institutes]);

    useEffect(() => {
        if (!open) return;
        const path = item?.prescription?.supabasePath;
        if (!path) return;
        setIsLoadingUrl(true);
        supabaseStorageService
            .getFileUrl('CRM testing', path)
            .then((url) => setDocUrl(url || ''))
            .catch(() => setDocUrl(''))
            .finally(() => setIsLoadingUrl(false));
    }, [open, item?.prescription?.supabasePath]);

    const requireContactOk = useMemo(() => {
        if (mode === 'print') return true;
        if (!includePatient && !includeInstitute) return false;
        if (mode === 'email') {
            const hasPatient = includePatient ? !!(patientEmail || '').trim() : true;
            const hasInstitute = includeInstitute ? !!(instituteEmail || '').trim() : true;
            return hasPatient && hasInstitute;
        }
        if (mode === 'fax') {
            const hasPatient = includePatient ? !!(patientFax || '').trim() : true;
            const hasInstitute = includeInstitute ? !!(instituteFax || '').trim() : true;
            return hasPatient && hasInstitute;
        }
        return false;
    }, [mode, includePatient, includeInstitute, patientEmail, patientFax, instituteEmail, instituteFax]);

    const handleConfirm = async () => {
        if (isSubmitting) return;
        setError('');
        if (!requireContactOk) {
            setError('Please select recipients and fill required contact details.');
            return;
        }
        try {
            setIsSubmitting(true);
            if (mode === 'print' && docUrl) {
                openPrintWindow(docUrl);
            }
            const inst = institutes.find((i) => i.id === selectedInstituteId) || null;

            await outgoingLogService.create({
                interactionId: item?.interactionId || '',
                patientId: item?.patientId || '',
                patientNameSnapshot: item?.patientNameSnapshot || '',
                documentType: item?.documentType || 'prescription',
                mode,
                recipients: {
                    patient: includePatient
                        ? {
                              email: mode === 'email' ? patientEmail : '',
                              fax: mode === 'fax' ? patientFax : ''
                          }
                        : { email: '', fax: '' },
                    institute: includeInstitute
                        ? {
                              instituteId: selectedInstituteId || '',
                              nameSnapshot: inst?.name || '',
                              email: mode === 'email' ? instituteEmail : '',
                              fax: mode === 'fax' ? instituteFax : ''
                          }
                        : { instituteId: '', nameSnapshot: '', email: '', fax: '' }
                },
                prescription: {
                    supabasePath: item?.prescription?.supabasePath || ''
                },
                notes: ''
            });

            onClose?.(true);
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Failed to log outgoing action');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose?.();
            }}
        >
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Outgoing log #{item?.serial || '—'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Preview and send again (print/email/fax).
                        </p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[560px]">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-700">Preview</div>
                            <div className="text-xs font-semibold text-slate-500">{item?.documentType || '—'}</div>
                        </div>
                        <div className="p-4 min-h-[460px] flex items-center justify-center">
                            {isLoadingUrl ? (
                                <div className="py-16 text-center text-sm font-semibold text-slate-500">Loading…</div>
                            ) : docUrl ? (
                                <img src={docUrl} alt="Preview" className="max-h-[440px] w-full object-contain rounded-xl border border-slate-200 bg-white" />
                            ) : (
                                <div className="py-16 text-center text-sm font-semibold text-slate-500">
                                    No preview available.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col min-h-0">
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {MODES.map((m) => {
                                const active = mode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setMode(m.id)}
                                        className={[
                                            'text-left p-4 rounded-2xl border transition-all',
                                            active
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-slate-200 hover:bg-slate-50'
                                        ].join(' ')}
                                    >
                                        <div className="text-sm font-semibold text-slate-900">{m.label}</div>
                                    </button>
                                );
                            })}
                        </div>

                        {mode !== 'print' && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                                <div className="flex flex-wrap gap-3">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={includePatient}
                                            onChange={(e) => setIncludePatient(e.target.checked)}
                                            className="accent-primary"
                                        />
                                        Patient
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={includeInstitute}
                                            onChange={(e) => setIncludeInstitute(e.target.checked)}
                                            className="accent-primary"
                                        />
                                        Institute
                                    </label>
                                </div>

                                {includePatient && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-semibold text-slate-500">Patient</span>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {item?.patientNameSnapshot || '—'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-semibold text-slate-500">
                                                {mode === 'email' ? 'Patient email' : 'Patient fax'}
                                            </label>
                                            <input
                                                type="text"
                                                value={mode === 'email' ? patientEmail : patientFax}
                                                onChange={(e) => (mode === 'email' ? setPatientEmail(e.target.value) : setPatientFax(e.target.value))}
                                                placeholder={mode === 'email' ? 'name@example.com' : 'Fax number'}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>
                                )}

                                {includeInstitute && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-semibold text-slate-500">Institute</label>
                                            <select
                                                value={selectedInstituteId}
                                                onChange={(e) => setSelectedInstituteId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                            >
                                                <option value="">Select institute…</option>
                                                {institutes.map((i) => (
                                                    <option key={i.id} value={i.id}>
                                                        {i.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-semibold text-slate-500">
                                                {mode === 'email' ? 'Institute email' : 'Institute fax'}
                                            </label>
                                            <input
                                                type="text"
                                                value={mode === 'email' ? instituteEmail : instituteFax}
                                                onChange={(e) => (mode === 'email' ? setInstituteEmail(e.target.value) : setInstituteFax(e.target.value))}
                                                placeholder={mode === 'email' ? 'contact@example.com' : 'Fax number'}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>
                                )}

                                {!requireContactOk && (
                                    <div className="text-xs font-semibold text-red-600">
                                        Select at least one recipient and fill the required contact details.
                                    </div>
                                )}
                            </div>
                        )}
                        </div>

                        <div className="sticky bottom-0 pt-4 mt-4 border-t border-slate-200 bg-white">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isSubmitting || !requireContactOk}
                                className="w-full px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                {isSubmitting ? 'Saving…' : 'Send again'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutgoingLogPreviewModal;

