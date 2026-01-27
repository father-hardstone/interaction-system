import { useState } from 'react';
import api from '../services/api';
import { useDropZone } from '../hooks/useDragAndDrop';
import { renderInteractionTags } from '../utils/interactionTags';

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
    handleDragEnd,

    draggedInteraction,
    interactionFilter,
    setInteractionFilter,
    onInteractionClick
}) => {
    const [draggedOverDelete, setDraggedOverDelete] = useState(false);



    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden overflow-x-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Registrations</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage and assign registrations to doctors {interactions.length > 0 && `(${interactions.length} registration${interactions.length !== 1 ? 's' : ''})`}
                    </p>
                </div>
                <button
                    onClick={() => {
                        // Placeholder for future interaction creation
                        alert('Registration form coming soon');
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors w-full sm:w-auto"
                >
                    Register Interaction

                </button>
            </div>

            {/* Filter */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span className="text-xs font-semibold uppercase tracking-wider">Filter Registrations</span>
                    </div>
                    <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setInteractionFilter('today')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${interactionFilter === 'today' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setInteractionFilter('older')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${interactionFilter === 'older' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Older
                        </button>
                        <button
                            onClick={() => setInteractionFilter('all')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${interactionFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            All
                        </button>
                    </div>
                </div>
            </div>

            {/* Drag and Drop Area */}
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 min-h-[520px] lg:min-h-0 lg:h-full">
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
                        className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4 rounded-xl transition-colors flex-1 min-h-[420px] ${draggedOverUnassigned ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50'
                            }`}
                    >
                        {/* Show existing interactions first */}
                        {interactions
                            .filter(i => (!i.officerId || i.officerId === '') && !pendingInteractions.find(p => p.id === i.id && p.isPending))
                            .map((interaction) => {
                                const canDrag = (userData?.role === 'receptionist' || userData?.role === 'officer') && !interaction.started && !interaction.completed && !interaction.closed;
                                const isBeingDeleted = draggedOverDelete && draggedInteraction?.id === interaction.id;

                                // Calculate Last Visit
                                const patientHistory = interactions
                                    .filter(past => past.visitorId === interaction.visitorId && past.completed && past.id !== interaction.id)
                                    .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));

                                const lastVisitDate = patientHistory.length > 0
                                    ? formatDate(patientHistory[0].editedAt || patientHistory[0].createdAt, false)
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
                                        className={`group/card relative bg-white border border-slate-200 rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 active:scale-[0.98] flex flex-col justify-between h-fit overflow-hidden ${isBeingDeleted ? 'ring-2 ring-red-500 bg-red-50' : 'hover:border-blue-400'}`}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -mr-12 -mt-12 transition-transform group-hover/card:scale-110"></div>

                                        <div className="relative flex flex-col h-full gap-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-black text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100 uppercase tracking-widest">
                                                    {interaction.interactionSerial || 'REG-PENDING'}
                                                </span>
                                                {canDrag && (
                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                        <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2 flex-1">
                                                <div className="text-lg font-black text-slate-900 group-hover/card:text-blue-700 transition-colors truncate uppercase tracking-tighter">
                                                    {getVisitorName(interaction.visitorId)}
                                                </div>
                                                <div className="text-sm font-black text-slate-600 font-mono tracking-wider">
                                                    {getVisitorHealthCard(interaction.visitorId)}
                                                </div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {formatDate(interaction.createdAt, false)}
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Last Visit</span>
                                                    <span className={`text-sm font-black uppercase tracking-widest ${lastVisitDate === 'New Patient' ? 'text-emerald-500' : 'text-blue-600'}`}>
                                                        {lastVisitDate}
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
                                                    {visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial}` : visitor.serial}
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
                <div className="flex-[1] flex flex-col min-w-0 lg:max-w-[400px]">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Doctors</h3>
                    <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                        {officers
                            .filter(o => o.active !== 'false' && (!o.deletedAt || o.deletedAt === ''))
                            .map((officer) => (
                                <div
                                    key={officer.id}
                                    onDragOver={(e) => handleDragOver(e, officer)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, officer)}
                                    className={`bg-gradient-to-br from-slate-50 to-slate-100 border-2 rounded-xl p-4 h-full flex flex-col transition-all ${draggedOverOfficer === officer.id
                                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg scale-105'
                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                                        }`}
                                >
                                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                                        <div className="font-semibold text-slate-900 text-sm mb-1">
                                            {officer.name}
                                        </div>
                                        <div className="text-xs text-slate-600">
                                            ID: {officer.serial}
                                        </div>
                                    </div>

                                    {/* Assigned Interactions for this officer */}
                                    <div className="space-y-2 flex-1 overflow-y-auto">
                                        {/* Show pending assignments (optimistic UI) */}
                                        {Object.entries(pendingAssignments)
                                            .filter(([interactionId, targetOfficerId]) => targetOfficerId === officer.id)
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
                                            .filter(i => i.officerId === officer.id && !pendingAssignments[i.id])
                                            .sort((a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime())
                                            .map((interaction) => {
                                                const canDrag = (userData?.role === 'receptionist' || userData?.role === 'officer') && !interaction.started && !interaction.completed && !interaction.closed;
                                                return (
                                                    <div
                                                        key={interaction.id}
                                                        draggable={canDrag}
                                                        onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                                        onClick={() => onInteractionClick(interaction)}
                                                        className={`group/item relative bg-white border border-slate-100 rounded-xl p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer active:scale-95 ${canDrag ? 'cursor-move' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                                                                {interaction.interactionSerial || 'REG-PENDING'}
                                                            </span>
                                                            <div className="flex gap-1 flex-wrap justify-end">
                                                                {renderInteractionTags(interaction, { size: 'text-[7px]' })}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-0.5">
                                                            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Patient</label>
                                                            <div className="text-xs font-black text-slate-900 truncate uppercase">
                                                                {getVisitorName(interaction.visitorId)}
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 text-[8px] text-slate-400 flex justify-between items-center italic">
                                                            <span>{formatDate(interaction.createdAt)}</span>
                                                            {canDrag && (
                                                                <svg className="w-2.5 h-2.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        {interactions.filter(i => i.officerId === officer.id).length === 0 && (
                                            <div className="text-xs text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                                                Drop registrations here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        {officers.filter(o => o.active !== 'false' && (!o.deletedAt || o.deletedAt === '')).length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No officers available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Registration Confirmation Modal */}
            {showDeleteRegistrationModal && registrationToDelete && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowDeleteRegistrationModal(false)}>
                    <div className="bg-white w-full max-w-[400px] p-4 sm:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Delete Registration</h2>
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
