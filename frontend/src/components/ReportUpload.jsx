import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import api from '../services/api';

const ReportUpload = ({ 
    visitor, 
    entityId, 
    entitySerial, 
    interactions = [],
    onUploadSuccess 
}) => {
    const [showModal, setShowModal] = useState(false);
    const [instituteName, setInstituteName] = useState('');
    const [selectedInteractionId, setSelectedInteractionId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!showModal) {
            setInstituteName('');
            setSelectedInteractionId('');
            setSelectedFile(null);
            setFilePreview(null);
            setError('');
        }
    }, [showModal]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a PDF or image file (JPEG, PNG, GIF)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setError('');

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

    const handleUpload = async () => {
        if (!instituteName.trim()) {
            setError('Please enter the institute name');
            return;
        }

        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64Data = reader.result;
                    const fileType = selectedFile.type.startsWith('image/') ? 'image' : 'pdf';
                    
                    // Get interaction data if selected
                    let interactionId = '';
                    let interactionSerial = '';
                    if (selectedInteractionId) {
                        const interaction = interactions.find(i => i.id === selectedInteractionId);
                        if (interaction) {
                            interactionId = interaction.id;
                            interactionSerial = interaction.interactionSerial;
                        }
                    }

                    // Upload report
                    await reportService.upload({
                        entityId,
                        entitySerial,
                        visitorId: visitor.id,
                        visitorSerial: visitor.serial,
                        interactionId,
                        interactionSerial,
                        instituteName: instituteName.trim(),
                        fileData: base64Data,
                        fileName: selectedFile.name,
                        fileType
                    });

                    // Success
                    setShowModal(false);
                    if (onUploadSuccess) {
                        onUploadSuccess();
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    setError(err.response?.data?.error || 'Failed to upload report. Please try again.');
                } finally {
                    setIsUploading(false);
                }
            };
            reader.onerror = () => {
                setError('Failed to read file');
                setIsUploading(false);
            };
            reader.readAsDataURL(selectedFile);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload report. Please try again.');
            setIsUploading(false);
        }
    };

    // Get completed interactions for dropdown
    const completedInteractions = interactions.filter(i => 
        i.visitorId === visitor.id && i.completed
    ).sort((a, b) => 
        new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime()
    );

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
                Upload Reports
            </button>

            {showModal && (
                <div 
                    className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1001] p-4"
                    onClick={() => !isUploading && setShowModal(false)}
                >
                    <div 
                        className="bg-white w-full max-w-[900px] rounded-2xl shadow-xl p-6 sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Upload Report</h3>
                            <button
                                onClick={() => !isUploading && setShowModal(false)}
                                disabled={isUploading}
                                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Institute Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Institute Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={instituteName}
                                    onChange={(e) => setInstituteName(e.target.value)}
                                    placeholder="Enter institute name"
                                    disabled={isUploading}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                                />
                            </div>

                            {/* Associate with Interaction (Optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Associate with Interaction <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <select
                                    value={selectedInteractionId}
                                    onChange={(e) => setSelectedInteractionId(e.target.value)}
                                    disabled={isUploading || completedInteractions.length === 0}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all bg-white"
                                >
                                    <option value="">None (Upload independently)</option>
                                    {completedInteractions.map((interaction) => (
                                        <option key={interaction.id} value={interaction.id}>
                                            {interaction.interactionSerial} - {new Date(interaction.editedAt || interaction.createdAt).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                                {completedInteractions.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-2 italic">
                                        No completed interactions available
                                    </p>
                                )}
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Report File <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                                        onChange={handleFileSelect}
                                        disabled={isUploading}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                                {selectedFile && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setFilePreview(null);
                                                }}
                                                className="text-red-600 hover:text-red-700 p-1"
                                                disabled={isUploading}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* File Preview (for images) */}
                            {filePreview && (
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3">Preview:</p>
                                    <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <img 
                                            src={filePreview} 
                                            alt="Preview" 
                                            className="max-w-full max-h-64 mx-auto object-contain rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading || !instituteName.trim() || !selectedFile}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Upload Report
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={isUploading}
                                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportUpload;
