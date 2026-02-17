import React from 'react';
import InteractionDataView from './InteractionDataView';
import { renderInteractionTags } from '../utils/interactionTags';
import { stripEntityPrefix, getRegistrationDisplayId } from '../utils/formatUtils';

const InteractionDetailsModal = ({
    interaction,
    onClose,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    getImageUrl,
    setViewingMedia,
    patientReports = [],
    officers = [],
    onOpenQueueModal
}) => {
    if (!interaction) return null;

    return (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 pb-4 pt-0 !mt-0 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold normal-case tracking-widest leading-none">
                                {getRegistrationDisplayId(interaction)}
                            </span>
                            <h3 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                                Interaction Details
                                {(interaction.editCount ?? 0) > 0 && (
                                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Edited</span>
                                )}
                            </h3>
                            {renderInteractionTags(interaction, { size: 'text-xs' })}
                        </div>
                        <p className="text-xl font-bold text-slate-900 tracking-tight">
                            {getVisitorName(interaction.visitorId)}
                        </p>
                        <div className="flex items-center gap-6 text-xs font-semibold normal-case tracking-widest text-slate-500 mt-1">
                            <span>Started: {formatDate(interaction.createdAt)}</span>
                            {interaction.completed && (
                                <span>Completed: {formatDate(interaction.completedAt || interaction.editedAt || interaction.createdAt)}</span>
                            )}
                            {(interaction.editCount ?? 0) > 0 && interaction.editedAt && (
                                <span>Edited: {formatDate(interaction.editedAt)}</span>
                            )}
                            {interaction.closed && interaction.billedAt && (
                                <span>Closed: {formatDate(interaction.billedAt)}</span>
                            )}
                            {interaction.ongoing && !interaction.completed && (
                                <span className="text-orange-500">Currently Active</span>
                            )}
                            {interaction.incomplete && !interaction.completed && (
                                <span className="text-slate-500">Saved as Incomplete</span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <InteractionDataView
                        interaction={interaction}
                        getImageUrl={getImageUrl}
                        setViewingMedia={setViewingMedia}
                        patientReports={patientReports}
                        isExpanded={true}
                    />
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-3 flex-wrap">
                    {!interaction.officerId && !interaction.completed && !interaction.closed && onOpenQueueModal && (
                        <button
                            type="button"
                            onClick={() => onOpenQueueModal(interaction)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16m4-6l4 4 4-4" />
                            </svg>
                            Queue
                        </button>
                    )}
                    {interaction.ongoing && (
                        <div className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-200 normal-case tracking-widest items-center gap-2 hidden md:flex">
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
