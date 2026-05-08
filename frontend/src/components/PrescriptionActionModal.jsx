import { useEffect, useMemo, useState } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { instituteService } from '../services/instituteService';
import { outgoingLogService } from '../services/outgoingLogService';
import supabaseStorageService from '../services/supabaseService';
import { generatePrescriptionImage } from '../utils/prescriptionImage';
import { formatHealthCardDisplay, formatDateMMDDYYYY } from '../utils/formatUtils';

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
    doctorBillingNumber = '',
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
        if (!open) {
            setPreviewUrl('');
            return;
        }
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
        setIsGeneratingPreview(false);
        setPreviewUrl(''); // Reset preview to force regeneration
        ensurePreview();
    }, [open, visitor?.email, doctorName, doctorBillingNumber, patientName, medications]);

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
        setIsGeneratingPreview(true);
        try {
            const dataUrl = await generatePrescriptionImage({
                doctorName,
                doctorBillingNumber,
                patientName: patientName || (visitor ? [visitor.firstName, visitor.lastName].filter(Boolean).join(' ') : ''),
                patientDob: formatDateMMDDYYYY(visitor?.dob || visitor?.dateOfBirth || ''),
                patientHealthCard: formatHealthCardDisplay(visitor?.healthCardNumber || ''),
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
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Issue Prescription</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Review and send this prescription.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => !isSubmitting && onClose?.()}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-300"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 bg-white">
                    {/* Left: Preview */}
                    <div className="flex flex-col min-h-0 bg-slate-100/50 rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner">
                        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-sm">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Preview</div>
                            {isGeneratingPreview && (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase">Updating…</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-white/30 relative custom-scrollbar">
                            {previewUrl ? (
                                <img 
                                    src={previewUrl} 
                                    alt="Prescription Preview" 
                                    className="max-w-full h-auto shadow-2xl rounded-sm border border-slate-200 transition-transform duration-500 hover:scale-[1.02]" 
                                />
                            ) : isGeneratingPreview ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                                    <span className="text-sm font-semibold text-slate-400">Generating preview…</span>
                                </div>
                            ) : (
                                <div className="text-sm font-bold text-slate-300 italic">No medications to preview</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto pr-3 space-y-8 custom-scrollbar">
                            {error && (
                                <div className="bg-red-50 border-2 border-red-100 text-red-700 px-5 py-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Select delivery method</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {MODES.map((m) => {
                                        const active = mode === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setMode(m.id)}
                                                className={[
                                                    'text-left px-6 py-4 rounded-2xl border-2 transition-all flex items-center justify-between group relative overflow-hidden',
                                                    active
                                                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                ].join(' ')}
                                            >
                                                <div className="flex flex-col relative z-10">
                                                    <div className={`text-sm font-bold ${active ? 'text-blue-700' : 'text-slate-900'}`}>{m.label}</div>
                                                </div>
                                                <div className="relative z-10">
                                                    {active ? (
                                                        <div className="bg-blue-600 rounded-full p-1">
                                                            <CheckOutlined className="text-white text-[10px]" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300"></div>
                                                    )}
                                                </div>
                                                {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {mode !== 'print' && (
                                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Configure recipients</label>
                                    <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 space-y-6">
                                        <div className="flex flex-wrap gap-6">
                                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${includePatient ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                                                    {includePatient && <CheckOutlined className="text-white text-[10px]" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={includePatient}
                                                    onChange={(e) => setIncludePatient(e.target.checked)}
                                                    className="hidden"
                                                />
                                                Patient
                                            </label>
                                            <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${includeInstitute ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                                                    {includeInstitute && <CheckOutlined className="text-white text-[10px]" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={includeInstitute}
                                                    onChange={(e) => setIncludeInstitute(e.target.checked)}
                                                    className="hidden"
                                                />
                                                Pharmacy / Institute
                                            </label>
                                        </div>

                                        {includePatient && (
                                            <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tight flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                                    Patient Details
                                                </div>
                                                <div className="flex flex-col gap-4">
                                                    <div className="text-sm font-bold text-slate-900 px-1">{patientName || '—'}</div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-bold text-slate-400 px-1">
                                                            {mode === 'email' ? 'EMAIL ADDRESS' : 'FAX NUMBER'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={mode === 'email' ? patientEmail : patientFax}
                                                            onChange={(e) => (mode === 'email' ? setPatientEmail(e.target.value) : setPatientFax(e.target.value))}
                                                            placeholder={mode === 'email' ? 'name@example.com' : 'Fax number'}
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {includeInstitute && (
                                            <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                                <div className="text-[10px] font-bold text-purple-600 uppercase tracking-tight flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                                                    Pharmacy Details
                                                </div>
                                                <div className="flex flex-col gap-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-bold text-slate-400 px-1">SELECT PHARMACY</label>
                                                        <select
                                                            value={selectedInstituteId}
                                                            onChange={(e) => setSelectedInstituteId(e.target.value)}
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                                                        >
                                                            <option value="">Select pharmacy…</option>
                                                            {institutes.map((i) => (
                                                                <option key={i.id} value={i.id}>
                                                                    {i.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <label className="text-xs font-bold text-slate-400 px-1">
                                                            {mode === 'email' ? 'PHARMACY EMAIL' : 'PHARMACY FAX'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={mode === 'email' ? instituteEmail : instituteFax}
                                                            onChange={(e) => (mode === 'email' ? setInstituteEmail(e.target.value) : setInstituteFax(e.target.value))}
                                                            placeholder={mode === 'email' ? 'contact@example.com' : 'Fax number'}
                                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-semibold text-slate-700"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 pt-6 mt-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
                            <button
                                type="button"
                                onClick={() => onClose?.()}
                                disabled={isSubmitting}
                                className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isSubmitting || !requireContactOk || (mode === 'print' && isPrinted) || isGeneratingPreview}
                                className={[
                                    'px-12 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg',
                                    mode === 'print' && isPrinted
                                        ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-100 cursor-default shadow-none'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none shadow-blue-200'
                                ].join(' ')}
                            >
                                {mode === 'print' && isPrinted ? (
                                    <>
                                        <CheckOutlined />
                                        Printed Successfully
                                    </>
                                ) : (
                                    <>
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                Sending…
                                            </>
                                        ) : (
                                            <>Send Prescription</>
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default PrescriptionActionModal;

