import { useState, useEffect, useMemo } from 'react';
import { renderInteractionTags } from '../utils/interactionTags';
import { stripEntityPrefix, getVisitorSerialDisplay, getReasonForVisitLabel, formatPhoneDisplay, getRegistrationDisplayId, formatTimeOnly, getInteractionStatus } from '../utils/formatUtils';
import RegisterInteractionModal from './RegisterInteractionModal';

/** Registration status for queue cards: Ongoing | Followup | New | Refill (from reasonForVisit / ongoing). */
const getRegistrationStatus = (interaction) => {
    if (interaction.ongoing || interaction.started) return { label: 'Ongoing', isNewVisit: false };
    const r = (interaction.reasonForVisit || '').trim();
    if (r === 'followup') return { label: 'Followup', isNewVisit: false };
    if (r === 'refill_medicine') return { label: 'Refill', isNewVisit: false };
    return { label: 'New', isNewVisit: true };
};

/** Last completed visit's first diagnostic code for this visitor. */
const getLastVisitDiagCode = (interaction, interactions, lastVisits) => {
    const fromBackend = lastVisits[interaction?.visitorId];
    if (fromBackend?.serviceLines?.[0]?.diagnostic) {
        const code = String(fromBackend.serviceLines[0].diagnostic).trim();
        if (code) return code;
    }
    const past = interactions
        .filter(i => i.visitorId === interaction.visitorId && i.completed && i.id !== interaction.id)
        .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt))[0];
    const code = past?.serviceLines?.[0]?.diagnostic;
    return (code && String(code).trim()) ? String(code).trim() : '—';
};

/** Minutes waiting since registration (createdAt). */
const getMinutesWaiting = (createdAt, now) => {
    if (!createdAt) return '—';
    const ms = now - new Date(createdAt).getTime();
    if (ms < 0) return '0';
    return String(Math.floor(ms / 60000));
};

