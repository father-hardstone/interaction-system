import React from 'react';
import InteractionDataView from './InteractionDataView';
import { renderInteractionTags } from '../utils/interactionTags';

const PastInteractionsSidebar = ({
    ongoingInteractions,
    activePatientVisitorId,
    getVisitorName,
    getVisitorSerial,
    interactions,
    activeInteractionId,
    expandedInteractionIds,
    setExpandedInteractionIds,
    diagnostics,
    getImageUrl,
    setViewingMedia,
    patientReports,
    handleOpenPatientDetails
}) => {
    const pastInteractions = interactions
        .filter(i => i.visitorId === activePatientVisitorId && i.id !== activeInteractionId && i.completed)
        .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));

    return (
        <aside className="w-full xl:w-96 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Patient History</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Total: {pastInteractions.length} Sessions</p>
                </div>
                <div className="bg-blue-100 p-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {pastInteractions.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Past Records</h4>
                        <p className="text-[10px] text-slate-400 mt-2 italic">This is the patient's first recorded interaction.</p>
                    </div>
                ) : (
                    pastInteractions.map((interaction) => {
                        const date = new Date(interaction.editedAt || interaction.createdAt);
                        const isExpanded = expandedInteractionIds[interaction.id];
                        const diagCode = interaction.serviceLines?.[0]?.diagnostic || 'No Dx';

                        return (
                            <div
                                key={interaction.id}
                                className={`border border-slate-100 rounded-xl overflow-hidden transition-all duration-300 group ${isExpanded ? 'shadow-md ring-2 ring-blue-500/20 border-blue-200' : 'hover:shadow-sm hover:border-slate-200'}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedInteractionIds(prev => ({ ...prev, [interaction.id]: !isExpanded }))}
                                    className="w-full text-left p-4 focus:outline-none"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col flex-1">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                                                {String(date.getMonth() + 1).padStart(2, '0')}-{String(date.getDate()).padStart(2, '0')}-{date.getFullYear()}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900">
                                                {interaction.interactionSerial || 'REG-N/A'}
                                            </span>
                                            <div className="flex items-center gap-1 flex-wrap mt-1">
                                                {renderInteractionTags(interaction, { size: 'text-[8px]' })}
                                            </div>
                                        </div>
                                        <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                            <svg className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                            Dx: {diagCode.split(' - ')[0]}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400">
                                            {interaction.serviceLines?.[0]?.service || ''}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-4 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="h-px bg-slate-100 -mx-4 mb-5"></div>
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
                    })
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                <button
                    onClick={() => handleOpenPatientDetails(activePatientVisitorId)}
                    className="w-full py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Full Patient Profile
                </button>
            </div>
        </aside>
    );
};

export default PastInteractionsSidebar;
