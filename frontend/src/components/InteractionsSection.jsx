import { useState } from 'react';
import api from '../services/api';
import { useDropZone } from '../hooks/useDragAndDrop';

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
    formatDate,
    isDeletingRegistration,
    isCreatingInteraction,
    isAssigningInteraction,
    pendingInteractions,
    pendingAssignments
}) => {
    const [selectedInteraction, setSelectedInteraction] = useState(null);
    const [showInteractionDetailModal, setShowInteractionDetailModal] = useState(false);

    // Helper to get image URL (if it's a path, prepend API URL)
    const getImageUrl = (imagePath) => {
        try {
            if (!imagePath) return null;
            if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
                return imagePath;
            }
            // If it's a relative path, construct full URL
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            return `${API_URL.replace('/api', '')}/${imagePath}`;
        } catch (error) {
            console.error('Error getting image URL:', error);
            return null;
        }
    };

    // Safe handler to open interaction detail modal
    const handleInteractionClick = (interaction, canDrag) => {
        if (!canDrag && interaction) {
            try {
                console.log('Opening interaction detail:', interaction);
                // Ensure interaction has all required properties with defaults
                const safeInteraction = {
                    ...interaction,
                    ccReason: interaction.ccReason || null,
                    subjective: interaction.subjective || null,
                    objective: interaction.objective || null,
                    assessmentPlan: interaction.assessmentPlan || null,
                    serviceLines: Array.isArray(interaction.serviceLines) ? interaction.serviceLines : [],
                    completed: interaction.completed || false,
                    closed: interaction.closed || false,
                    started: interaction.started || false
                };
                setSelectedInteraction(safeInteraction);
                setShowInteractionDetailModal(true);
            } catch (error) {
                console.error('Error opening interaction detail:', error);
                console.error('Interaction object:', interaction);
                alert('Error opening interaction details. Please check the console.');
            }
        }
    };

    // Drop zone component for unassigned registrations (with mobile support)
    const UnassignedDropZone = ({ onDragOver, onDragLeave, onDrop, draggedOverUnassigned, children }) => {
        const dropRef = useDropZone({
            onDrop: (e) => {
                if (onDrop) {
                    const syntheticEvent = {
                        preventDefault: () => {},
                        stopPropagation: () => {},
                        dataTransfer: {
                            getData: () => 'patient'
                        },
                        type: 'touchend'
                    };
                    onDrop(syntheticEvent);
                }
            },
            onDragOver,
            onDragLeave
        });

        return (
            <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-colors flex-1 min-h-[300px] sm:min-h-[420px] ${
                    draggedOverUnassigned ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50'
                }`}
            >
                {children}
            </div>
        );
    };

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

            {/* Drag and Drop Area */}
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 min-h-[520px] h-full">
                {/* Left Side - Unassigned Interactions */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-slate-700">Unassigned Registrations</h3>
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={handleRegistrationDropOnBin}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Drop registration here to delete"
                        >
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                    </div>
                    <UnassignedDropZone
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
                            
                            // Check if it's a patient drop or interaction drop
                            // Try both data types for better compatibility
                            const patientData = e.dataTransfer?.getData('patient') || e.dataTransfer?.getData('text/plain') || (e.type === 'touchend' ? 'patient' : '');
                            if (patientData === 'true' || patientData === 'patient' || e.type === 'touchend') {
                                handlePatientDrop(e);
                            } else {
                                handleDrop(e, null);
                            }
                        }}
                        draggedOverUnassigned={draggedOverUnassigned}
                    >
                        {/* Show existing interactions first */}
                        {interactions
                            .filter(i => (!i.officerId || i.officerId === '') && !pendingInteractions.find(p => p.id === i.id && p.isPending))
                            .map((interaction) => {
                                const canDrag = userData?.role === 'receptionist' && !interaction.started && !interaction.completed && !interaction.closed;
                                return (
                                <div
                                    key={interaction.id}
                                    draggable={canDrag}
                                    onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                    className={`bg-white border-2 border-blue-200 rounded-xl p-4 ${canDrag ? 'cursor-move hover:bg-blue-50 hover:border-blue-300 hover:shadow-md' : 'cursor-not-allowed opacity-60'} transition-all shadow-sm aspect-square flex flex-col justify-between`}
                                >
                                    <div>
                                        <div className="text-xs font-semibold text-blue-700 mb-2">
                                            {interaction.interactionSerial || 'N/A'}
                                        </div>
                                        <div className="text-sm font-medium text-slate-900 mb-1">
                                            {getVisitorName(interaction.visitorId)}
                                        </div>
                                        <div className="text-xs text-slate-600 mb-2">
                                            ID: {getVisitorSerial(interaction.visitorId)}
                                        </div>
                                        {/* Status tags */}
                                        {(interaction.completed || interaction.closed) && (
                                            <div className="flex gap-1.5 mt-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                    interaction.completed 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {interaction.completed ? (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    Completed
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                    interaction.closed 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    {interaction.closed ? (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    Closed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {formatDate(interaction.createdAt)}
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
                                                ID: {visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial}` : visitor.serial}
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
                    </UnassignedDropZone>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-slate-200"></div>

                {/* Right Side - Officers (Columns) */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Doctors</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                        {officers
                            .filter(o => o.active !== 'false' && (!o.deletedAt || o.deletedAt === ''))
                            .map((officer) => (
                                <div
                                    key={officer.id}
                                    onDragOver={(e) => handleDragOver(e, officer)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, officer)}
                                    className={`bg-gradient-to-br from-slate-50 to-slate-100 border-2 rounded-xl p-4 h-full flex flex-col transition-all ${
                                        draggedOverOfficer === officer.id 
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
                                            .map((interaction) => {
                                                const canDrag = userData?.role === 'receptionist' && !interaction.started && !interaction.completed && !interaction.closed;
                                                return (
                                                <div
                                                    key={interaction.id}
                                                    draggable={canDrag}
                                                    onDragStart={(e) => canDrag ? handleDragStart(e, interaction) : e.preventDefault()}
                                    onClick={(e) => {
                                        if (!canDrag) {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleInteractionClick(interaction, canDrag);
                                        }
                                    }}
                                                    className={`bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-sm transition-all ${
                                                        canDrag ? 'cursor-move hover:shadow-md hover:border-blue-300' : 'cursor-pointer hover:shadow-md hover:border-blue-300 opacity-60'
                                                    }`}
                                                >
                                                    <div className="font-semibold text-blue-700 mb-1">
                                                        {interaction.interactionSerial || 'N/A'}
                                                    </div>
                                                    {/* Status tags */}
                                                    {(interaction.completed || interaction.closed) && (
                                                        <div className="flex gap-1 mb-1.5 flex-wrap">
                                                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                                                                interaction.completed 
                                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                                {interaction.completed ? (
                                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                Completed
                                                            </span>
                                                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                                                                interaction.closed 
                                                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                                {interaction.closed ? (
                                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                Closed
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="text-slate-700 font-medium mb-1">
                                                        {getVisitorName(interaction.visitorId)}
                                                    </div>
                                                    <div className="text-slate-500 text-[10px]">
                                                        {formatDate(interaction.createdAt)}
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
                            <div className="col-span-1 md:col-span-2 text-center py-8 text-slate-400 text-sm">
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

            {/* Interaction Detail Modal */}
            {showInteractionDetailModal && selectedInteraction && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
                    onClick={() => {
                        setShowInteractionDetailModal(false);
                        setSelectedInteraction(null);
                    }}
                >
                    <div 
                        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Interaction Details
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedInteraction?.interactionSerial || 'N/A'} · {selectedInteraction?.visitorId && getVisitorName ? getVisitorName(selectedInteraction.visitorId) : 'Unknown'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowInteractionDetailModal(false);
                                    setSelectedInteraction(null);
                                }}
                                className="text-slate-500 hover:text-slate-900"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-6 text-sm">
                            {/* Status Tags */}
                            <div className="flex gap-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                                    selectedInteraction?.completed 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    {selectedInteraction?.completed ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    Completed
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                                    (selectedInteraction?.closed === true)
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    {(selectedInteraction?.closed === true) ? (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    Closed
                                </span>
                            </div>

                            {/* Interaction Notes */}
                            {selectedInteraction?.ccReason && (selectedInteraction.ccReason?.text || selectedInteraction.ccReason?.scratchpad) && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">CC / Reason</h4>
                                    {selectedInteraction.ccReason?.text && (
                                        <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{selectedInteraction.ccReason.text}</p>
                                    )}
                                    {selectedInteraction.ccReason?.hasScratchpad && selectedInteraction.ccReason?.scratchpad && (
                                        <div className="mt-2">
                                            <img 
                                                src={getImageUrl(selectedInteraction.ccReason.scratchpad)} 
                                                alt="CC/Reason handwriting" 
                                                className="max-w-full h-auto rounded-lg border border-slate-200"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedInteraction?.subjective && (selectedInteraction.subjective?.text || selectedInteraction.subjective?.scratchpad) && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">S (Subjective)</h4>
                                    {selectedInteraction.subjective?.text && (
                                        <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{selectedInteraction.subjective.text}</p>
                                    )}
                                    {selectedInteraction.subjective?.hasScratchpad && selectedInteraction.subjective?.scratchpad && (
                                        <div className="mt-2">
                                            <img 
                                                src={getImageUrl(selectedInteraction.subjective.scratchpad)} 
                                                alt="Subjective handwriting" 
                                                className="max-w-full h-auto rounded-lg border border-slate-200"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedInteraction?.objective && (selectedInteraction.objective?.text || selectedInteraction.objective?.scratchpad) && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">O (Objective)</h4>
                                    {selectedInteraction.objective?.text && (
                                        <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{selectedInteraction.objective.text}</p>
                                    )}
                                    {selectedInteraction.objective?.hasScratchpad && selectedInteraction.objective?.scratchpad && (
                                        <div className="mt-2">
                                            <img 
                                                src={getImageUrl(selectedInteraction.objective.scratchpad)} 
                                                alt="Objective handwriting" 
                                                className="max-w-full h-auto rounded-lg border border-slate-200"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedInteraction?.assessmentPlan && (selectedInteraction.assessmentPlan?.text || selectedInteraction.assessmentPlan?.scratchpad) && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-2">A and P (Assessment and Plan)</h4>
                                    {selectedInteraction.assessmentPlan?.text && (
                                        <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{selectedInteraction.assessmentPlan.text}</p>
                                    )}
                                    {selectedInteraction.assessmentPlan?.hasScratchpad && selectedInteraction.assessmentPlan?.scratchpad && (
                                        <div className="mt-2">
                                            <img 
                                                src={getImageUrl(selectedInteraction.assessmentPlan.scratchpad)} 
                                                alt="Assessment and Plan handwriting" 
                                                className="max-w-full h-auto rounded-lg border border-slate-200"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Service Lines */}
                            {selectedInteraction?.serviceLines && Array.isArray(selectedInteraction.serviceLines) && selectedInteraction.serviceLines.length > 0 && (
                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Services</h4>
                                    <div className="space-y-2">
                                        {selectedInteraction.serviceLines.map((line, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-lg p-3 text-xs">
                                                <div className="grid grid-cols-6 gap-2">
                                                    <div className="font-medium text-slate-600">{line?.serialNumber || idx + 1}</div>
                                                    <div><span className="text-slate-500">Service:</span> {line?.service || 'N/A'}</div>
                                                    <div><span className="text-slate-500">Suffix:</span> {line?.suffix || 'N/A'}</div>
                                                    <div><span className="text-slate-500">Diagnostic:</span> {line?.diagnostic || 'N/A'}</div>
                                                    <div><span className="text-slate-500">Total Fee:</span> ${line?.totalFee || '0.00'}</div>
                                                    <div><span className="text-slate-500">Accounting #:</span> {line?.accountingNumber || 'N/A'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                                <div>Created: {selectedInteraction?.createdAt && formatDate ? formatDate(selectedInteraction.createdAt) : (selectedInteraction?.createdAt || 'N/A')}</div>
                                {selectedInteraction?.editedAt && (
                                    <div>Last edited: {formatDate ? formatDate(selectedInteraction.editedAt) : selectedInteraction.editedAt}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractionsSection;
