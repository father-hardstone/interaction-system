import { useState } from 'react';
import VisitorsSection from './VisitorsSection';
import InteractionsSection from './InteractionsSection';

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
    showVisitorModal,
    setShowVisitorModal,
    visitorForm,
    setVisitorForm,
    phoneData,
    setPhoneData,
    phoneHData,
    setPhoneHData,
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
    nextVisitorSerial
}) => {
    const [activeSubTab, setActiveSubTab] = useState('patients');

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Subtab Navigation */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-4">
                <button
                    onClick={() => setActiveSubTab('patients')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeSubTab === 'patients'
                        ? 'bg-white text-primary shadow-sm scale-105'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Patients
                </button>
                <button
                    onClick={() => setActiveSubTab('registrations')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeSubTab === 'registrations'
                        ? 'bg-white text-primary shadow-sm scale-105'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Registrations
                </button>
            </div>

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
                    showVisitorModal={showVisitorModal}
                    setShowVisitorModal={setShowVisitorModal}
                    visitorForm={visitorForm}
                    setVisitorForm={setVisitorForm}
                    phoneData={phoneData}
                    setPhoneData={setPhoneData}
                    phoneHData={phoneHData}
                    setPhoneHData={setPhoneHData}
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
                    userData={userData}
                    handleRegisterPatient={handleRegisterPatient}
                    nextVisitorSerial={nextVisitorSerial}
                />
            )}

            {warningMessage && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-[slideUp_0.3s_ease-out]">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{warningMessage}</span>
                    </div>
                </div>
            )}

            {activeSubTab === 'registrations' && (
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
                />
            )}
        </div>
    );
};

export default ReceptionTab;
