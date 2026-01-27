import React from 'react';
import InteractionDataView from './InteractionDataView';
import { renderInteractionTags } from '../utils/interactionTags';

const InteractionDetailsModal = ({
    interaction,
    onClose,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    getImageUrl,
    setViewingMedia,
    patientReports = []
}) => {
    if (!interaction) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Interaction Session
                                </h3>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                                    {interaction.interactionSerial || 'REG-PENDING'}
                                </span>
                                {renderInteractionTags(interaction, { size: 'text-[9px]' })}
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                                {getVisitorName(interaction.visitorId)} · {getVisitorSerial(interaction.visitorId)}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="mb-8 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>Started: {formatDate(interaction.createdAt)}</span>
                        </div>
                        {interaction.completed && (
                            <div className="flex items-center gap-2 text-emerald-500">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span>Completed: {formatDate(interaction.editedAt || interaction.createdAt)}</span>
                            </div>
                        )}
                        {!interaction.completed && interaction.ongoing && (
                            <div className="flex items-center gap-2 text-orange-500 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                <span>Currently Active</span>
                            </div>
                        )}
                        {interaction.incomplete && !interaction.completed && (
                            <div className="flex items-center gap-2 text-slate-500">
                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                <span>Saved as Incomplete</span>
                            </div>
                        )}
                    </div>

                    <InteractionDataView
                        interaction={interaction}
                        getImageUrl={getImageUrl}
                        setViewingMedia={setViewingMedia}
                        patientReports={patientReports}
                        isExpanded={true}
                    />
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        Close View
                    </button>
                    {interaction.ongoing && (
                        <div className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-200 uppercase tracking-widest items-center gap-2 hidden md:flex">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            In-Progress
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}} />
        </div>
    );
};

export default InteractionDetailsModal;
