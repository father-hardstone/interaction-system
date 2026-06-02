import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { formatHealthCardDisplay, getInteractionStatus } from '../utils/formatUtils';
import { reportService } from '../services/reportService';
import { interactionService } from '../services/interactionService';
import VisitorsSection from './VisitorsSection';
import UnconfirmedVisitorsSection from './UnconfirmedVisitorsSection';
import InteractionsSection from './InteractionsSection';
import ReportsSection from './ReportsSection';
import PatientDetailsModal from './PatientDetailsModal';
import NotClosedInteractionsTable from './NotClosedInteractionsTable';
import IncompleteInteractionsTable from './IncompleteInteractionsTable';
import UnbilledInteractionsTable from './UnbilledInteractionsTable';
import FollowupInteractionsTable from './FollowupInteractionsTable';
import { BillingSection } from './billing';
import OutgoingLogTab from './operations/OutgoingLogTab';
import CreatePatientModal from './CreatePatientModal';
import UnauthorizedView from './UnauthorizedView';
import { canAccessReceptionSubTab, canManagePatients } from '../utils/userPermissions';

const TabLockIcon = () => (
    <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

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
    searchContact,
    setSearchContact,
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
    allInteractions = [],
    onInteractionUpdated,
    lastVisits = {},
    officers,
    userData,
    isLoadingInteractions = false,
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
    onRequestCancel,
    showDeleteRegistrationModal,
    setShowDeleteRegistrationModal,
    registrationToDelete,
    handleDeleteRegistration,
    showCancelRegistrationModal,
    setShowCancelRegistrationModal,
    registrationToCancel,
    handleCancelRegistration,
    isCancellingRegistration,
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
    onReceptionSubTabChange,
    handleRegisterPatient,
    nextVisitorSerial,
    onInteractionClick,
    getImageUrl,
    setViewingMedia,
    handleRegisterFollowup,
    registeringFollowupForId,
    isEditingUnconfirmed = false,
    onRefreshVisitors = () => { }
}) => {
    const [activeSubTab, setActiveSubTab] = useState('patients');
    const userRole = userData?.role;
    const managePatients = canManagePatients(userRole);
    const isSubTabLocked = (tabId) => !canAccessReceptionSubTab(userRole, tabId);
    const showUnauthorizedSubTab = !canAccessReceptionSubTab(userRole, activeSubTab);

    const handleSubTabChange = (tab) => {
        if (!canAccessReceptionSubTab(userRole, tab)) return;
        setActiveSubTab(tab);
        onReceptionSubTabChange?.(tab);
    };
    const [activeInteractionSubTab, setActiveInteractionSubTab] = useState('ongoing'); // for Interactions tab: ongoing, not_closed, incomplete, followup, unbilled
    const [patientDetailPastInteractions, setPatientDetailPastInteractions] = useState([]);
    const [billingModalInteraction, setBillingModalInteraction] = useState(null);
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [unconfirmedVisitors, setUnconfirmedVisitors] = useState([]);
    const [isLoadingUnconfirmed, setIsLoadingUnconfirmed] = useState(false);
    const [approvingVisitor, setApprovingVisitor] = useState(null);
    const [isApproving, setIsApproving] = useState(false);

    const fetchUnconfirmed = async () => {
        if (!userData?.entityId) return;
        setIsLoadingUnconfirmed(true);
        try {
            const res = await api.get(`/visitors/entity/${userData.entityId}?confirmed=false`);
            setUnconfirmedVisitors(res.data || []);
        } catch (err) {
            console.error('Failed to fetch unconfirmed visitors:', err);
        } finally {
            setIsLoadingUnconfirmed(false);
        }
    };

    useEffect(() => {
        if (!userData?.entityId || !canAccessReceptionSubTab(userRole, 'unconfirmed')) return;
        fetchUnconfirmed();
        const interval = setInterval(fetchUnconfirmed, 30000);
        return () => clearInterval(interval);
    }, [userData?.entityId, userRole]);

    // Fetch past interactions for patient when profile modal opens (independent of time filter)
    useEffect(() => {
        if (!showPatientDetailModal || !selectedPatient?.id || !userData?.entityId) {
            setPatientDetailPastInteractions([]);
            return;
        }
        let cancelled = false;
        interactionService.getByVisitor(userData.entityId, selectedPatient.id).then((data) => {
            if (cancelled) return;
            const list = (data?.interactions || []).filter((i) => i.completed);
            setPatientDetailPastInteractions(list);
        }).catch(() => {
            if (!cancelled) setPatientDetailPastInteractions([]);
        });
        return () => { cancelled = true; };
    }, [showPatientDetailModal, selectedPatient?.id, userData?.entityId]);

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

    // Tab counts: number of entries in each tab's main tables
    const tabCounts = useMemo(() => {
        const nonCancelled = interactions.filter((i) => !i.cancelled);

        // Billings: Completed + Daily sheet + Detail claim + Filed (same buckets as BillingSection)
        const ministryFiled = (i) => i?.ministryClaimFiled === true || i?.ministryClaimFiled === 'true';
        let completedOpen = 0;
        let unbilled = 0;
        let detailClaim = 0;
        let filedClaims = 0;
        for (const i of interactions) {
            if (i.cancelled) continue;
            if (i.completed && !i.closed) completedOpen++;
            if (!i.completed) continue;
            const hasBeenBilled = i.billed === true;
            const hasBillingInfo = i.serviceLines?.length > 0 && i.serviceLines.some((l) => (l.totalFee && l.totalFee > 0) || l.accountingNumber);
            const isClosed = i.closed || hasBillingInfo;
            if (hasBeenBilled) {
                if (ministryFiled(i)) filedClaims++;
                else detailClaim++;
            } else if (isClosed) {
                unbilled++;
            }
        }

        // Registrations tab: unassigned registrations + queued/scheduled registrations (non-cancelled)
        const registrationInteractions = interactions.filter((i) => {
            if (i.cancelled) return false;
            const status = getInteractionStatus(i);
            return status === 'registered' || status === 'queued';
        });

        return {
            patients: visitors.length,
            registrations: registrationInteractions.length,
            reports: visitors.length,
            billings: completedOpen + unbilled + detailClaim + filedClaims,
            outgoing: 0,
            unconfirmed: unconfirmedVisitors.length
        };
    }, [visitors, interactions, unconfirmedVisitors]);

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-x-hidden">
            {/* Subtab Navigation + Time filter - same line */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 mb-4">
                <div className="flex overflow-x-auto scrollbar-hide">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                    <button
                        type="button"
                        disabled={isSubTabLocked('unconfirmed')}
                        onClick={() => handleSubTabChange('unconfirmed')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isSubTabLocked('unconfirmed') ? 'opacity-50 cursor-not-allowed' : ''} ${activeSubTab === 'unconfirmed'
                            ? 'bg-rose-500 text-white shadow-lg scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {isSubTabLocked('unconfirmed') && <TabLockIcon />}
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.27 0 2.09-1.383 1.45-2.43L13.732 4c-.64-1.047-2.05-1.047-2.692 0L3.062 16.57c-.64 1.047.18 2.43 1.45 2.43z" />
                        </svg>
                        Unconfirmed Patients ({tabCounts.unconfirmed})
                    </button>
                    <button
                        type="button"
                        disabled={isSubTabLocked('patients')}
                        onClick={() => handleSubTabChange('patients')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isSubTabLocked('patients') ? 'opacity-50 cursor-not-allowed' : ''} ${activeSubTab === 'patients'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {isSubTabLocked('patients') && <TabLockIcon />}
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Patients ({tabCounts.patients})
                    </button>
                    <button
                        type="button"
                        disabled={isSubTabLocked('registrations')}
                        onClick={() => handleSubTabChange('registrations')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isSubTabLocked('registrations') ? 'opacity-50 cursor-not-allowed' : ''} ${activeSubTab === 'registrations'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {isSubTabLocked('registrations') && <TabLockIcon />}
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Registrations ({tabCounts.registrations})
                    </button>
                    <button
                        type="button"
                        disabled={isSubTabLocked('reports')}
                        onClick={() => handleSubTabChange('reports')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isSubTabLocked('reports') ? 'opacity-50 cursor-not-allowed' : ''} ${activeSubTab === 'reports'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {isSubTabLocked('reports') && <TabLockIcon />}
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Reports ({tabCounts.reports})
                    </button>
                    <button
                        type="button"
                        disabled={isSubTabLocked('billings')}
                        onClick={() => handleSubTabChange('billings')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isSubTabLocked('billings') ? 'opacity-50 cursor-not-allowed' : ''} ${activeSubTab === 'billings'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {isSubTabLocked('billings') && <TabLockIcon />}
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-4-1V7a2 2 0 012-2h2a2 2 0 012 2v1m-4 1v6" />
                        </svg>
                        Billings ({tabCounts.billings})
                    </button>
                    <button
                        type="button"
                        disabled={isSubTabLocked('outgoing_log')}
                        onClick={() => handleSubTabChange('outgoing_log')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${isSubTabLocked('outgoing_log') ? 'opacity-50 cursor-not-allowed' : ''} ${activeSubTab === 'outgoing_log'
                            ? 'bg-white text-primary shadow-sm scale-105'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {isSubTabLocked('outgoing_log') && <TabLockIcon />}
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                        </svg>
                        Outgoing log
                    </button>
                </div>
                </div>
            </div>

            {showUnauthorizedSubTab ? (
                <UnauthorizedView message="You don't have permission to view this section. Contact your administrator if you need access." />
            ) : null}

            {!showUnauthorizedSubTab && activeSubTab === 'unconfirmed' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <UnconfirmedVisitorsSection
                        visitors={unconfirmedVisitors}
                        isLoading={isLoadingUnconfirmed}
                        onApprove={(v) => {
                            setApprovingVisitor(v);
                        }}
                        onPatientClick={handlePatientClick}
                        formatDate={formatDate}
                    />
                </div>
            )}

            {approvingVisitor && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-[slideUp_0.3s_ease-out]">
                        <div className="p-8">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 mx-auto">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Approve Patient</h3>
                            <p className="text-slate-500 text-center mb-8">
                                Are you sure you want to approve <span className="font-semibold text-slate-900">{(approvingVisitor.firstName || approvingVisitor.lastName) ? `${approvingVisitor.firstName} ${approvingVisitor.lastName}`.trim() : "this patient"}</span>? This will move them to the regular patients list.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setApprovingVisitor(null)}
                                    disabled={isApproving}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsApproving(true);
                                        try {
                                            await api.post(`/visitors/${approvingVisitor.id}/approve`);
                                            setApprovingVisitor(null);
                                            fetchUnconfirmed();
                                            if (userData?.entityId && onRefreshVisitors) {
                                                onRefreshVisitors();
                                            }
                                        } catch (err) {
                                            console.error('Failed to approve patient:', err);
                                            alert('Failed to approve patient. Please try again.');
                                        } finally {
                                            setIsApproving(false);
                                        }
                                    }}
                                    disabled={isApproving}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isApproving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Approving...
                                        </>
                                    ) : 'Approve'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showUnauthorizedSubTab && activeSubTab === 'patients' && (
                <div className="flex-1 flex flex-col min-h-0">
                <VisitorsSection
                    visitors={visitors}
                    isLoadingVisitors={isLoadingVisitors}
                    interactions={interactions}
                    allInteractionsForPatients={allInteractions}
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
                    searchContact={searchContact}
                    setSearchContact={setSearchContact}
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
                    unconfirmed={isEditingUnconfirmed}
                />
                </div>
            )}

            {!showUnauthorizedSubTab && activeSubTab === 'registrations' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <InteractionsSection
                        visitors={visitors}
                        interactions={interactions}
                        lastVisits={lastVisits}
                        officers={officers}
                        userData={userData}
                        isLoadingInteractions={isLoadingInteractions}
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
                        onRequestCancel={onRequestCancel}
                        showDeleteRegistrationModal={showDeleteRegistrationModal}
                        setShowDeleteRegistrationModal={setShowDeleteRegistrationModal}
                        registrationToDelete={registrationToDelete}
                        handleDeleteRegistration={handleDeleteRegistration}
                        showCancelRegistrationModal={showCancelRegistrationModal}
                        setShowCancelRegistrationModal={setShowCancelRegistrationModal}
                        registrationToCancel={registrationToCancel}
                        handleCancelRegistration={handleCancelRegistration}
                        isCancellingRegistration={isCancellingRegistration}
                        getVisitorName={getVisitorName}
                        getVisitorSerial={getVisitorSerial}
                        getVisitorHealthCard={getVisitorHealthCard}
                        formatDate={formatDate}
                        isDeletingRegistration={isDeletingRegistration}
                        isCreatingInteraction={isCreatingInteraction}
                        isAssigningInteraction={isAssigningInteraction}
                        pendingInteractions={pendingInteractions}
                        pendingAssignments={pendingAssignments}
                        registrationCount={tabCounts.registrations}
                        assignmentFailed={assignmentFailed}
                        handleDragEnd={handleDragEnd}
                        draggedInteraction={draggedInteraction}
                        onInteractionClick={onInteractionClick}
                        handleRegisterPatient={handleRegisterPatient}
                        onPatientClick={handlePatientClick}
                    />
                </div>
            )}

            {!showUnauthorizedSubTab && activeSubTab === 'reports' && (
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

            {!showUnauthorizedSubTab && activeSubTab === 'billings' && (
                <BillingSection
                    interactions={interactions}
                    isLoadingInteractions={isLoadingInteractions}
                    visitors={visitors}
                    officers={officers}
                    userRole={userData?.role}
                    onInteractionClick={onInteractionClick}
                    onOpenPatientDetails={handlePatientClick}
                    onInteractionUpdated={onInteractionUpdated}
                    billingModalInteraction={billingModalInteraction}
                    onOpenBillNow={setBillingModalInteraction}
                    onCloseBillNow={() => setBillingModalInteraction(null)}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    lastVisits={lastVisits}
                />
            )}

            {!showUnauthorizedSubTab && activeSubTab === 'outgoing_log' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
                    <div className="flex-1 min-h-0 p-4">
                        <OutgoingLogTab entityId={userData?.entityId} />
                    </div>
                </div>
            )}

            {managePatients && (
            <CreatePatientModal
                open={showVisitorModal}
                onClose={() => {
                    setShowVisitorModal(false);
                    setEditingVisitorId?.(null);
                    setVisitorForm({
                        firstName: '',
                        middleName: '',
                        lastName: '',
                        dateOfBirth: '',
                        addressLine: '',
                        city: '',
                        state: '',
                        postalCode: '',
                        gender: '',
                        email: '',
                        phoneH: '',
                        phoneM: '',
                        notes: '',
                        memo: '',
                        allergies: '',
                        drugReactions: '',
                        ongoingHealthConditions: '',
                        specialNotes: '',
                        highBloodPressure: '',
                        heartDisease: '',
                        diabetes: '',
                        cholesterol: '',
                        smoke: '',
                        emergencyName: '',
                        emergencyRelation: '',
                        emergencyPhone: ''
                    });
                    setPhoneData({ fullNumber: '', valid: false });
                    setPhoneHData({ fullNumber: '', valid: false });
                    setPhoneMData({ fullNumber: '', valid: false });
                    setGuardianPhoneData({ fullNumber: '', valid: false });
                    setHealthCardNumber('');
                    setHealthCardVersion('');
                    setHealthCardEffectivityDate('');
                    setHealthCardExpiryDate('');
                    setError('');
                    setFieldErrors({});
                }}
                visitors={useMemo(() => [...visitors, ...unconfirmedVisitors], [visitors, unconfirmedVisitors])}
                editingVisitorId={editingVisitorId}
                nextVisitorSerial={nextVisitorSerial}
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
                onSubmit={handleCreateVisitor}
                handleHealthCardChange={handleHealthCardChange}
                handleHealthCardVersionChange={handleHealthCardVersionChange}
                error={error}
                setError={setError}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
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
                    completedInteractionsForPatient={patientDetailPastInteractions}
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
                    isUnconfirmed={activeSubTab === 'unconfirmed'}
                />
            )}
        </div>
    );
};

export default ReceptionTab;
