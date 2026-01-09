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
    getVisitorName,
    getVisitorSerial,
    formatDate
}) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Interactions</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage and assign interactions to officers {interactions.length > 0 && `(${interactions.length} interaction${interactions.length !== 1 ? 's' : ''})`}
                    </p>
                </div>
                <button
                    onClick={() => {
                        // Placeholder for future interaction creation
                        alert('Interaction creation form coming soon');
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                    Create Interaction
                </button>
            </div>

            {/* Drag and Drop Area */}
            <div className="p-6 flex gap-6 min-h-[520px]">
                {/* Left Side - Unassigned Interactions */}
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Unassigned Interactions</h3>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDraggedOverUnassigned(true);
                        }}
                        onDragLeave={() => setDraggedOverUnassigned(false)}
                        onDrop={(e) => handleDrop(e, null)}
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 rounded-xl transition-colors min-h-[420px] ${
                            draggedOverUnassigned ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-slate-50'
                        }`}
                    >
                        {interactions
                            .filter(i => !i.officerId || i.officerId === '')
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
                        {interactions.filter(i => !i.officerId || i.officerId === '').length === 0 && (
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-8 text-slate-400 text-sm">
                                No unassigned interactions
                            </div>
                        )}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px bg-slate-200"></div>

                {/* Right Side - Officers (Columns) */}
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">Officers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {officers
                            .filter(o => o.active !== 'false' && (!o.deletedAt || o.deletedAt === ''))
                            .map((officer) => (
                                <div
                                    key={officer.id}
                                    onDragOver={(e) => handleDragOver(e, officer)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, officer)}
                                    className={`bg-gradient-to-br from-slate-50 to-slate-100 border-2 rounded-xl p-4 min-h-[240px] transition-all ${
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
                                    <div className="space-y-2 max-h-[320px] overflow-y-auto">
                                        {interactions
                                            .filter(i => i.officerId === officer.id)
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
                                                Drop interactions here
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
        </div>
    );
};

export default InteractionsSection;
