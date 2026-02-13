import React, { useState, useEffect } from 'react';
import supabaseStorageService from '../services/supabaseService';

/** Parse scratchpad into paths array (single path or JSON array). */
const parseScratchpadPaths = (scratchpad) => {
    if (!scratchpad) return [];
    if (typeof scratchpad === 'string' && scratchpad.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(scratchpad);
            return Array.isArray(arr) ? arr.filter(Boolean) : [scratchpad];
        } catch {
            return [scratchpad];
        }
    }
    return [scratchpad];
};

const InteractionDataView = ({
    interaction,
    getImageUrl,
    setViewingMedia,
    patientReports = [],
    isExpanded = true
}) => {
    const [imageLoadingStates, setImageLoadingStates] = useState({});
    const [supabaseUrls, setSupabaseUrls] = useState({});
    const [sheetIndices, setSheetIndices] = useState({ cc: 0, subjective: 0, objective: 0, assessmentPlan: 0 });

    if (!interaction) return null;

    // Fetch Supabase URLs for scratchpad images and reports
    useEffect(() => {
        const fetchSupabaseUrls = async () => {
            const urls = {};
            
            // Fetch scratchpad images
            const fields = [
                { key: 'cc', path: interaction.ccReason?.scratchpad },
                { key: 'subjective', path: interaction.subjective?.scratchpad },
                { key: 'objective', path: interaction.objective?.scratchpad },
                { key: 'assessmentPlan', path: interaction.assessmentPlan?.scratchpad }
            ];

            for (const field of fields) {
                const paths = parseScratchpadPaths(field.path);
                for (const p of paths) {
                    if (p && p.includes('/interactions/')) {
                        try {
                            const url = await supabaseStorageService.getFileUrl('CRM testing', p);
                            urls[p] = url;
                        } catch (error) {
                            console.error(`Error fetching Supabase URL for ${field.key}:`, error);
                        }
                    }
                }
            }

            // Fetch report URLs
            for (const report of reports) {
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
                setSupabaseUrls(urls);
            }
        };

        fetchSupabaseUrls();
    }, [interaction, patientReports]);

    const getResolvedImageUrl = (imagePath) => {
        if (!imagePath) return null;
        // If it's a Supabase path (interactions or reports), use the fetched URL, else fall back to local
        if (imagePath.includes('/interactions/') || imagePath.includes('/reports/')) {
            return supabaseUrls[imagePath] || getImageUrl(imagePath);
        }
        return getImageUrl(imagePath);
    };

    const getResolvedReportUrl = (report) => {
        if (!report.fileMetadata) return null;
        
        // Check for Supabase path
        if (report.fileMetadata.supabasePath) {
            return supabaseUrls[report.fileMetadata.supabasePath] || null;
        }
        
        // Legacy local path handling
        if (report.fileMetadata.localPath) {
            return report.fileMetadata.localPath.startsWith('http')
                ? report.fileMetadata.localPath
                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${report.fileMetadata.localPath}`;
        }
        
        return null;
    };

    const reports = patientReports.filter(r => r.interactionId === interaction.id);

    const handleImageLoad = (imageId) => {
        setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
    };

    const handleImageError = (imageId) => {
        setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
    };

    const getImageId = (type, scratchpad) => `${type}-${scratchpad}`;

    const setSheetIndex = (sectionKey, index) => {
        setSheetIndices(prev => ({ ...prev, [sectionKey]: index }));
    };

    /** Renders scratchpad image(s) with optional prev/next when multiple sheets. */
    const renderScratchpadSheets = (sectionKey, scratchpad, zoomTitle) => {
        const paths = parseScratchpadPaths(scratchpad);
        if (!paths.length) return null;
        const currentIndex = Math.min(sheetIndices[sectionKey] ?? 0, paths.length - 1);
        const currentPath = paths[currentIndex];
        const imgId = getImageId(sectionKey, currentPath);
        const isLoading = imageLoadingStates[imgId] !== false;
        const url = getResolvedImageUrl(currentPath);
        return (
            <div className="mt-2 relative min-h-[100px]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-xl z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                <img
                    src={url}
                    alt={`${sectionKey} Scratchpad`}
                    className="max-w-full h-auto rounded-xl border-2 border-slate-100 cursor-zoom-in hover:border-blue-400 transition-all shadow-sm"
                    onClick={() => url && setViewingMedia({ type: 'image', url, title: zoomTitle })}
                    onLoad={() => handleImageLoad(imgId)}
                    onError={() => handleImageError(imgId)}
                    onLoadStart={() => {
                        if (imageLoadingStates[imgId] === undefined) {
                            setImageLoadingStates(prev => ({ ...prev, [imgId]: true }));
                        }
                    }}
                    style={{ display: isLoading ? 'none' : 'block' }}
                />
                {paths.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setSheetIndex(sectionKey, currentIndex - 1)}
                            disabled={currentIndex <= 0}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous sheet"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-medium text-slate-600 min-w-[5rem] text-center">Sheet {currentIndex + 1} of {paths.length}</span>
                        <button
                            type="button"
                            onClick={() => setSheetIndex(sectionKey, currentIndex + 1)}
                            disabled={currentIndex >= paths.length - 1}
                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            aria-label="Next sheet"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const formatSimpleDate = (dateString) => {
        if (!dateString) return 'N/A';
        const parts = dateString.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[1]}-${parts[2]}-${parts[0]}`;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}-${dd}-${yyyy}`;
    };

    return (
        <div className="space-y-8">
            {/* ROW 1: CC */}
            {(interaction.ccReason?.text || (interaction.ccReason?.hasScratchpad && interaction.ccReason?.scratchpad)) && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-blue-500">Chief Complaint (CC)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.ccReason.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.ccReason.text}
                            </p>
                        )}
                        {interaction.ccReason.hasScratchpad && interaction.ccReason.scratchpad && renderScratchpadSheets('cc', interaction.ccReason.scratchpad, 'Chief Complaint Handwriting')}
                    </div>
                </div>
            )}

            {/* ROW 2: Subjective */}
            {(interaction.subjective?.text || (interaction.subjective?.hasScratchpad && interaction.subjective?.scratchpad)) && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-blue-500">Subjective (S)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.subjective.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.subjective.text}
                            </p>
                        )}
                        {interaction.subjective.hasScratchpad && interaction.subjective.scratchpad && renderScratchpadSheets('subjective', interaction.subjective.scratchpad, 'Subjective Handwriting')}
                    </div>
                </div>
            )}

            {/* ROW 3: Objective */}
            {(interaction.objective?.text || (interaction.objective?.hasScratchpad && interaction.objective?.scratchpad)) && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-blue-500">Objective (O)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.objective.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.objective.text}
                            </p>
                        )}
                        {interaction.objective.hasScratchpad && interaction.objective.scratchpad && renderScratchpadSheets('objective', interaction.objective.scratchpad, 'Objective Handwriting')}
                    </div>
                </div>
            )}

            {/* ROW 4: Assessment & Plan */}
            {(interaction.assessmentPlan?.text || (interaction.assessmentPlan?.hasScratchpad && interaction.assessmentPlan?.scratchpad)) && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-blue-500">Assessment & Plan (A&P)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.assessmentPlan.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.assessmentPlan.text}
                            </p>
                        )}
                        {interaction.assessmentPlan.hasScratchpad && interaction.assessmentPlan.scratchpad && renderScratchpadSheets('assessmentPlan', interaction.assessmentPlan.scratchpad, 'Assessment & Plan Handwriting')}
                    </div>
                </div>
            )}

            {/* ROW 5: Medications */}
            {interaction.medications && interaction.medications.length > 0 && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-emerald-600">Medications prescribed</label>
                    <div className="space-y-4">
                        {interaction.medications.map((med, idx) => (
                            <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-emerald-800 text-sm normal-case tracking-tight">{med.name}</span>
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-semibold">{med.dosage}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-xs normal-case font-semibold text-emerald-600/60 tracking-wider">Frequency / Duration</span>
                                        <span className="text-slate-700 font-semibold">{med.frequency} • {med.duration}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-xs normal-case font-semibold text-emerald-600/60 tracking-wider">Refills / Suspension</span>
                                        <span className="text-slate-700 font-semibold">{med.refills} refills • {med.suspension || 'tablet'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ROW 6: Referral / Requisition */}
            {interaction.referral && interaction.referral.type && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-blue-600">Referral / requisition</label>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-blue-700 normal-case p-1.5 bg-blue-100/50 rounded-lg text-xs tracking-widest">{interaction.referral.type}</span>
                            <span className="text-sm font-semibold text-slate-500">{formatSimpleDate(interaction.referral.date)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-xs normal-case font-semibold text-slate-400 block mb-0.5 tracking-tighter">Directed To</span>
                                <div className="font-semibold text-slate-800">{interaction.referral.to}</div>
                            </div>
                            <div>
                                <span className="text-xs normal-case font-semibold text-slate-400 block mb-0.5 tracking-tighter">Clinical Indication</span>
                                <div className="font-medium text-slate-600 text-xs leading-relaxed italic">{interaction.referral.reason}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROW 7: Follow-up */}
            {((interaction.followupRequired?.required) || (interaction.followup?.required)) && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-orange-600">Required follow-up</label>
                    <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all hover:shadow-md hover:bg-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="font-semibold text-orange-900 normal-case text-xs tracking-tighter">Next appointment recommended</span>
                        </div>
                        <span className="font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-sm">{formatSimpleDate((interaction.followupRequired || interaction.followup)?.date)}</span>
                    </div>
                </div>
            )}

            {/* ROW 6: Interaction Notes history */}
            {interaction.savedNotes && interaction.savedNotes.length > 0 && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-yellow-600">Interaction notes history</label>
                    <div className="bg-yellow-50/30 border border-yellow-100/50 rounded-3xl p-4 space-y-4">
                        {interaction.savedNotes.map((note, idx) => (
                            <div key={idx} className="bg-white border border-yellow-100 p-4 rounded-2xl shadow-sm relative group/note">
                                <div className="absolute top-4 left-0 w-1 h-6 bg-yellow-400 rounded-r-full group-hover/note:h-full transition-all duration-300"></div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-yellow-600 normal-case tracking-wide">Medical Entry #{idx + 1}</span>
                                    <span className="text-xs font-semibold text-slate-400">
                                        {(() => {
                                            const d = new Date(note.timestamp);
                                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                                            const dd = String(d.getDate()).padStart(2, '0');
                                            const yyyy = d.getFullYear();
                                            const hh = String(d.getHours()).padStart(2, '0');
                                            const min = String(d.getMinutes()).padStart(2, '0');
                                            return `${mm}-${dd}-${yyyy} ${hh}:${min}`;
                                        })()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{note.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ROW 7: Billing Lines */}
            {interaction.serviceLines && interaction.serviceLines.length > 0 && (
                <div className="group">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block mb-2 transition-colors group-hover:text-slate-900">Billing & diagnostics</label>
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-slate-400 normal-case tracking-tighter">Diagnostic (Dx)</th>
                                    <th className="px-4 py-3 font-semibold text-slate-400 normal-case tracking-tighter">Service</th>
                                    <th className="px-4 py-3 font-semibold text-slate-400 normal-case tracking-tighter text-right text-slate-500">Fee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {interaction.serviceLines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-blue-700">{line.diagnostic}</div>
                                            {line.suffix && (
                                                <div className="text-xs text-slate-400 mt-0.5">Suffix: {line.suffix}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{line.service}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-slate-900">${line.totalFee?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-100 font-semibold">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-slate-500 normal-case tracking-widest text-xs">Total Amount Billed</td>
                                    <td className="px-4 py-3 text-right text-primary text-sm">${interaction.serviceLines.reduce((acc, curr) => acc + (curr.totalFee || 0), 0).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* ROW 8: Medical Files (SIMPLER VERSION) */}
            <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block">Medical Reports Vault</label>
                    <span className="bg-slate-100 text-slate-500 font-semibold text-xs px-2 py-0.5 rounded-md normal-case">{reports.length} Files</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2">
                    {reports.map((report) => {
                        const isPdf = report.fileMetadata?.mimeType === 'application/pdf';
                        const fileUrl = getResolvedReportUrl(report);

                        return (
                            <div
                                key={report.id}
                                onClick={() => {
                                    if (fileUrl) {
                                        setViewingMedia({
                                            type: isPdf ? 'pdf' : 'image',
                                            url: fileUrl,
                                            title: report.fileMetadata.filename
                                        });
                                    }
                                }}
                                className="group/file cursor-pointer aspect-square bg-white border border-slate-100 rounded-lg overflow-hidden transition-all hover:border-blue-400 hover:shadow-sm active:scale-95"
                                title={report.labMetadata?.labName || report.reportType}
                            >
                                <div className="w-full h-full relative">
                                    {isPdf ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 18V2h12l4 4v12H4zm14-11h-4V3.1L17.9 7zM6 4h7v4h4v8H6V4z" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <>
                                            {imageLoadingStates[`report-${report.id}`] !== false && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                </div>
                                            )}
                                            <img
                                                src={fileUrl}
                                                alt={report.fileMetadata.filename}
                                                className="w-full h-full object-cover grayscale group-hover/file:grayscale-0 transition-all"
                                                onLoad={() => handleImageLoad(`report-${report.id}`)}
                                                onError={() => handleImageError(`report-${report.id}`)}
                                                onLoadStart={() => {
                                                    const imgId = `report-${report.id}`;
                                                    if (imageLoadingStates[imgId] === undefined) {
                                                        setImageLoadingStates(prev => ({ ...prev, [imgId]: true }));
                                                    }
                                                }}
                                                style={{ display: imageLoadingStates[`report-${report.id}`] === false ? 'block' : 'none' }}
                                            />
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-blue-600/0 group-hover/file:bg-blue-600/10 transition-colors"></div>
                                </div>
                            </div>
                        );
                    })}
                    {reports.length === 0 && (
                        <div className="col-span-full py-4 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <span className="text-xs text-slate-400 font-semibold normal-case tracking-widest">No attached reports</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InteractionDataView;
