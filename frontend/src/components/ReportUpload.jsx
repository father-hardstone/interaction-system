import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import api from '../services/api';
import supabaseStorageService from '../services/supabaseService';

const REPORT_TYPES = [
    { value: 'blood_test', label: 'Blood Test' },
    { value: 'x_ray', label: 'X-Ray' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ct_scan', label: 'CT Scan' },
    { value: 'mri_scan', label: 'MRI Scan' },
    { value: 'ecg', label: 'ECG' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'urine_test', label: 'Urine Test' },
    { value: 'other', label: 'Other' }
];

const ReportUpload = ({
    visitor,
    entityId,
    entitySerial,
    interactions = [],
    officers = [],
    onUploadSuccess,
    buttonLabel = 'Upload Report'
}) => {
    const [showModal, setShowModal] = useState(false);
    const [reportType, setReportType] = useState('');
    const [selectedInteractionId, setSelectedInteractionId] = useState('');
    const [procedureDate, setProcedureDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportGeneratedDate, setReportGeneratedDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [labName, setLabName] = useState('');
    const [labAddress, setLabAddress] = useState('');
    const [externalReportId, setExternalReportId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [dateError, setDateError] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (showModal) {
            resetForm();
        }
    }, [showModal]);

    const resetForm = () => {
        setReportType('');
        setSelectedInteractionId('');
        setProcedureDate(new Date().toISOString().split('T')[0]);
        setReportGeneratedDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setLabName('');
        setLabAddress('');
        setExternalReportId('');
        setDoctorId('');
        setDoctorName('');
        setSelectedFile(null);
        setFilePreview(null);
        setError('');
        setDateError('');
        setSuccessMsg('');
        setUploadProgress(0);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a PDF or image file (JPEG, PNG, GIF)');
            return;
        }

        // Validate file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            setError('File size must be less than 20MB');
            return;
        }

        setSelectedFile(file);
        setError('');
        setSuccessMsg('');

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleInteractionChange = (e) => {
        const id = e.target.value;
        setSelectedInteractionId(id);

        if (id) {
            const int = interactions.find(i => i.id === id);
            if (int) {
                setDoctorId(int.officerSerial || 'N/A');

                // Resolve doctor's name from the officers list
                const officer = officers.find(o => o.id === int.officerId);
                if (officer) {
                    setDoctorName(officer.name || 'Unknown Officer');
                } else {
                    setDoctorName('Assigned Officer');
                }
            }
        } else {
            setDoctorId('');
            setDoctorName('');
        }
    };

    const handleDateChange = (field, value) => {
        if (field === 'procedure') setProcedureDate(value);
        else setReportGeneratedDate(value);

        const p = field === 'procedure' ? value : procedureDate;
        const r = field === 'report' ? value : reportGeneratedDate;

        if (p && r) {
            const pDate = new Date(p);
            const rDate = new Date(r);
            if (rDate < pDate) {
                setDateError('Report date cannot be before procedure date');
            } else {
                setDateError('');
            }
        }
    };

    const validateForm = () => {
        if (!reportType) return 'Please select a report type';
        if (!procedureDate) return 'Please select a procedure date';
        if (!reportGeneratedDate) return 'Please select a report generation date';

        const procDate = new Date(procedureDate);
        const genDate = new Date(reportGeneratedDate);
        if (genDate < procDate) return 'Report generation date cannot be before procedure date';

        if (!selectedFile) return 'Please select a file to upload';
        return null;
    };

    const handleUpload = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccessMsg('');
        setUploadProgress(10);

        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onprogress = (data) => {
                if (data.lengthComputable) {
                    const progress = Math.round((data.loaded / data.total) * 50);
                    setUploadProgress(10 + progress);
                }
            };

            reader.onloadend = async () => {
                try {
                    setUploadProgress(30);
                    
                    // Generate report ID using crypto.randomUUID() (built-in browser API)
                    const reportId = crypto.randomUUID();
                    
                    // Upload file to Supabase first
                    setUploadProgress(50);
                    const supabasePath = await supabaseStorageService.uploadReport(
                        selectedFile,
                        entityId,
                        visitor.id,
                        reportId
                    );
                    
                    setUploadProgress(70);

                    // Send report metadata with Supabase path to backend
                    const reportData = {
                        entityId,
                        patientId: visitor.id,
                        interactionId: selectedInteractionId || '',
                        reportType,
                        procedureDate,
                        reportGeneratedDate,
                        labMetadata: {
                            labName,
                            labAddress,
                            externalReportId
                        },
                        notes,
                        supabasePath: supabasePath, // Supabase path instead of fileData
                        fileName: selectedFile.name,
                        mimeType: selectedFile.type,
                        fileSize: selectedFile.size,
                        reportId: reportId,
                        uploadedBy: 'system' // Should be current user
                    };

                    const result = await reportService.upload(reportData);

                    setUploadProgress(100);
                    setSuccessMsg('Report uploaded successfully!');

                    if (onUploadSuccess) {
                        onUploadSuccess();
                    }

                    // Reset for next upload without closing modal
                    setTimeout(() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setUploadProgress(0);
                        setSuccessMsg('');
                        // Keep other fields for potential serial upload of same type/date
                    }, 2000);

                } catch (err) {
                    console.error('Upload error:', err);
                    setError(err.response?.data?.error || 'Failed to upload report. Please try again.');
                    setUploadProgress(0);
                } finally {
                    setIsUploading(false);
                }
            };
            reader.onerror = () => {
                setError('Failed to read file');
                setIsUploading(false);
                setUploadProgress(0);
            };
            reader.readAsDataURL(selectedFile);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload report. Please try again.');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const completedInteractions = interactions.filter(i =>
        i.visitorId === visitor.id && i.completed
    ).sort((a, b) =>
        new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime()
    );

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
            >
                {buttonLabel}
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[1001] p-4 animate-in fade-in duration-200"
                    onClick={() => !isUploading && setShowModal(false)}
                >
                    <div
                        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Upload Report</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs text-slate-500">Patient: <span className="font-semibold text-slate-700">{visitor.firstName} {visitor.lastName} ({visitor.serial})</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => !isUploading && setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Form Details */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Report Type</label>
                                            <select
                                                value={reportType}
                                                onChange={(e) => setReportType(e.target.value)}
                                                disabled={isUploading}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-blue-50 text-sm font-medium transition-all"
                                            >
                                                <option value="" disabled>Select Type...</option>
                                                {REPORT_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Linked Interaction</label>
                                            <select
                                                value={selectedInteractionId}
                                                onChange={handleInteractionChange}
                                                disabled={isUploading || completedInteractions.length === 0}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-blue-50 text-sm font-medium transition-all disabled:opacity-50"
                                            >
                                                <option value="">Independent</option>
                                                {completedInteractions.map((interaction) => (
                                                    <option key={interaction.id} value={interaction.id}>
                                                        {interaction.interactionSerial} ({(() => {
                                                            const d = new Date(interaction.editedAt || interaction.createdAt);
                                                            return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
                                                        })()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Doctor ID</label>
                                            <input
                                                type="text"
                                                value={doctorId}
                                                readOnly
                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed"
                                                placeholder="Auto-populated"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Doctor Name</label>
                                            <input
                                                type="text"
                                                value={doctorName}
                                                readOnly
                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 cursor-not-allowed"
                                                placeholder="Auto-populated"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Procedure Date</label>
                                            <input
                                                type="date"
                                                value={procedureDate}
                                                onChange={(e) => handleDateChange('procedure', e.target.value)}
                                                disabled={isUploading}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary text-sm font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Report Date</label>
                                            <input
                                                type="date"
                                                value={reportGeneratedDate}
                                                onChange={(e) => handleDateChange('report', e.target.value)}
                                                disabled={isUploading}
                                                className={`w-full px-3 py-2 bg-slate-50 border ${dateError ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200'} rounded-xl focus:bg-white focus:border-primary text-sm font-medium transition-all`}
                                            />
                                        </div>
                                        {dateError && (
                                            <div className="col-span-2">
                                                <p className="text-[11px] font-medium text-red-500">{dateError}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Lab & Additional Notes</label>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={labName}
                                                onChange={(e) => setLabName(e.target.value)}
                                                placeholder="Laboratory Name"
                                                disabled={isUploading}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary transition-all text-sm"
                                            />
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Findings or summary..."
                                                disabled={isUploading}
                                                rows={2}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary transition-all text-sm resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: File Dropzone */}
                                <div className="space-y-4 flex flex-col">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">File Attachment</label>

                                    <div
                                        className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all relative overflow-hidden ${selectedFile ? 'border-primary-100 bg-primary-50/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 cursor-pointer'}`}
                                        onClick={() => !selectedFile && document.getElementById('report-file-input').click()}
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary-400', 'bg-primary-50'); }}
                                        onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary-400', 'bg-primary-50'); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-primary-400', 'bg-primary-50');
                                            const file = e.dataTransfer.files[0];
                                            if (file) handleFileSelect({ target: { files: [file] } });
                                        }}
                                    >
                                        {!selectedFile ? (
                                            <>
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 text-primary">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                </div>
                                                <p className="text-slate-900 font-semibold text-sm text-center">Drag and drop file</p>
                                                <p className="text-slate-400 text-[10px] mt-1">PDF or Images up to 20MB</p>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex flex-col">
                                                <div className="flex-1 flex items-center justify-center min-h-[150px]">
                                                    {filePreview ? (
                                                        <img src={filePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                                                    ) : (
                                                        <div className="text-center">
                                                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2 text-red-600">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-slate-900 font-semibold text-sm">PDF Document</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 font-bold text-[9px] uppercase">
                                                            {selectedFile.name.split('.').pop()}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                                                            <p className="text-[9px] text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFilePreview(null); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            id="report-file-input"
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.gif"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status Messages */}
                            <div className="mt-8">
                                {isUploading && (
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
                                        <div
                                            className="bg-blue-600 h-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
                                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm font-bold text-red-700">{error}</p>
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl flex items-center gap-3 animate-bounce">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm font-bold text-green-700">{successMsg}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isUploading}
                                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-semibold text-sm hover:bg-white transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !reportType || !selectedFile || !!dateError}
                                className="px-8 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading...
                                    </>
                                ) : 'Save Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportUpload;
