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
    searchIdCard,
    setSearchIdCard,
    showVisitorModal,
    setShowVisitorModal,
    visitorForm,
    setVisitorForm,
    phoneData,
    setPhoneData,
    phoneHData,
    setPhoneHData,
    idCardNumber,
    setIdCardNumber,
    healthCardVersion,
    setHealthCardVersion,
    healthCardEffectivityDate,
    setHealthCardEffectivityDate,
    healthCardExpiryDate,
    setHealthCardExpiryDate,
    handleCreateVisitor,
    handleIdCardChange,
    error,
    setError,
    handleDeleteVisitor,
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
    formatDate
}) => {
    return (
        <div className="space-y-6">
            <VisitorsSection
                visitors={visitors}
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
                searchIdCard={searchIdCard}
                setSearchIdCard={setSearchIdCard}
                showVisitorModal={showVisitorModal}
                setShowVisitorModal={setShowVisitorModal}
                visitorForm={visitorForm}
                setVisitorForm={setVisitorForm}
                phoneData={phoneData}
                setPhoneData={setPhoneData}
                phoneHData={phoneHData}
                setPhoneHData={setPhoneHData}
                idCardNumber={idCardNumber}
                setIdCardNumber={setIdCardNumber}
                healthCardVersion={healthCardVersion}
                setHealthCardVersion={setHealthCardVersion}
                healthCardEffectivityDate={healthCardEffectivityDate}
                setHealthCardEffectivityDate={setHealthCardEffectivityDate}
                healthCardExpiryDate={healthCardExpiryDate}
                setHealthCardExpiryDate={setHealthCardExpiryDate}
                handleCreateVisitor={handleCreateVisitor}
                handleIdCardChange={handleIdCardChange}
                error={error}
                setError={setError}
                onDeleteVisitor={handleDeleteVisitor}
                handlePatientClick={handlePatientClick}
                selectedPatient={selectedPatient}
                showPatientDetailModal={showPatientDetailModal}
                setShowPatientDetailModal={setShowPatientDetailModal}
                handlePatientDragStart={handlePatientDragStart}
                handlePatientDrop={handlePatientDrop}
            />

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
            />
        </div>
    );
};

export default ReceptionTab;
