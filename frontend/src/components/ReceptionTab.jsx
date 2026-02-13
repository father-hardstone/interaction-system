import { useState, useEffect } from 'react';
import { formatHealthCardDisplay } from '../utils/formatUtils';
import { reportService } from '../services/reportService';
import VisitorsSection from './VisitorsSection';
import InteractionsSection from './InteractionsSection';
import ReportsSection from './ReportsSection';
import PatientDetailsModal from './PatientDetailsModal';
import NotClosedInteractionsTable from './NotClosedInteractionsTable';
import IncompleteInteractionsTable from './IncompleteInteractionsTable';
import UnbilledInteractionsTable from './UnbilledInteractionsTable';
import FollowupInteractionsTable from './FollowupInteractionsTable';
import { BillingSection } from './billing';

const PlaceholderSection = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-500">{description}</p>
    </div>
);

const ReceptionTab = ({
    visitors,
    isLoadingVisitors = false,
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
    phoneMData,
    setPhoneMData,
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
    handleHealthCardVersionChange,
    error,
    setError,
    fieldErrors,
    setFieldErrors,
    editingVisitorId,
    setEditingVisitorId,
    onEditVisitor,
    handlePatientClick,
    selectedPatient,
    showPatientDetailModal,
    setShowPatientDetailModal,
    handlePatientDragStart,
    handlePatientDrop,
    warningMessage,
    interactions,
    lastVisits = {},
    officers,
    userData,
    draggedOverOfficer,
    draggedOverUnassigned,
    setDraggedOverUnassigned,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleAssignToOfficer,
    onOpenQueueModal,
    handleRegistrationDropOnBin,
    onRequestDelete,
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
    assignmentFailed,
    handleDragEnd,
    draggedInteraction,
    interactionFilter,
    setInteractionFilter,
    handleRegisterPatient,
    nextVisitorSerial,
    onInteractionClick,
    getImageUrl,
    setViewingMedia,
    handleRegisterFollowup,
    registeringFollowupForId
}) => {
    const [activeSubTab, setActiveSubTab] = useState('patients');
    const [activeInteractionSubTab, setActiveInteractionSubTab] = useState('not_closed'); // for Interactions tab: not_closed, incomplete, followup, unbilled
    const [billingModalInteraction, setBillingModalInteraction] = useState(null);
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    // Load reports when patient detail modal opens (works from any sub-tab: Patients, Reports, Billings)
    useEffect(() => {
        if (showPatientDetailModal && selectedPatient) {
            const loadReports = async () => {
                setLoadingReports(true);
                try {
                    const data = await reportService.getByPatient(selectedPatient.id);
                    setReports(data || []);
                } catch (error) {
                    console.error('Failed to load reports:', error);
                    setReports([]);
                } finally {
                    setLoadingReports(false);
                }
            };
            loadReports();
        } else {
            setReports([]);
        }
    }, [showPatientDetailModal, selectedPatient]);

    const handleReportUploadSuccess = () => {
        if (!selectedPatient) return;
        reportService.getByPatient(selectedPatient.id).then((data) => setReports(data || [])).catch(() => setReports([]));
    };

    const getVisitorHealthCard = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        return visitor?.healthCardNumber ? formatHealthCardDisplay(visitor.healthCardNumber) : 'N/A';
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-x-hidden">
            {/* Subtab Navigation + Time filter - same line */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 mb-4">
                <div className="flex overflow-x-auto scrollbar-hide">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveSubTab('patients')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'patients'
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
                        onClick={() => setActiveSubTab('registrations')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'registrations'
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
                        onClick={() => setActiveSubTab('interactions')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'interactions'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Interactions
                    </button>
                    <button
                        onClick={() => setActiveSubTab('reports')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'reports'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Reports
                    </button>
                    <button
                        onClick={() => setActiveSubTab('billings')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${activeSubTab === 'billings'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V7a2 2 0 012-2h2a2 2 0 012 2v1m-4 1v6" />
                        </svg>
                        Billings
                    </button>
                </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold normal-case tracking-wide text-slate-500">Time filter</span>
                    <div className="flex bg-slate-200/50 p-1 rounded-xl flex-wrap gap-1">
                        {['today', 'this_week', 'this_month', 'last_three_months', 'all'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setInteractionFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${interactionFilter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                {f === 'this_week' ? 'This week' : f === 'this_month' ? 'This month' : f === 'last_three_months' ? 'Last 3 months' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeSubTab === 'patients' && (
                <div className="flex-1 flex flex-col min-h-0">
                <VisitorsSection
                    visitors={visitors}
                    isLoadingVisitors={isLoadingVisitors}
                    interactions={interactions}
                    lastVisits={lastVisits}
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
                    phoneMData={phoneMData}
                    setPhoneMData={setPhoneMData}
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
                    handleHealthCardVersionChange={handleHealthCardVersionChange}
                    error={error}
                    setError={setError}
                    fieldErrors={fieldErrors}
                    setFieldErrors={setFieldErrors}
                    editingVisitorId={editingVisitorId}
                    setEditingVisitorId={setEditingVisitorId}
                    onEditVisitor={onEditVisitor}
                    handlePatientClick={handlePatientClick}
                    onInteractionClick={onInteractionClick}
                    handlePatientDragStart={handlePatientDragStart}
                    handlePatientDrop={handlePatientDrop}
                    isCreatingVisitor={isCreatingVisitor}
                    isCreatingInteraction={isCreatingInteraction}
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
                </div>
            )}

            {activeSubTab === 'registrations' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <InteractionsSection
                        visitors={visitors}
                        interactions={interactions}
                        lastVisits={lastVisits}
                        officers={officers}
                        userData={userData}
                        draggedOverOfficer={draggedOverOfficer}
                        draggedOverUnassigned={draggedOverUnassigned}
                        setDraggedOverUnassigned={setDraggedOverUnassigned}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDragLeave={handleDragLeave}
                        handleDrop={handleDrop}
                        handleAssignToOfficer={handleAssignToOfficer}
                        onOpenQueueModal={onOpenQueueModal}
                        handlePatientDrop={handlePatientDrop}
                        handleRegistrationDropOnBin={handleRegistrationDropOnBin}
                        onRequestDelete={onRequestDelete}
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
                        assignmentFailed={assignmentFailed}
                        handleDragEnd={handleDragEnd}
                        draggedInteraction={draggedInteraction}
                        onInteractionClick={onInteractionClick}
                        handleRegisterPatient={handleRegisterPatient}
                        onPatientClick={handlePatientClick}
                    />
                </div>
            )}

            {activeSubTab === 'interactions' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
                    <div className="flex bg-slate-50 p-1 rounded-xl w-fit border border-slate-200 mb-4 shrink-0">
                        <button
                            onClick={() => setActiveInteractionSubTab('not_closed')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeInteractionSubTab === 'not_closed'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Not closed
                        </button>
                        <button
                            onClick={() => setActiveInteractionSubTab('incomplete')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeInteractionSubTab === 'incomplete'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Incomplete
                        </button>
                        <button
                            onClick={() => setActiveInteractionSubTab('followup')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeInteractionSubTab === 'followup'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Followup
                        </button>
                        <button
                            onClick={() => setActiveInteractionSubTab('unbilled')}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeInteractionSubTab === 'unbilled'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            Unbilled
                        </button>
                    </div>

                    {activeInteractionSubTab === 'not_closed' && (
                        <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col flex-1 min-h-0 p-4">
                            <div className="mb-4 shrink-0">
                                <h2 className="text-xl font-semibold text-slate-900">Not Closed</h2>
                                <p className="text-sm text-slate-500 mt-1">Interactions that have not been administratively closed.</p>
                            </div>
                            <NotClosedInteractionsTable
                                notClosedInteractions={interactions.filter(i => !i.closed)}
                                handleOpenPatientDetails={handlePatientClick}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                getOfficerName={getOfficerName}
                                formatDate={formatDate}
                                showOfficer={true}
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                                lastVisits={lastVisits}
                            />
                        </div>
                    )}

                    {activeInteractionSubTab === 'incomplete' && (
                        <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col flex-1 min-h-0 p-4">
                            <div className="mb-4 shrink-0">
                                <h2 className="text-xl font-semibold text-slate-900">Incomplete Registrations</h2>
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
                                handleStartInteraction={null}
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                                lastVisits={lastVisits}
                            />
                        </div>
                    )}

                    {activeInteractionSubTab === 'followup' && (
                        <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col flex-1 min-h-0 p-4">
                            <div className="mb-4 shrink-0">
                                <h2 className="text-xl font-semibold text-slate-900">Followup To Interactions</h2>
                                <p className="text-sm text-slate-500 mt-1">Track patients who need follow-up appointments or checks.</p>
                            </div>
                            <FollowupInteractionsTable
                                followupInteractions={interactions.filter(i => i.followupRequired?.required || i.followup?.required)}
                                handleOpenPatientDetails={handlePatientClick}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                getOfficerName={getOfficerName}
                                formatDate={formatDate}
                                showOfficer={true}
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                                lastVisits={lastVisits}
                                handleRegisterFollowup={handleRegisterFollowup}
                                registeringFollowupForId={registeringFollowupForId}
                            />
                        </div>
                    )}

                    {activeInteractionSubTab === 'unbilled' && (
                        <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col flex-1 min-h-0 p-4">
                            <div className="mb-4 shrink-0">
                                <h2 className="text-xl font-semibold text-slate-900">Unbilled Interactions</h2>
                                <p className="text-sm text-slate-500 mt-1">Interactions that are completed, closed (billing info added), and ready for billing.</p>
                            </div>
                            <UnbilledInteractionsTable
                                unbilledInteractions={interactions.filter(i => {
                                    if (!i.completed) return false;
                                    if (i.billed === true) return false;
                                    const hasBillingInfo = i.serviceLines?.length > 0 &&
                                        i.serviceLines.some(l => (l.totalFee && l.totalFee > 0) || l.accountingNumber);
                                    return i.closed || hasBillingInfo;
                                })}
                                handleOpenPatientDetails={handlePatientClick}
                                getVisitorName={getVisitorName}
                                getVisitorSerial={getVisitorSerial}
                                getOfficerName={getOfficerName}
                                formatDate={formatDate}
                                showOfficer={true}
                                onInteractionClick={onInteractionClick}
                                interactions={interactions}
                                lastVisits={lastVisits}
                                onBillNow={(interaction) => {
                                    setBillingModalInteraction(interaction);
                                    setActiveSubTab('billings');
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {activeSubTab === 'reports' && (
                <div className="flex-1 flex flex-col min-h-0">
                <ReportsSection
                    visitors={visitors}
                    isLoadingVisitors={isLoadingVisitors}
                    interactions={interactions}
                    lastVisits={lastVisits}
                    officers={officers}
                    userData={userData}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    onPatientClick={handlePatientClick}
                />
                </div>
            )}

            {activeSubTab === 'billings' && (
                <BillingSection
                    interactions={interactions}
                    visitors={visitors}
                    officers={officers}
                    onInteractionClick={onInteractionClick}
                    onOpenPatientDetails={handlePatientClick}
                    billingModalInteraction={billingModalInteraction}
                    onOpenBillNow={setBillingModalInteraction}
                    onCloseBillNow={() => setBillingModalInteraction(null)}
                />
            )}

            {/* Patient Details Modal - rendered at ReceptionTab level so it's available from Patients, Reports, Billings tabs */}
            {showPatientDetailModal && selectedPatient && (
                <PatientDetailsModal
                    selectedPatient={selectedPatient}
                    setShowPatientDetailModal={setShowPatientDetailModal}
                    reportsOnly={activeSubTab === 'reports'}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    completedInteractionsForPatient={interactions.filter(i => i.visitorId === selectedPatient?.id && i.completed)}
                    lastVisits={lastVisits}
                    formatDate={formatDate}
                    onInteractionClick={onInteractionClick}
                    getImageUrl={getImageUrl}
                    setViewingMedia={setViewingMedia}
                    isLoadingReports={loadingReports}
                    patientReports={reports}
                    entityId={userData?.entityId}
                    entitySerial={userData?.entitySerial}
                    interactions={interactions}
                    officers={officers}
                    onUploadSuccess={handleReportUploadSuccess}
                    handlePatientClick={handlePatientClick}
                    visitors={visitors}
                />
            )}
        </div>
    );
};

export default ReceptionTab;
