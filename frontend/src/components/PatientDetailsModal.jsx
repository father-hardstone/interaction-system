import React, { useState, useEffect } from 'react';
import InteractionDataView from './InteractionDataView';
import ReportUpload from './ReportUpload';
import { renderInteractionTags } from '../utils/interactionTags';
import supabaseStorageService from '../services/supabaseService';

const PatientDetailsModal = ({
    selectedPatient,
    setShowPatientDetailModal,
    getVisitorName,
    getVisitorSerial,
    completedInteractionsForPatient,
    expandedInteractionIds,
    setExpandedInteractionIds,
    formatDate,
    getImageUrl,
    setViewingMedia,
    isLoadingReports,
    patientReports,
    entityId,
    entitySerial,
    interactions,
    officers,
    onUploadSuccess,
    handlePatientClick,
    visitors = []
}) => {
    const [imageLoadingStates, setImageLoadingStates] = useState({});
    const [reportUrls, setReportUrls] = useState({});

    // Fetch Supabase URLs for reports
    useEffect(() => {
        const fetchReportUrls = async () => {
            const urls = {};
            
            for (const report of patientReports || []) {
                if (report.fileMetadata?.supabasePath) {
                    try {
                        const url = await supabaseStorageService.getFileUrl('CRM testing', report.fileMetadata.supabasePath);
                        urls[report.fileMetadata.supabasePath] = url;
                    } catch (error) {
                        console.error(`Error fetching Supabase URL for report ${report.id}:`, error);
                    }
                }
            }

            if (Object.keys(urls).length > 0) {
                setReportUrls(urls);
            }
        };

        if (patientReports && patientReports.length > 0) {
            fetchReportUrls();
        }
    }, [patientReports]);

    const getReportUrl = (report) => {
        if (!report.fileMetadata) return null;
        
        // Check for Supabase path
        if (report.fileMetadata.supabasePath && reportUrls[report.fileMetadata.supabasePath]) {
            return reportUrls[report.fileMetadata.supabasePath];
        }
        
        // Legacy local path handling
        if (report.fileMetadata.localPath) {
            return getImageUrl(report.fileMetadata.localPath);
        }
        
        return null;
    };

    if (!selectedPatient) return null;

    const handleImageLoad = (reportId) => {
        setImageLoadingStates(prev => ({ ...prev, [reportId]: false }));
    };

    const handleImageError = (reportId) => {
        setImageLoadingStates(prev => ({ ...prev, [reportId]: false }));
    };

    const handleImageStartLoad = (reportId) => {
        setImageLoadingStates(prev => ({ ...prev, [reportId]: true }));
    };

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            onClick={() => setShowPatientDetailModal(false)}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                {getVisitorName(selectedPatient.id) || '-'}
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 uppercase tracking-widest">
                                {getVisitorSerial(selectedPatient.id) || '-'}
                            </span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em]">Comprehensive Patient Profile</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPatientDetailModal(false)}
                        className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                    {/* SECTION 1: Personal Profile */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Identity Details</h4>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Full Name', value: getVisitorName(selectedPatient.id) },
                                { label: 'Date of Birth', value: selectedPatient.dateOfBirth },
                                { label: 'Sex', value: selectedPatient.gender || '-' },
                                { label: 'Mobile Phone', value: selectedPatient.phone },
                                { label: 'Home Phone', value: selectedPatient.phoneH },
                                { label: 'Email Address', value: selectedPatient.email },
                                { label: 'Last Visit', value: (() => {
                                    const lastVisit = completedInteractionsForPatient
                                        .sort((a, b) => {
                                            const dateA = new Date(a.editedAt || a.createdAt);
                                            const dateB = new Date(b.editedAt || b.createdAt);
                                            return dateB - dateA;
                                        })[0];
                                    return lastVisit ? formatDate(lastVisit.editedAt || lastVisit.createdAt, true) : '-';
                                })() },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{item.label}</label>
                                    <div className="text-base font-bold text-slate-700 uppercase tracking-tight">{item.value || '-'}</div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                                {/* Residential Address - Left */}
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Residential Address</label>
                                    <div className="text-base font-bold text-slate-700 uppercase tracking-tight leading-relaxed">
                                        {selectedPatient.addressLine}, {selectedPatient.city}, {selectedPatient.province || selectedPatient.state} {selectedPatient.postalCode}
                                    </div>
                                </div>
                                
                                {/* Health Card - Right */}
                                {selectedPatient.healthCardNumber && (
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Health Card</label>
                                        <div className="text-base font-bold text-slate-700 uppercase tracking-tight leading-relaxed">
                                            <span className="font-mono">{selectedPatient.healthCardNumber}</span>
                                            {selectedPatient.healthCardVersion && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-500 ml-1">{selectedPatient.healthCardVersion}</span>}
                                        </div>
                                        {(selectedPatient.healthCardEffectivityDate || selectedPatient.healthCardExpiryDate) && (
                                            <div className="space-y-1 mt-2">
                                                {selectedPatient.healthCardEffectivityDate && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effectivity:</span>
                                                        <span className="text-sm font-bold text-slate-700">{selectedPatient.healthCardEffectivityDate}</span>
                                                    </div>
                                                )}
                                                {selectedPatient.healthCardExpiryDate && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry:</span>
                                                        <span className="text-sm font-bold text-slate-700">{selectedPatient.healthCardExpiryDate}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Guardian Info (If exists) */}
                    {(selectedPatient.guardianName || selectedPatient.guardianId) && (() => {
                        // Find guardian in visitors list
                        const guardian = selectedPatient.guardianId 
                            ? visitors.find(v => v.id === selectedPatient.guardianId)
                            : null;
                        
                        const handleGuardianClick = () => {
                            if (guardian && handlePatientClick) {
                                handlePatientClick(guardian);
                            }
                        };

                        return (
                            <div className="bg-slate-50 px-0 py-5 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-4 px-0">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Guardian Information</h4>
                                </div>
                                <div 
                                    className={`grid grid-cols-3 gap-6  ${guardian && handlePatientClick ? 'cursor-pointer hover:bg-slate-100/50 rounded-lg transition-colors p-2 -mx-2' : ''}`}
                                    onClick={guardian && handlePatientClick ? handleGuardianClick : undefined}
                                >
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Guardian ID</label>
                                        <div className="text-sm font-bold text-slate-700 uppercase">{selectedPatient.guardianId || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Guardian Name</label>
                                        <div className="text-sm font-bold text-slate-700 uppercase">{selectedPatient.guardianName || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Contact Phone</label>
                                        <div className="text-sm font-bold text-slate-700 uppercase">{selectedPatient.guardianPhone || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* SECTION 3: Clinical Interactions History */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Interaction Timeline</h4>
                        </div>
                        {completedInteractionsForPatient.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8 text-center">
                                <span className="text-xs text-slate-400 font-medium italic">No historical interactions recorded.</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {completedInteractionsForPatient.map((interaction) => {
                                    const isExpanded = expandedInteractionIds[interaction.id];
                                    return (
                                        <div key={interaction.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedInteractionIds(prev => ({ ...prev, [interaction.id]: !isExpanded }))}
                                                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex flex-col items-start">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-black text-blue-600 uppercase tracking-tighter">
                                                            {interaction.interactionSerial || 'REG--'}
                                                        </span>
                                                        {renderInteractionTags(interaction, { size: 'text-[8px]' })}
                                                    </div>
                                                    <span className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
                                                        Session Date: {formatDate(interaction.editedAt || interaction.createdAt)}
                                                    </span>
                                                </div>
                                                <svg className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                            {isExpanded && (
                                                <div className="p-6 bg-slate-50/50 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <InteractionDataView
                                                        interaction={interaction}
                                                        getImageUrl={getImageUrl}
                                                        setViewingMedia={setViewingMedia}
                                                        patientReports={patientReports}
                                                        isExpanded={isExpanded}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Medical Reports Repository */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Reports & Diagnostics</h4>
                        </div>
                        {isLoadingReports ? (
                            <div className="text-center py-6">
                                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                            </div>
                        ) : patientReports.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-8 text-center">
                                <span className="text-xs text-slate-400 font-medium italic">No clinical reports available.</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {patientReports.map((report) => (
                                    <div key={report.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden relative">
                                                {report.fileMetadata.mimeType.startsWith('image/') ? (
                                                    <>
                                                        {imageLoadingStates[report.id] !== false && (
                                                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50">
                                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                                            </div>
                                                        )}
                                                        <img
                                                            src={getReportUrl(report)}
                                                            className="w-full h-full object-cover cursor-zoom-in group-hover:scale-110 transition-transform"
                                                            onClick={() => {
                                                                const url = getReportUrl(report);
                                                                if (url) {
                                                                    setViewingMedia({ type: 'image', url: url, title: report.reportType });
                                                                }
                                                            }}
                                                            onLoad={() => handleImageLoad(report.id)}
                                                            onError={() => handleImageError(report.id)}
                                                            onLoadStart={() => {
                                                                if (imageLoadingStates[report.id] === undefined) {
                                                                    handleImageStartLoad(report.id);
                                                                }
                                                            }}
                                                            style={{ display: imageLoadingStates[report.id] === false ? 'block' : 'none' }}
                                                        />
                                                    </>
                                                ) : (
                                                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M4 18V2h12l4 4v12H4zm14-11h-4V3.1L17.9 7zM6 4h7v4h4v8H6V4z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{report.reportType.replace('_', ' ')}</div>
                                                <div className="text-xs font-black text-slate-700 uppercase tracking-tight leading-none mt-1">{report.labMetadata?.labName || 'Diagnostic Report'}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{formatDate(report.procedureDate, false)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const url = getReportUrl(report);
                                                    if (url) {
                                                        setViewingMedia({ type: report.fileMetadata.mimeType.startsWith('application/pdf') ? 'pdf' : 'image', url: url, title: report.reportType });
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Action */}
                <div className="px-6 py-5 bg-white border-t border-slate-100 flex justify-end">
                    <ReportUpload
                        visitor={selectedPatient}
                        entityId={entityId}
                        entitySerial={entitySerial}
                        interactions={interactions}
                        officers={officers}
                        onUploadSuccess={onUploadSuccess}
                    />
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsModal;
