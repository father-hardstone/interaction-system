import React, { useState, useEffect } from 'react';
import ReportDetailsModal from './ReportDetailsModal';
import supabaseStorageService from '../services/supabaseService';
import { formatDateMMDDYYYY, getShortInteractionId, formatAccountingNumber } from '../utils/formatUtils';

const PastInteractionsSidebar = ({
    activePatientVisitorId,
    interactions,
    activeInteractionId,
    patientReports,
    onCloseOverlay,
    onInteractionClick,
    isOverlay = false
}) => {
    const [reportUrls, setReportUrls] = useState({});
    const [viewingReport, setViewingReport] = useState(null);

    useEffect(() => {
        const fetchUrls = async () => {
            const urls = {};
            for (const report of patientReports || []) {
                if (report.fileMetadata?.supabasePath) {
                    try {
                        const url = await supabaseStorageService.getFileUrl('CRM testing', report.fileMetadata.supabasePath);
                        urls[report.fileMetadata.supabasePath] = url;
                    } catch (e) {
                        console.error('Error fetching report URL:', e);
                    }
                }
            }
            if (Object.keys(urls).length > 0) setReportUrls(urls);
        };
        if (patientReports?.length) fetchUrls();
    }, [patientReports]);

    const getReportUrl = (report) => {
        if (!report?.fileMetadata) return null;
        if (report.fileMetadata.supabasePath && reportUrls[report.fileMetadata.supabasePath]) {
            return reportUrls[report.fileMetadata.supabasePath];
        }
        return null;
    };

    const pastInteractions = interactions
        .filter(i => i.visitorId === activePatientVisitorId && i.id !== activeInteractionId && i.completed)
        .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));

    return (
        <aside className="w-full xl:w-[307px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <h3 className="text-sm font-semibold text-slate-800 normal-case tracking-wide">Patient History</h3>
                {isOverlay && onCloseOverlay && (
                    <button
                        type="button"
                        onClick={onCloseOverlay}
                        className="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-600"
                        title="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-4 p-4 overflow-hidden">
                {/* Past Interactions section - fixed height, internal scroll */}
                <div className="flex-1 min-h-0 flex flex-col shrink-0">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 shrink-0">Past Interactions</h4>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                        {pastInteractions.length === 0 ? (
                            <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                <span className="text-xs text-slate-400 font-medium">No past interactions</span>
                                <p className="text-xs text-slate-400 mt-1 italic">First visit</p>
                            </div>
                        ) : (
                            pastInteractions.map((interaction) => {
                                const date = new Date(interaction.editedAt || interaction.createdAt);
                                const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
                                const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                const diag = interaction.serviceLines?.[0]?.diagnostic || 'No Dx';
                                const diagShort = diag.split(' - ')[0];
                                const acct = interaction.serviceLines?.[0]?.accountingNumber;
                                const billingCode = acct ? formatAccountingNumber(acct) : '-';

                                return (
                                    <button
                                        key={interaction.id}
                                        type="button"
                                        onClick={() => onInteractionClick?.(interaction)}
                                        className="w-full text-left p-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                                                {getShortInteractionId(interaction.interactionSerial)}
                                            </span>
                                            <span className="text-base font-bold text-slate-900 shrink-0">
                                                {dateStr} {timeStr}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Diagnosis</div>
                                                <div className="font-medium text-slate-800 truncate" title={diagShort}>{diagShort}</div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Billing Code</div>
                                                <div className="font-medium text-slate-800 font-mono">{billingCode}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Reports section - fixed height, internal scroll */}
                <div className="flex-1 min-h-0 flex flex-col shrink-0">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 shrink-0">Reports</h4>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                        {!patientReports?.length ? (
                            <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <span className="text-xs text-slate-400 font-medium">No reports for this patient</span>
                            </div>
                        ) : (
                            patientReports.map((report) => {
                                const reportUrl = getReportUrl(report);
                                const isPdf = report.fileMetadata?.mimeType?.startsWith('application/pdf');
                                const linkedInteraction = report.interactionId && interactions?.find((i) => i.id === report.interactionId);
                                return (
                                    <button
                                        key={report.id}
                                        type="button"
                                        onClick={() => reportUrl && setViewingReport(report)}
                                        disabled={!reportUrl}
                                        className="w-full text-left bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-slate-200 hover:border-slate-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold text-blue-600 truncate">
                                                {(report.reportType || '').replace(/_/g, ' ')}
                                            </div>
                                            <div className="text-xs font-semibold text-slate-600 mt-0.5">
                                                {formatDateMMDDYYYY(report.procedureDate) || report.labMetadata?.labName || 'Report'}
                                            </div>
                                            {linkedInteraction && (
                                                <div className="text-xs text-emerald-600 mt-0.5">
                                                    {getShortInteractionId(linkedInteraction.interactionSerial)}
                                                </div>
                                            )}
                                        </div>
                                        {isPdf ? (
                                            <svg className="w-5 h-5 text-red-500 shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 18V2h12l4 4v12H4zm14-11h-4V3.1L17.9 7zM6 4h7v4h4v8H6V4z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-slate-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {viewingReport && (
                <ReportDetailsModal
                    report={viewingReport}
                    reportUrl={getReportUrl(viewingReport)}
                    interactions={interactions}
                    onClose={() => setViewingReport(null)}
                />
            )}
        </aside>
    );
};

export default PastInteractionsSidebar;
