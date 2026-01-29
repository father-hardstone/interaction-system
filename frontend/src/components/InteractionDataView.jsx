import React, { useState, useEffect } from 'react';
import supabaseStorageService from '../services/supabaseService';

const InteractionDataView = ({
    interaction,
    getImageUrl,
    setViewingMedia,
    patientReports = [],
    isExpanded = true
}) => {
    const [imageLoadingStates, setImageLoadingStates] = useState({});
    const [supabaseUrls, setSupabaseUrls] = useState({});

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
                if (field.path && field.path.includes('/interactions/')) {
                    try {
                        const url = await supabaseStorageService.getFileUrl('CRM testing', field.path);
                        urls[field.path] = url;
                    } catch (error) {
                        console.error(`Error fetching Supabase URL for ${field.key}:`, error);
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
        // If it's a Supabase path (interactions or reports), use the fetched URL
        if (imagePath.includes('/interactions/') || imagePath.includes('/reports/')) {
            return supabaseUrls[imagePath] || null;
        }
        // Otherwise use the regular getImageUrl
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-blue-500">Chief Complaint (CC)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.ccReason.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.ccReason.text}
                            </p>
                        )}
                        {interaction.ccReason.hasScratchpad && interaction.ccReason.scratchpad && (
                            <div className="mt-2 relative min-h-[100px]">
                                {imageLoadingStates[getImageId('cc', interaction.ccReason.scratchpad)] !== false && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-xl z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                <img
                                    src={getResolvedImageUrl(interaction.ccReason.scratchpad)}
                                    alt="CC Scratchpad"
                                    className="max-w-full h-auto rounded-xl border-2 border-slate-100 cursor-zoom-in hover:border-blue-400 transition-all shadow-sm"
                                    onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.ccReason.scratchpad), title: 'Chief Complaint Handwriting' })}
                                    onLoad={() => handleImageLoad(getImageId('cc', interaction.ccReason.scratchpad))}
                                    onError={() => handleImageError(getImageId('cc', interaction.ccReason.scratchpad))}
                                    onLoadStart={() => {
                                        const imgId = getImageId('cc', interaction.ccReason.scratchpad);
                                        if (imageLoadingStates[imgId] === undefined) {
                                            setImageLoadingStates(prev => ({ ...prev, [imgId]: true }));
                                        }
                                    }}
                                    style={{ display: imageLoadingStates[getImageId('cc', interaction.ccReason.scratchpad)] === false ? 'block' : 'none' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ROW 2: Subjective */}
            {(interaction.subjective?.text || (interaction.subjective?.hasScratchpad && interaction.subjective?.scratchpad)) && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-blue-500">Subjective (S)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.subjective.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.subjective.text}
                            </p>
                        )}
                        {interaction.subjective.hasScratchpad && interaction.subjective.scratchpad && (
                            <div className="mt-2 relative min-h-[100px]">
                                {imageLoadingStates[getImageId('subjective', interaction.subjective.scratchpad)] !== false && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-xl z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                <img
                                    src={getResolvedImageUrl(interaction.subjective.scratchpad)}
                                    alt="S Scratchpad"
                                    className="max-w-full h-auto rounded-xl border-2 border-slate-100 cursor-zoom-in hover:border-blue-400 transition-all shadow-sm"
                                    onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.subjective.scratchpad), title: 'Subjective Handwriting' })}
                                    onLoad={() => handleImageLoad(getImageId('subjective', interaction.subjective.scratchpad))}
                                    onError={() => handleImageError(getImageId('subjective', interaction.subjective.scratchpad))}
                                    onLoadStart={() => {
                                        const imgId = getImageId('subjective', interaction.subjective.scratchpad);
                                        if (imageLoadingStates[imgId] === undefined) {
                                            setImageLoadingStates(prev => ({ ...prev, [imgId]: true }));
                                        }
                                    }}
                                    style={{ display: imageLoadingStates[getImageId('subjective', interaction.subjective.scratchpad)] === false ? 'block' : 'none' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ROW 3: Objective */}
            {(interaction.objective?.text || (interaction.objective?.hasScratchpad && interaction.objective?.scratchpad)) && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-blue-500">Objective (O)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.objective.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.objective.text}
                            </p>
                        )}
                        {interaction.objective.hasScratchpad && interaction.objective.scratchpad && (
                            <div className="mt-2 relative min-h-[100px]">
                                {imageLoadingStates[getImageId('objective', interaction.objective.scratchpad)] !== false && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-xl z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                <img
                                    src={getResolvedImageUrl(interaction.objective.scratchpad)}
                                    alt="O Scratchpad"
                                    className="max-w-full h-auto rounded-xl border-2 border-slate-100 cursor-zoom-in hover:border-blue-400 transition-all shadow-sm"
                                    onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.objective.scratchpad), title: 'Objective Handwriting' })}
                                    onLoad={() => handleImageLoad(getImageId('objective', interaction.objective.scratchpad))}
                                    onError={() => handleImageError(getImageId('objective', interaction.objective.scratchpad))}
                                    onLoadStart={() => {
                                        const imgId = getImageId('objective', interaction.objective.scratchpad);
                                        if (imageLoadingStates[imgId] === undefined) {
                                            setImageLoadingStates(prev => ({ ...prev, [imgId]: true }));
                                        }
                                    }}
                                    style={{ display: imageLoadingStates[getImageId('objective', interaction.objective.scratchpad)] === false ? 'block' : 'none' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ROW 4: Assessment & Plan */}
            {(interaction.assessmentPlan?.text || (interaction.assessmentPlan?.hasScratchpad && interaction.assessmentPlan?.scratchpad)) && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-blue-500">Assessment & Plan (A&P)</label>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:bg-white min-h-[60px]">
                        {interaction.assessmentPlan.text && (
                            <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap mb-3">
                                {interaction.assessmentPlan.text}
                            </p>
                        )}
                        {interaction.assessmentPlan.hasScratchpad && interaction.assessmentPlan.scratchpad && (
                            <div className="mt-2 relative min-h-[100px]">
                                {imageLoadingStates[getImageId('assessmentPlan', interaction.assessmentPlan.scratchpad)] !== false && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 rounded-xl z-10">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                <img
                                    src={getResolvedImageUrl(interaction.assessmentPlan.scratchpad)}
                                    alt="A&P Scratchpad"
                                    className="max-w-full h-auto rounded-xl border-2 border-slate-100 cursor-zoom-in hover:border-blue-400 transition-all shadow-sm"
                                    onClick={() => setViewingMedia({ type: 'image', url: getResolvedImageUrl(interaction.assessmentPlan.scratchpad), title: 'Assessment & Plan Handwriting' })}
                                    onLoad={() => handleImageLoad(getImageId('assessmentPlan', interaction.assessmentPlan.scratchpad))}
                                    onError={() => handleImageError(getImageId('assessmentPlan', interaction.assessmentPlan.scratchpad))}
                                    onLoadStart={() => {
                                        const imgId = getImageId('assessmentPlan', interaction.assessmentPlan.scratchpad);
                                        if (imageLoadingStates[imgId] === undefined) {
                                            setImageLoadingStates(prev => ({ ...prev, [imgId]: true }));
                                        }
                                    }}
                                    style={{ display: imageLoadingStates[getImageId('assessmentPlan', interaction.assessmentPlan.scratchpad)] === false ? 'block' : 'none' }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ROW 5: Medications */}
            {interaction.medications && interaction.medications.length > 0 && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-emerald-600">Medications prescribed</label>
                    <div className="space-y-4">
                        {interaction.medications.map((med, idx) => (
                            <div key={idx} className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-emerald-800 text-sm uppercase tracking-tight">{med.name}</span>
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-lg text-xs font-black">{med.dosage}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-emerald-600/60 tracking-wider">Frequency / Duration</span>
                                        <span className="text-slate-700 font-bold">{med.frequency} • {med.duration}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] uppercase font-bold text-emerald-600/60 tracking-wider">Refills / Suspension</span>
                                        <span className="text-slate-700 font-bold">{med.refills} refills • {med.suspension || 'tablet'}</span>
                                    </div>
                                </div>
                                {med.instructions && (
                                    <div className="mt-3 pt-3 border-t border-emerald-100 text-[11px] text-slate-500 italic font-medium leading-relaxed">
                                        “{med.instructions}”
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ROW 6: Referral / Requisition */}
            {interaction.referral && interaction.referral.type && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-blue-600">Referral / requisition</label>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 shadow-sm transition-all hover:shadow-md hover:bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-black text-blue-700 uppercase p-1.5 bg-blue-100/50 rounded-lg text-[10px] tracking-widest">{interaction.referral.type}</span>
                            <span className="text-[11px] font-bold text-slate-500">{formatSimpleDate(interaction.referral.date)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <span className="text-[10px] uppercase font-black text-slate-400 block mb-0.5 tracking-tighter">Directed To</span>
                                <div className="font-bold text-slate-800">{interaction.referral.to}</div>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-black text-slate-400 block mb-0.5 tracking-tighter">Clinical Indication</span>
                                <div className="font-medium text-slate-600 text-xs leading-relaxed italic">{interaction.referral.reason}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ROW 7: Follow-up */}
            {interaction.followup && interaction.followup.required && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-orange-600">Required follow-up</label>
                    <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all hover:shadow-md hover:bg-white">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="font-black text-orange-900 uppercase text-xs tracking-tighter">Next appointment recommended</span>
                        </div>
                        <span className="font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-orange-200 shadow-sm">{formatSimpleDate(interaction.followup.date)}</span>
                    </div>
                </div>
            )}

            {/* ROW 6: Interaction Notes history */}
            {interaction.savedNotes && interaction.savedNotes.length > 0 && (
                <div className="group">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-yellow-600">Interaction notes history</label>
                    <div className="bg-yellow-50/30 border border-yellow-100/50 rounded-3xl p-4 space-y-4">
                        {interaction.savedNotes.map((note, idx) => (
                            <div key={idx} className="bg-white border border-yellow-100 p-4 rounded-2xl shadow-sm relative group/note">
                                <div className="absolute top-4 left-0 w-1 h-6 bg-yellow-400 rounded-r-full group-hover/note:h-full transition-all duration-300"></div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.2em]">Medical Entry #{idx + 1}</span>
                                    <span className="text-[10px] font-bold text-slate-400">
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 transition-colors group-hover:text-slate-900">Billing & diagnostics</label>
                    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Diagnostic (Dx)</th>
                                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Service</th>
                                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right text-slate-500">Fee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium">
                                {interaction.serviceLines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-black text-blue-700">{line.diagnostic}</div>
                                            {(line.suffix || line.accountingNumber) && (
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    {line.suffix && <span className="mr-2">Suffix: {line.suffix}</span>}
                                                    {line.accountingNumber && <span>Acct: {line.accountingNumber}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 max-w-[150px] truncate">{line.service}</td>
                                        <td className="px-4 py-3 text-right font-black text-slate-900">${line.totalFee?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-100 font-black">
                                <tr>
                                    <td colSpan={2} className="px-4 py-3 text-slate-500 uppercase tracking-widest text-[10px]">Total Amount Billed</td>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Medical Reports Vault</label>
                    <span className="bg-slate-100 text-slate-500 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">{reports.length} Files</span>
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
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">No attached reports</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InteractionDataView;
