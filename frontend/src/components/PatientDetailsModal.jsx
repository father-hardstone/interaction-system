import React, { useState, useEffect } from 'react';
import ReportUpload from './ReportUpload';
import ReportDetailsModal from './ReportDetailsModal';
import { renderInteractionTags } from '../utils/interactionTags';
import supabaseStorageService from '../services/supabaseService';
import { formatPhoneDisplay, formatHealthCardDisplay, formatDateMMDDYYYY, getShortInteractionId, getLastVisitDisplay } from '../utils/formatUtils';

const toTitleCase = (str) => {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const PatientDetailsModal = ({
    selectedPatient,
    setShowPatientDetailModal,
    getVisitorName,
    getVisitorSerial,
    completedInteractionsForPatient = [],
    lastVisits = {},
    formatDate,
    getImageUrl,
    setViewingMedia,
    isLoadingReports,
    patientReports = [],
    entityId,
    entitySerial,
    interactions = [],
    officers = [],
    onUploadSuccess,
    handlePatientClick,
    onInteractionClick,
    visitors = [],
    reportsOnly = false,
    isUnconfirmed = false
}) => {
    const [imageLoadingStates, setImageLoadingStates] = useState({});
    const [reportUrls, setReportUrls] = useState({});
    const [viewingReport, setViewingReport] = useState(null);

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
            if (Object.keys(urls).length > 0) setReportUrls(urls);
        };
        if (patientReports && patientReports.length > 0) fetchReportUrls();
    }, [patientReports]);

    const getReportUrl = (report) => {
        if (!report?.fileMetadata) return null;
        if (report.fileMetadata.supabasePath && reportUrls[report.fileMetadata.supabasePath]) {
            return reportUrls[report.fileMetadata.supabasePath];
        }
        if (report.fileMetadata.localPath) {
            return getImageUrl?.(report.fileMetadata.localPath);
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

    const handleViewReport = (report) => {
        if (report && getReportUrl(report)) setViewingReport(report);
    };

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 pb-4 pt-0 !mt-0 animate-in fade-in duration-300"
            onClick={() => setShowPatientDetailModal(false)}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between gap-6 px-6 py-3 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-6 min-w-0 flex-1">
                        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {toTitleCase(getVisitorName(selectedPatient.id) || '') || '-'}
                        </h3>
                        <span className="text-base font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 normal-case tracking-wide shrink-0">
                            {getVisitorSerial(selectedPatient.id) || '-'}
                        </span>
                        <div className="flex items-center gap-4 ml-auto shrink-0 text-base">
                            <div>
                                <span className="text-slate-500 font-semibold normal-case tracking-wide">DOB</span>
                                <span className="ml-1.5 font-semibold text-slate-700">{formatDateMMDDYYYY(selectedPatient.dateOfBirth) || '-'}</span>
                                {selectedPatient.dateOfBirth && (() => {
                                    const parts = String(selectedPatient.dateOfBirth).split(/[-/]/);
                                    if (parts.length >= 3) {
                                        let month, day, year;
                                        if (parts[0].length === 4) {
                                            [year, month, day] = parts;
                                        } else {
                                            [month, day, year] = parts;
                                        }
                                        month = parseInt(month, 10) - 1;
                                        day = parseInt(day, 10);
                                        year = parseInt(year, 10);
                                        const dob = new Date(year, month, day);
                                        const today = new Date();
                                        let years = today.getFullYear() - dob.getFullYear();
                                        let months = today.getMonth() - dob.getMonth();
                                        if (today.getDate() < dob.getDate()) months--;
                                        if (months < 0) { years--; months += 12; }
                                        if (!isNaN(years) && years >= 0) {
                                            if (years === 0) return <span className="ml-1.5 text-slate-600 font-semibold">({months} mo)</span>;
                                            return <span className="ml-1.5 text-slate-600 font-semibold">({months > 0 ? `${years} yr ${months} mo` : `${years} yr`})</span>;
                                        }
                                    }
                                    return null;
                                })()}
                            </div>
                            {selectedPatient.healthCardNumber && (
                                <>
                                    <div className="text-slate-300">|</div>
                                    <div>
                                        <span className="text-slate-500 font-semibold normal-case tracking-wide">HC</span>
                                        <span className="ml-1.5 font-sans font-semibold text-slate-700">{formatHealthCardDisplay(selectedPatient.healthCardNumber)}</span>
                                        {selectedPatient.healthCardVersion && <span className="ml-1 text-slate-600 font-semibold">({selectedPatient.healthCardVersion})</span>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowPatientDetailModal(false)}
                        className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3 scrollbar-thin text-lg">
                    {/* SECTION 1: Personal Profile (hidden in reportsOnly mode) */}
                    {!reportsOnly && (
                    <div className="space-y-1.5">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
                            {[
                                { label: 'Full Name', value: toTitleCase(getVisitorName(selectedPatient.id)) },
                                { label: 'Sex', value: selectedPatient.gender || '-' },
                                { label: 'Phone (M)', value: formatPhoneDisplay(selectedPatient.phoneM || selectedPatient.phone) },
                                { label: 'Phone (B)', value: (() => { const m = selectedPatient.phoneM || selectedPatient.phone || ''; const b = selectedPatient.phoneB || (selectedPatient.phone && selectedPatient.phone !== m ? selectedPatient.phone : ''); return b ? formatPhoneDisplay(b) : '—'; })() },
                                { label: 'Phone (H)', value: formatPhoneDisplay(selectedPatient.phoneH) },
                                { label: 'Email Address', value: selectedPatient.email },
                                { label: 'Last Visit', value: getLastVisitDisplay(selectedPatient, lastVisits, completedInteractionsForPatient) },
                                { label: 'HC issue date', value: formatDateMMDDYYYY(selectedPatient.healthCardEffectivityDate) },
                                { label: 'HC expiry date', value: formatDateMMDDYYYY(selectedPatient.healthCardExpiryDate), isExpiryDate: true, rawDate: selectedPatient.healthCardExpiryDate },
                            ].map((item, idx) => {
                                const isExpired = item.isExpiryDate && item.rawDate && (() => {
                                    const exp = new Date(item.rawDate);
                                    return !isNaN(exp.getTime()) && exp < new Date();
                                })();
                                return (
                                    <div key={idx} className="space-y-0">
                                        <label className="text-xs font-semibold text-slate-600 normal-case tracking-wide block">{item.label}</label>
                                        <div className={`text-sm font-semibold tracking-tight normal-case ${item.label === 'Full Name' ? 'font-bold text-slate-700' : isExpired ? 'text-red-600' : 'text-slate-700'}`}>{item.value || '-'}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-0.5">
                            <div className="flex-1 space-y-0.5">
                                <label className="text-sm font-semibold text-slate-600 normal-case tracking-wide block">Residential Address</label>
                                <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight leading-snug">
                                    {selectedPatient.addressLine}, {selectedPatient.city}, {selectedPatient.province || selectedPatient.state} {selectedPatient.postalCode}
                                </div>
                            </div>
                        </div>

                        <div className="mt-1.5 p-2 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-red-900 normal-case tracking-wide block">Allergies</label>
                                    <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight">{selectedPatient.allergies || 'N/A'}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-red-900 normal-case tracking-wide block">Type of Reactions</label>
                                    <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight">{selectedPatient.drugReactions || 'N/A'}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-red-900 normal-case tracking-wide block">Special Notes</label>
                                    <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight">{selectedPatient.specialNotes || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Past medical history */}
                        <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                            <label className="text-sm font-semibold text-slate-800 normal-case tracking-wide block mb-1.5">Past medical history</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-1">
                                {[
                                    { key: 'highBloodPressure', label: 'High BP' },
                                    { key: 'heartDisease', label: 'Heart disease' },
                                    { key: 'diabetes', label: 'Diabetes' },
                                    { key: 'cholesterol', label: 'Cholesterol' },
                                    { key: 'smoke', label: 'Smoke' }
                                ].map(({ key, label }) => {
                                    const val = selectedPatient[key];
                                    const display = (val === 'yes' || val === 'no') ? (val === 'yes' ? 'Yes' : 'No') : '—';
                                    return (
                                        <div key={key} className="space-y-0">
                                            <span className="text-xs font-semibold text-slate-600 normal-case">{label}</span>
                                            <div className="text-sm font-semibold text-slate-700 normal-case">{display}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {(selectedPatient.notes || selectedPatient.memo) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 pt-0.5">
                                {selectedPatient.notes && (
                                    <div className="space-y-0.5 min-h-0">
                                        <label className="text-sm font-semibold text-slate-600 normal-case tracking-wide block">Notes</label>
                                        <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight leading-snug max-h-[2em] overflow-y-auto">{selectedPatient.notes}</div>
                                    </div>
                                )}
                                {selectedPatient.memo && (
                                    <div className="space-y-0.5 min-h-0">
                                        <label className="text-sm font-semibold text-slate-600 normal-case tracking-wide block">Memo</label>
                                        <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight leading-snug max-h-[2em] overflow-y-auto">{selectedPatient.memo}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    )}

                    {/* SECTION 2: Emergency Contact (replaces guardian) - hidden in reportsOnly mode */}
                    {!reportsOnly && (selectedPatient.emergencyName || selectedPatient.emergencyRelation || selectedPatient.emergencyPhone) && (
                        <div className="bg-slate-50 rounded-xl border border-slate-100 py-2">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-3.5 bg-amber-500 rounded-full"></div>
                                <h4 className="text-base font-semibold text-slate-900 normal-case tracking-wide">Emergency Contact</h4>
                            </div>
                            <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                                <div className="space-y-0">
                                    <label className="text-xs font-semibold text-slate-600 normal-case tracking-wide block">Name</label>
                                    <div className="text-sm font-semibold text-slate-700 normal-case">{selectedPatient.emergencyName || '-'}</div>
                                </div>
                                <div className="space-y-0">
                                    <label className="text-xs font-semibold text-slate-600 normal-case tracking-wide block">Relation</label>
                                    <div className="text-sm font-semibold text-slate-700 normal-case">{selectedPatient.emergencyRelation || '-'}</div>
                                </div>
                                <div className="space-y-0">
                                    <label className="text-xs font-semibold text-slate-600 normal-case tracking-wide block">Phone</label>
                                    <div className="text-sm font-semibold text-slate-700 normal-case">{formatPhoneDisplay(selectedPatient.emergencyPhone) || '-'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3 & 4: Past Interactions and Reports side by side, max two rows height, internal scroll */}
                    {!isUnconfirmed && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[18rem] min-h-0">
                        {/* Past Interactions - hidden in reportsOnly mode */}
                        {!reportsOnly && (
                        <div className="flex flex-col min-h-0 border border-slate-100 rounded-xl bg-slate-50/50 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-slate-100">
                                <div className="w-1 h-3.5 bg-emerald-500 rounded-full"></div>
                                <h4 className="text-base font-semibold text-slate-900 normal-case tracking-wide">Past Interactions</h4>
                            </div>
                            <div className="flex-1 min-h-0 max-h-[14rem] overflow-y-auto overflow-x-hidden p-2 space-y-2" style={{ scrollbarGutter: 'stable' }}>
                                {completedInteractionsForPatient.length === 0 ? (
                                    <div className="bg-white border border-dashed border-slate-200 rounded-lg py-4 text-center">
                                        <span className="text-sm text-slate-400 font-medium italic">No historical interactions recorded.</span>
                                    </div>
                                ) : (
                                    completedInteractionsForPatient.map((interaction) => (
                                        <button
                                            key={interaction.id}
                                            type="button"
                                            onClick={() => onInteractionClick?.(interaction)}
                                            className="w-full text-left border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:border-blue-200 hover:bg-slate-100"
                                        >
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex flex-col items-start gap-0.5 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-base font-semibold text-blue-600 normal-case tracking-tight">
                                                            {getShortInteractionId(interaction.interactionSerial) || '-'}
                                                        </span>
                                                        {renderInteractionTags(interaction, { size: 'text-xs' })}
                                                    </div>
                                                    <span className="text-sm text-slate-400 font-semibold normal-case tracking-wide">
                                                        Interaction Date: {formatDate(interaction.editedAt || interaction.createdAt)}
                                                    </span>
                                                </div>
                                                <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                        )}

                        {/* Reports */}
                        <div className="flex flex-col min-h-0 border border-slate-100 rounded-xl bg-slate-50/50 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-b border-slate-100">
                                <div className="w-1 h-3.5 bg-red-500 rounded-full"></div>
                                <h4 className="text-base font-semibold text-slate-900 normal-case tracking-wide">Reports</h4>
                            </div>
                            <div className="flex-1 min-h-0 max-h-[14rem] overflow-y-auto overflow-x-hidden p-2 space-y-2" style={{ scrollbarGutter: 'stable' }}>
                                {isLoadingReports ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                                    </div>
                                ) : patientReports.length === 0 ? (
                                    <div className="bg-white border border-dashed border-slate-200 rounded-lg py-4 text-center">
                                        <span className="text-sm text-slate-400 font-medium italic">No clinical reports available.</span>
                                    </div>
                                ) : (
                                    patientReports.map((report) => {
                                        const reportUrl = getReportUrl(report);
                                        const isPdf = report.fileMetadata?.mimeType?.startsWith('application/pdf');
                                        const fileTypeLabel = report.fileMetadata?.mimeType ? (isPdf ? 'PDF' : report.fileMetadata.mimeType.replace('image/', '').toUpperCase()) : '';
                                        const linkedInteraction = report.interactionId && interactions?.find(i => i.id === report.interactionId);
                                        return (
                                            <button
                                                key={report.id}
                                                type="button"
                                                onClick={() => handleViewReport(report)}
                                                disabled={!reportUrl}
                                                className="w-full text-left bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between hover:shadow-md hover:bg-slate-100 transition-all group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 border border-slate-300 overflow-hidden relative shrink-0">
                                                        {report.fileMetadata?.mimeType?.startsWith('image/') ? (
                                                            <>
                                                                {imageLoadingStates[report.id] !== false && (
                                                                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-100">
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                                    </div>
                                                                )}
                                                                <img
                                                                    src={reportUrl}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform pointer-events-none"
                                                                    onLoad={() => handleImageLoad(report.id)}
                                                                    onError={() => handleImageError(report.id)}
                                                                    onLoadStart={() => {
                                                                        if (imageLoadingStates[report.id] === undefined) handleImageStartLoad(report.id);
                                                                    }}
                                                                    style={{ display: imageLoadingStates[report.id] === false ? 'block' : 'none' }}
                                                                />
                                                            </>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M4 18V2h12l4 4v12H4zm14-11h-4V3.1L17.9 7zM6 4h7v4h4v8H6V4z" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-semibold text-blue-600 normal-case tracking-wide truncate">{report.reportType.replace(/_/g, ' ')}</div>
                                                        <div className="text-xs font-semibold text-slate-600 normal-case tracking-tight truncate">{report.labMetadata?.labName || 'Diagnostic Report'}</div>
                                                        <div className="mt-0.5">
                                                            <span className="text-xs font-semibold text-slate-500 normal-case tracking-wide">Report date </span>
                                                            <span className="text-xs font-semibold text-slate-600">{formatDateMMDDYYYY(report.reportGeneratedDate) || formatDateMMDDYYYY(report.procedureDate) || '—'}</span>
                                                        </div>
                                                        {linkedInteraction && (
                                                            <div className="text-xs font-medium text-emerald-600 mt-0.5 normal-case tracking-wide">Linked to {getShortInteractionId(linkedInteraction.interactionSerial)}</div>
                                                        )}
                                                        {fileTypeLabel && (
                                                            <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{fileTypeLabel}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <svg className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Footer with Action */}
                {!isUnconfirmed && (
                <div className="px-6 py-3 bg-white border-t border-slate-100 flex justify-end">
                    <ReportUpload
                        visitor={selectedPatient}
                        entityId={entityId}
                        entitySerial={entitySerial}
                        interactions={interactions}
                        officers={officers}
                        onUploadSuccess={onUploadSuccess}
                    />
                </div>
                )}
            </div>

            {viewingReport && (
                <ReportDetailsModal
                    report={viewingReport}
                    reportUrl={getReportUrl(viewingReport)}
                    interactions={interactions}
                    onClose={() => setViewingReport(null)}
                />
            )}
        </div>
    );
};

export default PatientDetailsModal;
