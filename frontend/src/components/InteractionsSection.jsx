import { useState, useEffect } from 'react';
import { renderInteractionTags } from '../utils/interactionTags';
import { stripEntityPrefix, getVisitorSerialDisplay } from '../utils/formatUtils';
import RegisterInteractionModal from './RegisterInteractionModal';

const InteractionsSection = ({
    interactions,
    officers,
    userData,
    draggedOverOfficer,
    draggedOverUnassigned,
    setDraggedOverUnassigned,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePatientDrop,
    handleRegistrationDropOnBin,
    onRequestDelete,
    showDeleteRegistrationModal,
    setShowDeleteRegistrationModal,
    registrationToDelete,
    handleDeleteRegistration,
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
    onPatientClick
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



    return (
        <div className="flex flex-col flex-1 min-h-0 h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-hidden">
            <div className="shrink-0 p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Registrations</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage and assign registrations to doctors {interactions.length > 0 && `(${interactions.length} registration${interactions.length !== 1 ? 's' : ''})`}
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
                    <div className="flex justify-between items-center mb-4">
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
                            title="Drop registration here to delete"
                        >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
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
                        className={`grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2 p-3 rounded-xl transition-colors flex-1 min-h-0 overflow-y-auto scrollbar-hide ${draggedOverUnassigned ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50'
                            }`}
                    >
                        {/* Show existing interactions + optimistic unassigned (being moved from doctor) */}
                        {interactions
                            .filter(i => {
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

                                // Calculate Last Visit
                                const patientHistory = interactions
                                    .filter(past => past.visitorId === interaction.visitorId && past.completed && past.id !== interaction.id)
                                    .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));

                                const lastVisitDisplay = patientHistory.length > 0
                                    ? formatDate(patientHistory[0].editedAt || patientHistory[0].createdAt, true)
                                    : 'New Patient';

                                return (
                                    <div
                                        key={interaction.id}
                                        draggable={canDrag}
                                        onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                        onDragEnd={(e) => {
                                            handleDragEnd(e);
                                            setDraggedOverDelete(false);
                                        }}
                                        onClick={() => onInteractionClick(interaction)}
                                        className={`group/card relative bg-white border border-slate-200 rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:shadow-blue-500/5 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between h-fit overflow-hidden max-w-[220px] ${isBeingDeleted ? 'ring-2 ring-red-500 bg-red-50' : isFailed ? 'ring-2 ring-red-500 bg-red-100 border-red-300 shadow-lg shadow-red-200/50' : 'hover:border-blue-400'}`}
                                    >
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/20 rounded-full -mr-6 -mt-6 transition-transform group-hover/card:scale-110"></div>

                                        <div className="relative flex flex-col h-full gap-1.5">
                                            {isBeingUnassigned && (
                                                <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl transition-colors duration-200 ${isFailed ? 'bg-red-100/95' : 'bg-white/90 backdrop-blur-sm'}`}>
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
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 normal-case tracking-wide">
                                                    {stripEntityPrefix(interaction.interactionSerial)}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {canDrag && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRequestDelete?.(interaction);
                                                            }}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
                                                            title="Delete registration"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDrag && (
                                                        <div className="opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                            <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-xl font-bold text-slate-900 truncate normal-case leading-tight">
                                                {getVisitorName(interaction.visitorId)}
                                            </div>

                                            <div className="flex flex-col gap-2 text-sm">
                                                <div>
                                                    <span className="text-xs font-semibold text-slate-400 normal-case block mb-0.5">Health Card</span>
                                                    <span className="font-semibold text-slate-700 font-sans tracking-wider">
                                                        {getVisitorHealthCard(interaction.visitorId)}
                                                        {(visitors.find(v => v.id === interaction.visitorId)?.healthCardVersion || '').trim()
                                                            ? ` (${(visitors.find(v => v.id === interaction.visitorId)?.healthCardVersion || '').toUpperCase()})`
                                                            : ''}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-semibold text-slate-400 normal-case block mb-0.5">Registration Time</span>
                                                    <span className="font-semibold text-slate-700">{formatDate(interaction.createdAt, true)}</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                                <div className="flex gap-1 flex-wrap">
                                                    {renderInteractionTags(interaction, { size: 'text-xs' })}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-400 normal-case block mb-0.5">Last Visit</span>
                                                    <span className={`text-sm font-semibold normal-case ${lastVisitDisplay === 'New Patient' ? 'text-emerald-500' : 'text-blue-600'}`}>
                                                        {lastVisitDisplay}
                                                    </span>
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
                        {interactions.filter(i => !i.officerId || i.officerId === '').length === 0 && pendingInteractions.filter(i => i.isPending).length === 0 && (
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-8 text-slate-400 text-sm">
                                No unassigned registrations
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-slate-200 hidden lg:block"></div>

                {/* Right Side - Officers (Columns) */}
                <div className="flex-[1] flex flex-col min-w-0 min-h-0 lg:max-w-[400px]">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                        {activeOfficers.length > 1 && (
                            <select
                                value={selectedOfficerId || ''}
                                onChange={(e) => setSelectedOfficerId(e.target.value || null)}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                {activeOfficers.map((o) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        )}
                        <h3 className="text-sm font-semibold text-slate-700">Doctors</h3>
                    </div>
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
                                            .filter(i => i.officerId === selectedOfficer.id && !(i.id in pendingAssignments))
                                            .sort((a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime())
                                            .map((interaction) => {
                                                const canDrag = (userData?.role === 'receptionist' || userData?.role === 'officer') && !interaction.started && !interaction.completed && !interaction.closed;
                                                return (
                                                    <div
                                                        key={interaction.id}
                                                        draggable={canDrag}
                                                        onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                                        onClick={() => onInteractionClick(interaction)}
                                                        className={`group/item relative bg-white border border-slate-100 rounded-xl p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer active:scale-95 flex ${canDrag ? 'cursor-move' : ''}`}
                                                    >
                                                        <div className="flex-1 min-w-0 overflow-hidden">
                                                            <div className="flex gap-1 items-center mb-2">
                                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 normal-case tracking-tight shrink-0">
                                                                    {stripEntityPrefix(interaction.interactionSerial) || 'REG-PENDING'}
                                                                </span>
                                                                {canDrag && (
                                                                    <svg className="w-2.5 h-2.5 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            <div className="space-y-0.5">
                                                                <label className="text-xs font-semibold text-slate-400 normal-case tracking-wide block">Patient</label>
                                                                <div className="text-xs font-semibold text-slate-900 truncate normal-case">
                                                                    {getVisitorName(interaction.visitorId)}
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 text-xs text-slate-400 italic">
                                                                {formatDate(interaction.createdAt)}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-1 items-end justify-start shrink-0 ml-2 pl-2 border-l border-slate-100">
                                                            {renderInteractionTags(interaction, { size: 'text-xs' })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {interactions.filter(i => i.officerId === selectedOfficer.id && !(i.id in pendingAssignments)).length === 0 && !Object.values(pendingAssignments).some(id => id === selectedOfficer.id) && (
                                            <div className="text-xs text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                                                Drop registrations here
                                            </div>
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
                getVisitorName={getVisitorName}
                getVisitorSerial={getVisitorSerial}
                getVisitorHealthCard={getVisitorHealthCard}
                formatDate={formatDate}
                handleRegisterPatient={handleRegisterPatient}
                isCreatingInteraction={isCreatingInteraction}
                onPatientClick={onPatientClick}
            />

            {/* Delete Registration Confirmation Modal */}
            {showDeleteRegistrationModal && registrationToDelete && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[1000]" onClick={() => setShowDeleteRegistrationModal(false)}>
                    <div className="bg-white w-full max-w-[400px] p-4 sm:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Delete Registration</h2>
                        <p className="text-slate-600 mb-6">
                            Do you want to delete this unassigned registration?
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
                                        Deleting...
                                    </>
                                ) : (
                                    'Yes'
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
