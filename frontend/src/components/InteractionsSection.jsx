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
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
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
                    className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                    Register Interaction
                </button>
            </div>

            {/* Drag and Drop Area */}
            <div className="p-6 flex gap-6 min-h-[520px] h-full">
                {/* Left Side - Unassigned Interactions */}
                <div className="flex-1 flex flex-col">
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
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDraggedOverUnassigned(true);
                        }}
                        onDragLeave={() => setDraggedOverUnassigned(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDraggedOverUnassigned(false);
                            
                            // Check if it's a patient drop or interaction drop
                            // Try both data types for better compatibility
                            const patientData = e.dataTransfer.getData('patient') || e.dataTransfer.getData('text/plain');
                            if (patientData === 'true' || patientData === 'patient') {
                                handlePatientDrop(e);
                            } else {
                                handleDrop(e, null);
                            }
                        }}
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 rounded-xl transition-colors flex-1 min-h-[420px] ${
                            draggedOverUnassigned ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50'
                        }`}
                    >
                        {/* Show existing interactions first */}
                        {interactions
                            .filter(i => (!i.officerId || i.officerId === '') && !pendingInteractions.find(p => p.id === i.id && p.isPending))
                            .map((interaction) => (
                                <div
                                    key={interaction.id}
                                    draggable={userData?.role === 'receptionist'}
                                    onDragStart={(e) => handleDragStart(e, interaction)}
                                    className={`bg-white border-2 border-blue-200 rounded-xl p-4 cursor-move hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all shadow-sm aspect-square flex flex-col justify-between ${
                                        userData?.role !== 'receptionist' ? 'cursor-not-allowed opacity-50' : ''
                                    }`}
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
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {formatDate(interaction.createdAt)}
                                    </div>
                                </div>
                            ))}
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
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-slate-200"></div>

                {/* Right Side - Officers (Columns) */}
                <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Doctors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
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
                                            .map((interaction) => (
                                                <div
                                                    key={interaction.id}
                                                    draggable={userData?.role === 'receptionist'}
                                                    onDragStart={(e) => handleDragStart(e, interaction)}
                                                    className={`bg-white border border-slate-200 rounded-lg p-2.5 text-xs shadow-sm hover:shadow-md transition-all ${
                                                        userData?.role === 'receptionist' ? 'cursor-move hover:border-blue-300' : ''
                                                    }`}
                                                >
                                                    <div className="font-semibold text-blue-700 mb-1">
                                                        {interaction.interactionSerial || 'N/A'}
                                                    </div>
                                                    <div className="text-slate-700 font-medium mb-1">
                                                        {getVisitorName(interaction.visitorId)}
                                                    </div>
                                                    <div className="text-slate-500 text-[10px]">
                                                        {formatDate(interaction.createdAt)}
                                                    </div>
                                                </div>
                                            ))}
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
                    <div className="bg-white w-full max-w-[400px] p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4" onClick={(e) => e.stopPropagation()}>
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
