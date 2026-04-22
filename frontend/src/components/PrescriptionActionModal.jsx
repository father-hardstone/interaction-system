import { useEffect, useMemo, useState } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { instituteService } from '../services/instituteService';
import { outgoingLogService } from '../services/outgoingLogService';
import supabaseStorageService from '../services/supabaseService';
import { generatePrescriptionImage } from '../utils/prescriptionImage';

function overlayCloseOnEsc(handler) {
    return (e) => {
        if (e.key === 'Escape') handler?.();
    };
}

const MODES = [
    { id: 'print', label: 'Print the prescription as a handout' },
    { id: 'email', label: 'Email the prescription' },
    { id: 'fax', label: 'Fax the prescription' }
];

const PrescriptionActionModal = ({
    open,
    onClose,
    visitor,
    interactionId = '',
    doctorName = '',
    patientName = '',
    medications = []
}) => {
    const entityId = visitor?.entityId || '';

    const [mode, setMode] = useState('print');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [includePatient, setIncludePatient] = useState(true);
    const [includeInstitute, setIncludeInstitute] = useState(false);

    const [patientEmail, setPatientEmail] = useState('');
    const [patientFax, setPatientFax] = useState('');

    const [institutes, setInstitutes] = useState([]);
    const [selectedInstituteId, setSelectedInstituteId] = useState('');
    const [instituteEmail, setInstituteEmail] = useState('');
    const [instituteFax, setInstituteFax] = useState('');

    const [previewUrl, setPreviewUrl] = useState('');
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [isPrinted, setIsPrinted] = useState(false);

    useEffect(() => {
        if (!open) return;
        setMode('print');
        setIsSubmitting(false);
        setError('');
        setIsPrinted(false);
        setIncludePatient(true);
        setIncludeInstitute(false);
        setPatientEmail(visitor?.email || '');
        setPatientFax('');
        setInstitutes([]);
        setSelectedInstituteId('');
        setInstituteEmail('');
        setInstituteFax('');
        setPreviewUrl('');
        setIsGeneratingPreview(false);
    }, [open, visitor?.email]);

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

    const ensurePreview = async () => {
        if (previewUrl) return previewUrl;
        setIsGeneratingPreview(true);
        try {
            const dataUrl = await generatePrescriptionImage({
                doctorName,
                patientName: patientName || (visitor ? [visitor.firstName, visitor.lastName].filter(Boolean).join(' ') : ''),
                medications,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
            });
            setPreviewUrl(dataUrl);
            return dataUrl;
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleConfirm = async () => {
        if (isSubmitting) return;
        if (mode === 'print' && isPrinted) return;
        setError('');

        if (!requireContactOk) {
            setError('Please select recipients and fill required contact details.');
            return;
        }

        try {
            setIsSubmitting(true);
            const dataUrl = await ensurePreview();

            const inst = institutes.find((i) => i.id === selectedInstituteId) || null;

            const doctorId = visitor?.officerId || visitor?.doctorId || '';
            const outgoingLogIdForFile = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
            const prescriptionSupabasePath = await supabaseStorageService.uploadPrescription(
                dataUrl,
                entityId,
                visitor?.id || 'unknown-patient',
                interactionId || '',
                doctorId,
                outgoingLogIdForFile
            );

            await outgoingLogService.create({
                interactionId: interactionId || '',
                patientId: visitor?.id || '',
                patientNameSnapshot: patientName || (visitor ? [visitor.firstName, visitor.lastName].filter(Boolean).join(' ') : ''),
                documentType: 'prescription',
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
                    supabasePath: prescriptionSupabasePath
                },
                notes: ''
            });

            if (mode === 'print') {
                setIsPrinted(true);
            } else {
                onClose?.();
            }
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Failed to log outgoing action');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !isSubmitting) onClose?.();
            }}
        >
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">Prescription</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            What do you want to do with this prescription?
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !isSubmitting && onClose?.()}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
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
                                            {patientName || '—'}
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

                    <div className="flex items-center justify-between gap-3">
                        <div />

                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSubmitting || !requireContactOk || (mode === 'print' && isPrinted)}
                            className={[
                                'px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2',
                                mode === 'print' && isPrinted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                    : 'bg-primary text-white hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400'
                            ].join(' ')}
                        >
                            {mode === 'print' && isPrinted ? (
                                <>
                                    <CheckOutlined />
                                    Printed
                                </>
                            ) : (
                                <>{isSubmitting ? 'Saving…' : 'Confirm'}</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionActionModal;

