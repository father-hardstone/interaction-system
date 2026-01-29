import { useState } from 'react';
import VisitorsSection from './VisitorsSection';
import InteractionsSection from './InteractionsSection';
import IncompleteInteractionsTable from './IncompleteInteractionsTable';
import UnbilledInteractionsTable from './UnbilledInteractionsTable';
import FollowupInteractionsTable from './FollowupInteractionsTable';

const PlaceholderSection = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-500">{description}</p>
    </div>
);

const ReceptionTab = ({
    visitors,
    searchFirstName,
    setSearchFirstName,
    searchMiddleName,
    setSearchMiddleName,
    searchLastName,
    setSearchLastName,
    searchSerial,
    setSearchSerial,
    searchPhone,
    setSearchPhone,
    searchHealthCard,
    setSearchHealthCard,
    searchDob,
    setSearchDob,
    showVisitorModal,
    setShowVisitorModal,
    onOpenAddModal,
    visitorForm,
    setVisitorForm,
    phoneData,
    setPhoneData,
    phoneHData,
    setPhoneHData,
    guardianPhoneData,
    setGuardianPhoneData,
    healthCardNumber,
    setHealthCardNumber,
    healthCardVersion,
    setHealthCardVersion,
    healthCardEffectivityDate,
    setHealthCardEffectivityDate,
    healthCardExpiryDate,
    setHealthCardExpiryDate,
    handleCreateVisitor,
    handleHealthCardChange,

    error,
    setError,
    fieldErrors,
    setFieldErrors,
    editingVisitorId,
    handleEditVisitor,
    handlePatientClick,
    selectedPatient,
    showPatientDetailModal,
    setShowPatientDetailModal,
    handlePatientDragStart,
    handlePatientDrop,
    warningMessage,
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
    handleRegistrationDropOnBin,
    showDeleteRegistrationModal,
    setShowDeleteRegistrationModal,
    registrationToDelete,
    handleDeleteRegistration,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    getOfficerName,
    isCreatingVisitor,
    deletingVisitorId,
    isDeletingRegistration,
    isCreatingInteraction,
    isAssigningInteraction,
    pendingInteractions,
    pendingAssignments,
    handleDragEnd,
    draggedInteraction,
    interactionFilter,
    setInteractionFilter,
    handleRegisterPatient,
    nextVisitorSerial,
    onInteractionClick,
    getImageUrl,
    setViewingMedia,
    handleRegisterFollowup
}) => {
    const [activeSubTab, setActiveSubTab] = useState('patients');
    const [activeRegistrationSubTab, setActiveRegistrationSubTab] = useState(null); // null = main registrations view, 'incomplete', 'followup', 'unbilled'

    const getVisitorHealthCard = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        return visitor?.healthCardNumber || 'N/A';
    };

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Subtab Navigation */}
            <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveSubTab('patients')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'patients'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Patients
                    </button>
                    <button
                        onClick={() => {
                            setActiveSubTab('registrations');
                            setActiveRegistrationSubTab(null);
                        }}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'registrations'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Registrations
                    </button>
                    <button
                        onClick={() => setActiveSubTab('records')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'records'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <span>Records</span>
                    </button>
                    <button
                        onClick={() => setActiveSubTab('billings')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'billings'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <span>Billings</span>
                    </button>
                </div>
            </div>

            {/* Registration Sub-tabs - Only show when Registrations is active */}
            {activeSubTab === 'registrations' && (
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
                    <div className="flex bg-slate-50 p-1 rounded-xl w-fit border border-slate-200">
                        <button
                            onClick={() => setActiveRegistrationSubTab(null)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeRegistrationSubTab === null
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            All Registrations
                        </button>
                        <button
                            onClick={() => setActiveRegistrationSubTab('incomplete')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeRegistrationSubTab === 'incomplete'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Incomplete
                        </button>
                        <button
                            onClick={() => setActiveRegistrationSubTab('followup')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeRegistrationSubTab === 'followup'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Followup
                        </button>
                        <button
                            onClick={() => setActiveRegistrationSubTab('unbilled')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeRegistrationSubTab === 'unbilled'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Unbilled
                        </button>
                    </div>
                </div>
            )}

            {activeSubTab === 'patients' && (
                <VisitorsSection
                    visitors={visitors}
                    interactions={interactions}
                    officers={officers}
                    searchFirstName={searchFirstName}
                    setSearchFirstName={setSearchFirstName}
                    searchMiddleName={searchMiddleName}
                    setSearchMiddleName={setSearchMiddleName}
                    searchLastName={searchLastName}
                    setSearchLastName={setSearchLastName}
                    searchSerial={searchSerial}
                    setSearchSerial={setSearchSerial}
                    searchPhone={searchPhone}
                    setSearchPhone={setSearchPhone}
                    searchHealthCard={searchHealthCard}
                    setSearchHealthCard={setSearchHealthCard}
                    searchDob={searchDob}
                    setSearchDob={setSearchDob}
                    showVisitorModal={showVisitorModal}
                    setShowVisitorModal={setShowVisitorModal}
                    onOpenAddModal={onOpenAddModal}
                    visitorForm={visitorForm}
                    setVisitorForm={setVisitorForm}
                    phoneData={phoneData}
                    setPhoneData={setPhoneData}
                    phoneHData={phoneHData}
                    setPhoneHData={setPhoneHData}
                    guardianPhoneData={guardianPhoneData}
                    setGuardianPhoneData={setGuardianPhoneData}
                    healthCardNumber={healthCardNumber}
                    setHealthCardNumber={setHealthCardNumber}
                    healthCardVersion={healthCardVersion}
                    setHealthCardVersion={setHealthCardVersion}
                    healthCardEffectivityDate={healthCardEffectivityDate}
                    setHealthCardEffectivityDate={setHealthCardEffectivityDate}
                    healthCardExpiryDate={healthCardExpiryDate}
                    setHealthCardExpiryDate={setHealthCardExpiryDate}
                    handleCreateVisitor={handleCreateVisitor}
                    handleHealthCardChange={handleHealthCardChange}
                    error={error}
                    setError={setError}
                    fieldErrors={fieldErrors}
                    setFieldErrors={setFieldErrors}
                    editingVisitorId={editingVisitorId}
                    onEditVisitor={handleEditVisitor}
                    handlePatientClick={handlePatientClick}
                    selectedPatient={selectedPatient}
                    showPatientDetailModal={showPatientDetailModal}
                    setShowPatientDetailModal={setShowPatientDetailModal}
                    handlePatientDragStart={handlePatientDragStart}
                    handlePatientDrop={handlePatientDrop}
                    isCreatingVisitor={isCreatingVisitor}
                    deletingVisitorId={deletingVisitorId}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    getImageUrl={getImageUrl}
                    setViewingMedia={setViewingMedia}
                    userData={userData}
                    handleRegisterPatient={handleRegisterPatient}
                    nextVisitorSerial={nextVisitorSerial}
                />
            )}

            {activeSubTab === 'registrations' && (
                <div className="lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto lg:overflow-x-hidden">
                    {activeRegistrationSubTab === null && (
                        <InteractionsSection
                            interactions={interactions}
                            officers={officers}
                            userData={userData}
                            draggedOverOfficer={draggedOverOfficer}
                            draggedOverUnassigned={draggedOverUnassigned}
                            setDraggedOverUnassigned={setDraggedOverUnassigned}
                            handleDragStart={handleDragStart}
                            handleDragOver={handleDragOver}
                            handleDragLeave={handleDragLeave}
                            handleDrop={handleDrop}
                            handlePatientDrop={handlePatientDrop}
                            handleRegistrationDropOnBin={handleRegistrationDropOnBin}
                            showDeleteRegistrationModal={showDeleteRegistrationModal}
                            setShowDeleteRegistrationModal={setShowDeleteRegistrationModal}
                            registrationToDelete={registrationToDelete}
                            handleDeleteRegistration={handleDeleteRegistration}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}
                            getVisitorHealthCard={getVisitorHealthCard}
                            formatDate={formatDate}
                            isDeletingRegistration={isDeletingRegistration}
                            isCreatingInteraction={isCreatingInteraction}
                            isAssigningInteraction={isAssigningInteraction}
                            pendingInteractions={pendingInteractions}
                            pendingAssignments={pendingAssignments}
                            handleDragEnd={handleDragEnd}
                            draggedInteraction={draggedInteraction}
                            interactionFilter={interactionFilter}
                            setInteractionFilter={setInteractionFilter}
                            onInteractionClick={onInteractionClick}
                        />
                    )}

                    {activeRegistrationSubTab === 'incomplete' && (
                        <div className="animate-[fadeIn_0.3s_ease-out]">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Incomplete Registrations</h2>
                                <p className="text-sm text-slate-500 mt-1">Manage patients whose visits were started but not yet completed.</p>
                            </div>
                            <IncompleteInteractionsTable
                                incompleteInteractions={interactions.filter(i => i.incomplete && !i.completed)}
                                handleOpenPatientDetails={handlePatientClick}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                getOfficerName={getOfficerName}
                                formatDate={formatDate}
                                showOfficer={true}
                                handleStartInteraction={null} // Read-only for receptionist
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                            />
                        </div>
                    )}

                    {activeRegistrationSubTab === 'followup' && (
                        <div className="animate-[fadeIn_0.3s_ease-out]">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Follow-up Interactions</h2>
                                <p className="text-sm text-slate-500 mt-1">Track patients who need follow-up appointments or checks.</p>
                            </div>
                            <FollowupInteractionsTable
                                followupInteractions={interactions.filter(i => i.followup && i.followup.required)}
                                handleOpenPatientDetails={handlePatientClick}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                getOfficerName={getOfficerName}
                                formatDate={formatDate}
                                showOfficer={true}
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                                handleRegisterFollowup={handleRegisterFollowup}
                            />
                        </div>
                    )}

                    {activeRegistrationSubTab === 'unbilled' && (
                        <div className="animate-[fadeIn_0.3s_ease-out]">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-slate-900">Unbilled Interactions</h2>
                                <p className="text-sm text-slate-500 mt-1">Interactions that have been completed but not yet billed.</p>
                            </div>
                            <UnbilledInteractionsTable
                                unbilledInteractions={interactions.filter(i => {
                                    // Completed interactions that don't have billing
                                    if (!i.completed) return false;
                                    if (!i.serviceLines || i.serviceLines.length === 0) return true;
                                    // Check if any service line has billing info
                                    const hasBilling = i.serviceLines.some(line => 
                                        (line.totalFee && line.totalFee > 0) || line.accountingNumber
                                    );
                                    return !hasBilling;
                                })}
                                handleOpenPatientDetails={handlePatientClick}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                getOfficerName={getOfficerName}
                                formatDate={formatDate}
                                showOfficer={true}
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                            />
                        </div>
                    )}
                </div>
            )}

            {activeSubTab === 'records' && (
                <PlaceholderSection
                    title="Medical Records"
                    description="Access and manage patient medical records and history."
                />
            )}

            {activeSubTab === 'billings' && (
                <PlaceholderSection
                    title="Billings & Invoices"
                    description="Manage invoices, payments, and financial reports."
                />
            )}
        </div>
    );
};

export default ReceptionTab;
