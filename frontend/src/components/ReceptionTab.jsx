import VisitorsSection from './VisitorsSection';
import InteractionsSection from './InteractionsSection';

const ReceptionTab = ({
    visitors,
    searchName,
    setSearchName,
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
    idCardNumber,
    setIdCardNumber,
    handleCreateVisitor,
    handleIdCardChange,
    error,
    setError,
    handleDeleteVisitor,
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
    getVisitorName,
    getVisitorSerial,
    formatDate
}) => {
    return (
        <div className="space-y-6">
            <VisitorsSection
                visitors={visitors}
                searchName={searchName}
                setSearchName={setSearchName}
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
                idCardNumber={idCardNumber}
                setIdCardNumber={setIdCardNumber}
                handleCreateVisitor={handleCreateVisitor}
                handleIdCardChange={handleIdCardChange}
                error={error}
                setError={setError}
                onDeleteVisitor={handleDeleteVisitor}
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
                getVisitorName={getVisitorName}
                getVisitorSerial={getVisitorSerial}
                formatDate={formatDate}
            />
        </div>
    );
};

export default ReceptionTab;