const InteractionsSection = ({
    interactions,
    lastVisits = {},
    officers,
    userData,
    isLoadingInteractions = false,
    draggedOverOfficer,
    draggedOverUnassigned,
    setDraggedOverUnassigned,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleAssignToOfficer,
    onOpenQueueModal,
    handlePatientDrop,
    handleRegistrationDropOnBin,
    onRequestDelete,
    onRequestCancel,
    showDeleteRegistrationModal,
    setShowDeleteRegistrationModal,
    registrationToDelete,
    handleDeleteRegistration,
    showCancelRegistrationModal,
    setShowCancelRegistrationModal,
    registrationToCancel,
    handleCancelRegistration,
    isCancellingRegistration,
    getVisitorName,
    getVisitorSerial,
    getVisitorHealthCard,
    formatDate,
    isDeletingRegistration,
    isCreatingInteraction,
    isAssigningInteraction,
    pendingInteractions,
    pendingAssignments,
    assignmentFailed = {},
    handleDragEnd,
    draggedInteraction,
    onInteractionClick,
    visitors = [],
    handleRegisterPatient,
    onPatientClick,
    registrationCount
}) => {
    const [draggedOverDelete, setDraggedOverDelete] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const activeOfficers = officers.filter(o => o.active !== 'false' && (!o.deletedAt || o.deletedAt === ''));
    const [selectedOfficerId, setSelectedOfficerId] = useState(null);
    const selectedOfficer = activeOfficers.find(o => o.id === selectedOfficerId) || activeOfficers[0];

    useEffect(() => {
        if (activeOfficers.length > 0 && (!selectedOfficerId || !activeOfficers.find(o => o.id === selectedOfficerId))) {
            setSelectedOfficerId(activeOfficers[0].id);
        }
    }, [activeOfficers, selectedOfficerId]);

    const [tick, setTick] = useState(() => Date.now());
    useEffect(() => {
        const interval = setInterval(() => setTick(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    /** Queue order: oldest first (ascending by queuedAt/createdAt). Serial 1 = oldest in queue. */
    const officerQueueSortedByQueuedAt = useMemo(
        () =>
            selectedOfficer
                ? interactions
                    .filter(i => getInteractionStatus(i) === 'queued' && i.officerId === selectedOfficer.id && !(i.id in pendingAssignments))
                    .sort((a, b) => new Date(a.queuedAt || a.createdAt || 0) - new Date(b.queuedAt || b.createdAt || 0))
                : [],
        [interactions, selectedOfficer, pendingAssignments]
    );

    const avgConsultationMs = useMemo(() => {
        const completed = interactions.filter(i => i.completed && i.startedAt && i.completedAt);
        if (completed.length === 0) return 15 * 60 * 1000;
        const total = completed.reduce((sum, i) => sum + (new Date(i.completedAt).getTime() - new Date(i.startedAt).getTime()), 0);
        return total / completed.length;
    }, [interactions]);

    const getExpectedTurnTime = (interactionId) => {
        const pos = officerQueueSortedByQueuedAt.findIndex(i => i.id === interactionId);
        if (pos < 0) return '—';
        return formatTimeOnly(tick + pos * avgConsultationMs);
    };



    return (
        <div className="flex flex-col flex-1 min-h-0 h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-hidden">
            <div className="shrink-0 p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Registrations</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {(() => {
                            const count = typeof registrationCount === 'number' ? registrationCount : interactions.length;
                            return `Manage and assign registrations to doctors${count > 0 ? ` (${count} registration${count !== 1 ? 's' : ''})` : ''}`;
                        })()}
                    </p>
                </div>
                <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors w-full sm:w-auto"
                >
                    Register Patient
                </button>
            </div>

            {/* Drag and Drop Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 p-4 sm:p-6">
                {/* Left Side - Unassigned Interactions */}
                <div className="flex-[3] flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm font-semibold text-slate-700">Unassigned Registrations</h3>
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDraggedOverDelete(true);
                            }}
                            onDragLeave={() => setDraggedOverDelete(false)}
                            onDrop={(e) => {
                                setDraggedOverDelete(false);
                                handleRegistrationDropOnBin(e);
                            }}
                            className={`p-2 rounded-lg transition-all cursor-pointer min-w-[60px] min-h-[50px] flex items-center justify-center ${draggedOverDelete
                                ? 'bg-red-100 border-2 border-red-500 bg-opacity-90 shadow-lg scale-110'
                                : 'bg-red-50 hover:bg-red-100 border-2 border-red-200'
                                }`}
                            title="Drop registration here to unregister"
                        >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                        {interactions.filter(i => !i.cancelled && (!i.officerId || i.officerId === '') && !pendingInteractions.find(p => p.id === i.id && p.isPending) && !(i.id in pendingAssignments)).length} in operations
                    </p>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer) {
                                e.dataTransfer.dropEffect = 'move';
                            }
                            setDraggedOverUnassigned(true);
                        }}
                        onDragLeave={() => setDraggedOverUnassigned(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDraggedOverUnassigned(false);
                            handleDrop(e, null);
                        }}
                        className={`grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 p-3 rounded-xl transition-colors flex-1 min-h-0 overflow-y-auto scrollbar-hide ${draggedOverUnassigned ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50'
                            }`}
                    >
                        {isLoadingInteractions ? (
                            <div className="col-span-full flex flex-1 min-h-[200px] items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span className="text-sm font-medium text-slate-500">Loading registrations…</span>
                                </div>
                            </div>
                        ) : (
                        <>
                        {/* Show existing interactions + optimistic unassigned (being moved from doctor) */}
                        {interactions
                            .filter(i => {
                                if (i.cancelled) return false;
                                if (pendingInteractions.find(p => p.id === i.id && p.isPending)) return false;
                                // Being moved to an officer – show in officer column only
                                if (i.id in pendingAssignments && pendingAssignments[i.id] !== '' && pendingAssignments[i.id] != null) return false;
                                if ((!i.officerId || i.officerId === '')) return true;
                                if (pendingAssignments[i.id] === '' || pendingAssignments[i.id] === null) return true; // being unassigned
                                return false;
                            })
                            .map((interaction) => {
                                const canDrag = (userData?.role === 'receptionist' || userData?.role === 'officer') && !interaction.started && !interaction.completed && !interaction.closed;
                                const isBeingDeleted = draggedOverDelete && draggedInteraction?.id === interaction.id;
                                const isBeingUnassigned = (pendingAssignments[interaction.id] === '' || pendingAssignments[interaction.id] === null);
                                const isFailed = assignmentFailed[interaction.id];

                                // Calculate Last Visit (prefer backend lastVisits so it's correct regardless of time filter)
                                const fromBackend = lastVisits[interaction.visitorId];
                                const lastVisitDisplay = fromBackend
                                    ? formatDate(fromBackend.editedAt || fromBackend.createdAt, true)
                                    : (() => {
                                        const patientHistory = interactions
                                            .filter(past => past.visitorId === interaction.visitorId && past.completed && past.id !== interaction.id)
                                            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
                                        return patientHistory.length > 0
                                            ? formatDate(patientHistory[0].editedAt || patientHistory[0].createdAt, true)
                                            : 'New Patient';
                                    })();

                                const status = getRegistrationStatus(interaction);
                                const visitor = visitors.find(v => v.id === interaction.visitorId);
                                const diagCode = getLastVisitDiagCode(interaction, interactions, lastVisits);
                                const minsWaiting = getMinutesWaiting(interaction.createdAt, tick);

                                return (
                                    <div
                                        key={interaction.id}
                                        draggable={canDrag}
                                        onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                        onDragEnd={(e) => {
                                            handleDragEnd(e);
                                            setDraggedOverDelete(false);
                                        }}
                                        className={`group/card relative bg-white border border-slate-200 rounded-lg p-2.5 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5 hover:border-blue-400 flex flex-col justify-between h-fit overflow-visible min-w-0 cursor-default ${isBeingDeleted ? 'ring-2 ring-red-500 bg-red-50' : isFailed ? 'ring-2 ring-red-500 bg-red-100 border-red-300 shadow-lg shadow-red-200/50' : ''}`}
                                    >
                                        <div className="relative flex flex-col h-full gap-1 min-w-0 overflow-visible">
                                            {isBeingUnassigned && (
                                                <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg transition-colors duration-200 ${isFailed ? 'bg-red-100/95' : 'bg-white/90 backdrop-blur-sm'}`}>
                                                    {isFailed ? (
                                                        <>
                                                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-sm font-semibold text-red-700">Failed – reverting</span>
                                                        </>
                                                    ) : (
                                                        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-start gap-1 min-w-0 flex-nowrap">
                                                <div className="flex flex-col gap-0.5 shrink-0">
                                                    <span className="inline-flex items-center justify-center min-w-[2rem] text-xs font-semibold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-100 normal-case tracking-wide w-fit">
                                                        {getRegistrationDisplayId(interaction)}
                                                    </span>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border normal-case w-fit ${interaction.visitMode === 'on_phone' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                        {interaction.visitMode === 'on_phone' ? 'Phone consult' : 'Physical'}
                                                    </span>
                                                </div>
                                                <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border normal-case whitespace-nowrap ${status.label === 'Ongoing' ? 'bg-blue-50 text-blue-600 border-blue-100' : status.label === 'Followup' ? 'bg-teal-50 text-teal-600 border-teal-100' : status.label === 'Refill' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                    {status.label}
                                                </span>
                                                <div className="flex items-center gap-0.5 shrink-0 min-w-[4.5rem] justify-end" aria-label="Card actions">
                                                    {canDrag && onOpenQueueModal && (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); onOpenQueueModal(interaction); }} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100" title="Queue (assign to doctor)">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16m4-6l4 4 4-4" /></svg>
                                                        </button>
                                                    )}
                                                    {canDrag && onRequestCancel && (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); onRequestCancel(interaction); }} className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100" title="Cancel registration">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                    {canDrag && (
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); onRequestDelete?.(interaction); }} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100" title="Unregister">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    )}
                                                    {canDrag && <div className="opacity-0 group-hover/card:opacity-100"><svg className="w-3.5 h-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg></div>}
                                                </div>
                                            </div>
                                            {status.isNewVisit && (interaction.reasonForVisitNotes || '').trim() && (
                                                <p className="text-[10px] text-slate-600 leading-tight line-clamp-2 pr-1">{interaction.reasonForVisitNotes.trim()}</p>
                                            )}
                                            <div className="text-sm font-bold text-slate-900 truncate normal-case leading-tight">
                                                {getVisitorName(interaction.visitorId)}
                                            </div>
                                            <div className="flex flex-col gap-0.5 text-[10px] text-slate-900">
                                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 truncate">
                                                    <span className="text-slate-500 shrink-0">Phone</span><span className="font-medium truncate">{formatPhoneDisplay(visitor?.phoneM || visitor?.phone) || '—'}</span>
                                                    <span className="text-slate-400 shrink-0">·</span>
                                                    <span className="text-slate-500 shrink-0">Estimated turn</span><span className="font-medium">—</span>
                                                    <span className="text-slate-400 shrink-0">·</span>
                                                    <span className="text-slate-500 shrink-0">Date</span><span className="font-medium truncate">{formatDate(interaction.createdAt, true)}</span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 truncate">
                                                    <span className="text-slate-500 shrink-0">Wait</span><span className="font-medium">{minsWaiting === '—' ? '—' : `${minsWaiting} min`}</span>
                                                    <span className="text-slate-400 shrink-0">·</span>
                                                    <span className="text-slate-500 shrink-0">Last</span><span className={`font-medium truncate ${lastVisitDisplay === 'New Patient' ? 'text-emerald-600' : ''}`}>{lastVisitDisplay}</span>
                                                    <span className="text-slate-400 shrink-0">·</span>
                                                    <span className="text-slate-500 shrink-0">Diag</span><span className="font-medium truncate">{diagCode}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        {/* Show pending interactions (optimistic UI) at the end */}
                        {pendingInteractions
                            .filter(i => i.isPending)
                            .map((interaction) => {
                                const visitor = interaction._visitor;
                                return (
                                    <div
                                        key={interaction.id}
                                        className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-sm aspect-square flex flex-col justify-center items-center"
                                    >
                                        <svg className="animate-spin h-6 w-6 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {visitor && (
                                            <>
                                                <div className="text-sm font-medium text-slate-900 mb-1 text-center">
                                                    {visitor.firstName} {visitor.middleName ? visitor.middleName + ' ' : ''}{visitor.lastName}
                                                </div>
                                                <div className="text-xs text-slate-600 mb-2 text-center">
                                                    {getVisitorSerialDisplay(visitor)}
                                                </div>
                                            </>
                                        )}
                                        <div className="text-xs text-slate-500 text-center">Creating...</div>
                                    </div>
                                );
                            })}
                        {interactions.filter(i => !i.cancelled && (!i.officerId || i.officerId === '')).length === 0 && pendingInteractions.filter(i => i.isPending).length === 0 && (
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-8 text-slate-400 text-sm">
                                No unassigned registrations
                            </div>
                        )}
                        </>
                        )}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-slate-200 hidden lg:block"></div>

                {/* Right Side - Officers (Columns) */}
                <div className="flex-[1] flex flex-col min-w-0 min-h-0 lg:max-w-[400px]">
                    <div className="flex items-center justify-between gap-2 mb-1 shrink-0">
                        <h3 className="text-sm font-semibold text-slate-700">Doctors</h3>
                        {activeOfficers.length > 0 && (
                            <div className="flex gap-0.5 p-0.5 rounded-lg bg-slate-100 border border-slate-200">
                                {activeOfficers.map((o) => (
                                    <button
                                        key={o.id}
                                        type="button"
                                        onClick={() => setSelectedOfficerId(o.id)}
                                        className={`min-w-0 px-2 py-1 rounded text-xs font-medium transition-all ${selectedOfficerId === o.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                                    >
                                        {o.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3 shrink-0">
                        {selectedOfficer ? interactions.filter(i => getInteractionStatus(i) === 'queued' && i.officerId === selectedOfficer.id && !(i.id in pendingAssignments)).length + (Object.values(pendingAssignments).filter(id => id === selectedOfficer?.id).length || 0) : 0} in scheduled registrations
                    </p>
                    <div className="flex flex-col flex-1 min-h-0">
                        {selectedOfficer ? (
                                <div
                                    key={selectedOfficer.id}
                                    onDragOver={(e) => handleDragOver(e, selectedOfficer)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, selectedOfficer)}
                                    className={`bg-gradient-to-br from-slate-50 to-slate-100 border-2 rounded-xl p-4 flex-1 flex flex-col min-h-0 transition-all ${draggedOverOfficer === selectedOfficer.id
                                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105'
                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm shrink-0">
                                        <div className="font-semibold text-slate-900 text-sm mb-1">
                                            {selectedOfficer.name}
                                        </div>
                                        <div className="text-xs text-slate-600">
                                            ID: {selectedOfficer.serial}
                                        </div>
                                    </div>

                                    {/* Assigned Interactions for this officer - overflow inside, no scrollbar */}
                                    <div className="space-y-2 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                                        {isLoadingInteractions ? (
                                            <div className="flex flex-1 min-h-[200px] items-center justify-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    <span className="text-sm font-medium text-slate-500">Loading…</span>
                                                </div>
                                            </div>
                                        ) : (
                                        <>
                                        {/* Show pending assignments (optimistic UI) */}
                                        {Object.entries(pendingAssignments)
                                            .filter(([interactionId, targetOfficerId]) => targetOfficerId === selectedOfficer.id)
                                            .map(([interactionId]) => {
                                                const interaction = interactions.find(i => i.id === interactionId);
                                                if (!interaction) return null;
                                                return (
                                                    <div
                                                        key={`pending-${interactionId}`}
                                                        className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-sm flex items-center justify-center"
                                                    >
                                                        <svg className="animate-spin h-4 w-4 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span className="text-slate-500">Assigning...</span>
                                                    </div>
                                                );
                                            })}
                                        {interactions
                                            .filter(i => getInteractionStatus(i) === 'queued' && i.officerId === selectedOfficer.id && !(i.id in pendingAssignments))
                                            .sort((a, b) => new Date(a.queuedAt || a.createdAt || 0) - new Date(b.queuedAt || b.createdAt || 0))
                                            .map((interaction, queueIndex) => {
                                                const canDrag = (userData?.role === 'receptionist' || userData?.role === 'officer') && !interaction.started && !interaction.completed && !interaction.closed;
                                                const visitor = visitors.find(v => v.id === interaction.visitorId);
                                                const status = getRegistrationStatus(interaction);
                                                const fromBackend = lastVisits[interaction.visitorId];
                                                const lastVisitDisplay = fromBackend
                                                    ? formatDate(fromBackend.editedAt || fromBackend.createdAt, true)
                                                    : (() => {
                                                        const patientHistory = interactions
                                                            .filter(past => past.visitorId === interaction.visitorId && past.completed && past.id !== interaction.id)
                                                            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
                                                        return patientHistory.length > 0
                                                            ? formatDate(patientHistory[0].editedAt || patientHistory[0].createdAt, true)
                                                            : 'New Patient';
                                                    })();
                                                const diagCode = getLastVisitDiagCode(interaction, interactions, lastVisits);
                                                const minsWaiting = getMinutesWaiting(interaction.createdAt, tick);
                                                const queuePosition = queueIndex + 1;
                                                return (
                                                    <div
                                                        key={interaction.id}
                                                        draggable={canDrag}
                                                        onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                                        className={`group/item relative bg-white border border-slate-100 rounded-lg p-2.5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md flex flex-col min-w-0 ${canDrag ? 'cursor-move' : 'cursor-default'}`}
                                                    >
                                                        <div className="flex justify-between items-start gap-1 min-w-0">
                                                            <div className="flex flex-col gap-0.5 shrink-0">
                                                                <span className="inline-flex items-center justify-center min-w-[2rem] text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 normal-case w-fit">
                                                                    {queuePosition}
                                                                </span>
                                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border normal-case w-fit ${interaction.visitMode === 'on_phone' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                    {interaction.visitMode === 'on_phone' ? 'Phone consult' : 'Physical'}
                                                                </span>
                                                            </div>
                                                            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border normal-case ${status.label === 'Ongoing' ? 'bg-blue-50 text-blue-600 border-blue-100' : status.label === 'Followup' ? 'bg-teal-50 text-teal-600 border-teal-100' : status.label === 'Refill' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                                                {status.label}
                                                            </span>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                {canDrag && onRequestCancel && (
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); onRequestCancel(interaction); }} className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Cancel registration">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                )}
                                                                {canDrag && (
                                                                    <svg className="w-3 h-3 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {status.isNewVisit && (interaction.reasonForVisitNotes || '').trim() && (
                                                            <p className="text-[10px] text-slate-600 leading-tight line-clamp-2 mt-0.5">{interaction.reasonForVisitNotes.trim()}</p>
                                                        )}
                                                        <div className="text-xs font-bold text-slate-900 truncate normal-case leading-tight mt-0.5">
                                                            {getVisitorName(interaction.visitorId)}
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 text-[10px] text-slate-900 mt-1">
                                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 truncate">
                                                                <span className="text-slate-500 shrink-0">Phone</span><span className="font-medium truncate">{formatPhoneDisplay(visitor?.phoneM || visitor?.phone) || '—'}</span>
                                                                <span className="text-slate-400 shrink-0">·</span>
                                                                <span className="text-slate-500 shrink-0">Estimated turn</span><span className="font-medium">{getExpectedTurnTime(interaction.id)}</span>
                                                                <span className="text-slate-400 shrink-0">·</span>
                                                                <span className="text-slate-500 shrink-0">Date</span><span className="font-medium truncate">{formatDate(interaction.createdAt, true)}</span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 truncate">
                                                                <span className="text-slate-500 shrink-0">Wait</span><span className="font-medium">{minsWaiting === '—' ? '—' : `${minsWaiting} min`}</span>
                                                                <span className="text-slate-400 shrink-0">·</span>
                                                                <span className="text-slate-500 shrink-0">Last</span><span className={`font-medium truncate ${lastVisitDisplay === 'New Patient' ? 'text-emerald-600' : ''}`}>{lastVisitDisplay}</span>
                                                                <span className="text-slate-400 shrink-0">·</span>
                                                                <span className="text-slate-500 shrink-0">Diag</span><span className="font-medium truncate">{diagCode}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {interactions.filter(i => getInteractionStatus(i) === 'queued' && i.officerId === selectedOfficer.id && !(i.id in pendingAssignments)).length === 0 && !Object.values(pendingAssignments).some(id => id === selectedOfficer.id) && (
                                            <div className="text-xs text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                                                Drop registrations here
                                            </div>
                                        )}
                                        </>
                                        )}
                                    </div>
                                </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No officers available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Register Interaction Modal */}
            <RegisterInteractionModal
                key={showRegisterModal ? 'open' : 'closed'}
                isOpen={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                visitors={visitors}
                interactions={interactions}
                lastVisits={lastVisits}
                getVisitorName={getVisitorName}
                getVisitorSerial={getVisitorSerial}
                getVisitorHealthCard={getVisitorHealthCard}
                formatDate={formatDate}
                handleRegisterPatient={handleRegisterPatient}
                isCreatingInteraction={isCreatingInteraction}
                onPatientClick={onPatientClick}
            />

            {/* Unregister Registration Confirmation Modal */}
            {showDeleteRegistrationModal && registrationToDelete && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[1000]" onClick={() => setShowDeleteRegistrationModal(false)}>
                    <div className="bg-white w-full max-w-[400px] p-4 sm:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Unregister</h2>
                        <p className="text-slate-600 mb-6">
                            Do you want to unregister this registration? The registration will be removed from the queue.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowDeleteRegistrationModal(false);
                                    setRegistrationToDelete(null);
                                }}
                                className="flex-1 py-3 px-4 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                            >
                                No
                            </button>
                            <button
                                onClick={handleDeleteRegistration}
                                disabled={isDeletingRegistration}
                                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isDeletingRegistration ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Unregistering...
                                    </>
                                ) : (
                                    'Yes, unregister'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Registration Confirmation Modal */}
            {showCancelRegistrationModal && registrationToCancel && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[1000]" onClick={() => setShowCancelRegistrationModal(false)}>
                    <div className="bg-white w-full max-w-[400px] p-4 sm:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Cancel registration</h2>
                        <p className="text-slate-600 mb-6">
                            Cancel this registration? It will be marked as cancelled and moved to the Cancelled list. You can still view it under Interactions → Cancelled.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowCancelRegistrationModal(false);
                                    setRegistrationToCancel(null);
                                }}
                                className="flex-1 py-3 px-4 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                            >
                                No
                            </button>
                            <button
                                onClick={handleCancelRegistration}
                                disabled={isCancellingRegistration}
                                className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCancellingRegistration ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, cancel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractionsSection;
