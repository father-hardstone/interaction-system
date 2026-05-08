import PhoneInput from './PhoneInput';
import CreatePatientModal from './CreatePatientModal';
import RegisterConfirmationModal from './RegisterConfirmationModal';
import PatientSearchFilters from './PatientSearchFilters';
import { useMasterData } from '../contexts/MasterDataContext';
import { formatPhoneDisplay, parsePhoneToDigits, getVisitorSerialDisplay, formatHealthCardDisplay, parseHealthCardToDigits, formatDateMMDDYYYY, getAgeYearsMonthsDisplay, getLastVisitDisplay } from '../utils/formatUtils';

import { useState, useMemo } from 'react';
import api from '../services/api';

const VisitorsSection = ({
    visitors,
    isLoadingVisitors = false,
    interactions = [],
    allInteractionsForPatients = [],
    lastVisits = {},
    officers = [],
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
    onEditVisitor,
    handlePatientClick,
    onInteractionClick,
    handlePatientDragStart,
    handlePatientDrop,
    isCreatingVisitor,
    isCreatingInteraction = false,
    deletingVisitorId,
    editingVisitorId,
    setEditingVisitorId,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    userData,
    fieldErrors = {},
    setFieldErrors = () => { },
    handleRegisterPatient,
    nextVisitorSerial = '',
    getImageUrl,
    setViewingMedia,
    actionsMode = 'user',
    onDeleteVisitor,
    unconfirmed = false,
}) => {
    const { services = [], diagnostics = [] } = useMasterData();
    const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);
    const [pendingRegisterVisitor, setPendingRegisterVisitor] = useState(null);
    const [reasonForVisit, setReasonForVisit] = useState('new_visit');
    const [visitMode, setVisitMode] = useState('physical');
    const [parentInteractionId, setParentInteractionId] = useState('');
    const [newVisitNotes, setNewVisitNotes] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);
    const [onboardingLink, setOnboardingLink] = useState('');
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [isGeneratingOnboarding, setIsGeneratingOnboarding] = useState(false);

    const generateOnboardingLink = async () => {
        setIsGeneratingOnboarding(true);
        try {
            const res = await api.post('/visitors/onboarding-link', {
                entityId: userData.entityId,
                entitySerial: userData.entitySerial
            });
            const link = res.data.link;
            setOnboardingLink(link);
            setShowOnboardingModal(true);
            
            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(link);
            } catch (copyErr) {
                console.error('Failed to copy to clipboard:', copyErr);
            }

            // Open in new window
            window.open(link, '_blank');
        } catch (err) {
            console.error('Failed to generate onboarding link:', err);
        } finally {
            setIsGeneratingOnboarding(false);
        }
    };

    const confirmRegistration = async () => {
        if (!pendingRegisterVisitor || !handleRegisterPatient) return;
        const success = await handleRegisterPatient(pendingRegisterVisitor, {
            reasonForVisit: reasonForVisit || 'new_visit',
            visitMode: visitMode || 'physical',
            parentInteractionId: (reasonForVisit === 'followup' || reasonForVisit === 'refill_medicine') ? (parentInteractionId || '') : '',
            reasonForVisitNotes: reasonForVisit === 'new_visit' ? newVisitNotes : ''
        });
        if (success) {
            setShowRegisterConfirmModal(false);
            setPendingRegisterVisitor(null);
            setReasonForVisit('new_visit');
            setVisitMode('physical');
            setParentInteractionId('');
            setNewVisitNotes('');
        }
    };

    const initiateRegistration = (visitor) => {
        setPendingRegisterVisitor(visitor);
        setReasonForVisit('new_visit');
        setVisitMode('physical');
        setParentInteractionId('');
        setNewVisitNotes('');
        setShowRegisterConfirmModal(true);
    };

    const closeRegisterConfirmModal = () => {
        if (isCreatingInteraction) return;
        setShowRegisterConfirmModal(false);
        setPendingRegisterVisitor(null);
        setReasonForVisit('new_visit');
        setVisitMode('physical');
        setParentInteractionId('');
        setNewVisitNotes('');
    };

    const interactionsForRegistration = allInteractionsForPatients.length > 0 ? allInteractionsForPatients : interactions;

    const priorVisitsForPatient = useMemo(() => {
        if (!pendingRegisterVisitor) return [];
        return interactions
            .filter(i => i.visitorId === pendingRegisterVisitor.id && i.completed)
            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
    }, [pendingRegisterVisitor, interactions]);

    const onHealthCardVersionChange = handleHealthCardVersionChange || ((e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        setHealthCardVersion(val);
        if (val && /^[A-Za-z]{1,2}$/.test(val)) setFieldErrors(prev => { const n = { ...prev }; delete n.healthCardVersion; return n; });
    });

const searchContactDigits = parsePhoneToDigits(searchContact || '');
    const filteredVisitors = visitors
        .filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial || ''}`.toLowerCase();
            const toDigits = (p) => parsePhoneToDigits(p || '');
            const phoneM = toDigits(v.phoneM || v.phone);
            const phoneB = toDigits(v.phoneB);
            const phoneH = toDigits(v.phoneH);
            const anyPhoneContains = !searchContactDigits || [phoneM, phoneB, phoneH].some(d => d && d.includes(searchContactDigits));
            const healthCardStr = parseHealthCardToDigits(v.healthCardNumber || '');
            const dobStr = (v.dateOfBirth || '').toLowerCase();

            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesMiddleName = !searchMiddleName || middleName.includes(searchMiddleName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const matchesContact = anyPhoneContains;
            const searchHealthCardDigits = parseHealthCardToDigits(searchHealthCard || '');
            const matchesHealthCard = !searchHealthCardDigits || healthCardStr.includes(searchHealthCardDigits);
            const matchesDob = !searchDob || (() => {
                const parts = searchDob.split('-');
                if (parts.length !== 3) return false;
                const [y, m, d] = parts;
                const formattedSearch = `${m}-${d}-${y}`;
                return dobStr.includes(formattedSearch);
            })();

            return matchesFirstName && matchesMiddleName && matchesLastName && matchesSerial && matchesContact && matchesHealthCard && matchesDob;
        });

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Visitors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Patients</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage patients for your entity</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={generateOnboardingLink}
                            disabled={isGeneratingOnboarding}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-2"
                        >
                            {isGeneratingOnboarding ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            )}
                            Patient onboarding form
                        </button>
                        <button
                            onClick={onOpenAddModal || (() => setShowVisitorModal(true))}
                            className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                        >
                            Add a patient
                        </button>
                    </div>
                </div>

                <PatientSearchFilters
                    searchLastName={searchLastName}
                    setSearchLastName={setSearchLastName}
                    searchFirstName={searchFirstName}
                    setSearchFirstName={setSearchFirstName}
                    searchDob={searchDob}
                    setSearchDob={setSearchDob}
                    searchHealthCard={searchHealthCard}
                    setSearchHealthCard={setSearchHealthCard}
                    searchSerial={searchSerial}
                    setSearchSerial={setSearchSerial}
                    searchContact={searchContact}
                    setSearchContact={setSearchContact}
                    dobSearchFocused={dobSearchFocused}
                    setDobSearchFocused={setDobSearchFocused}
                />

                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Special notes</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Version</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Last Visit</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingVisitors ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-sm font-semibold text-slate-600">Loading patients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="px-6 py-8 text-center text-slate-400">
                                        No patients found. Click "Add a patient" to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((visitor) => {
                                    let dragStarted = false;
                                    let touchStartX = 0;
                                    let touchStartY = 0;

                                    return (
                                        <tr
                                            key={visitor.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                            onMouseDown={() => {
                                                dragStarted = false;
                                            }}
                                            onClick={(e) => {
                                                if (!dragStarted) {
                                                    handlePatientClick(visitor);
                                                }
                                            }}
                                            /* Drag and drop suspended for now as per subtab separation */
                                            /* draggable */
                                            /* onDragStart={(e) => {
                                                dragStarted = true;
                                                handlePatientDragStart(e, visitor);
                                                e.currentTarget.style.opacity = '0.4';
                                                e.currentTarget.style.transform = 'scale(0.98)';
                                                e.currentTarget.style.transition = 'all 0.2s';
                                            }}
                                            onDragEnd={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                                e.currentTarget.style.transform = 'scale(1)';
                                                setTimeout(() => {
                                                    dragStarted = false;
                                                }, 200);
                                            }} */
                                            onTouchStart={(e) => {
                                                if (e.touches.length === 1) {
                                                    touchStartX = e.touches[0].clientX;
                                                    touchStartY = e.touches[0].clientY;
                                                    dragStarted = false;
                                                }
                                            }}
                                            onTouchMove={(e) => {
                                                if (e.touches.length === 1 && !dragStarted) {
                                                    const touch = e.touches[0];
                                                    const deltaX = Math.abs(touch.clientX - touchStartX);
                                                    const deltaY = Math.abs(touch.clientY - touchStartY);

                                                    // Start drag if moved more than 10px
                                                    if (deltaX > 10 || deltaY > 10) {
                                                        dragStarted = true;
                                                        e.preventDefault();
                                                        document.body.style.overflow = 'hidden';

                                                        // Visual feedback
                                                        e.currentTarget.style.opacity = '0.5';
                                                        e.currentTarget.style.transform = 'scale(0.95)';

                                                        // Create synthetic drag event
                                                        const syntheticEvent = {
                                                            currentTarget: e.currentTarget,
                                                            dataTransfer: {
                                                                effectAllowed: 'move',
                                                                setData: () => { },
                                                                getData: () => 'patient'
                                                            },
                                                            preventDefault: () => { }
                                                        };
                                                        handlePatientDragStart(syntheticEvent, visitor);
                                                    }
                                                }
                                            }}
                                            onTouchEnd={(e) => {
                                                if (dragStarted) {
                                                    // Restore styles
                                                    e.currentTarget.style.opacity = '1';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    document.body.style.overflow = '';

                                                    // Find drop target
                                                    const touch = e.changedTouches[0];
                                                    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

                                                    if (dropTarget) {
                                                        const dropZone = dropTarget.closest('[data-drop-zone]');
                                                        if (dropZone) {
                                                            // Trigger drop
                                                            const syntheticEvent = {
                                                                preventDefault: () => { },
                                                                stopPropagation: () => { },
                                                                dataTransfer: {
                                                                    getData: () => 'patient'
                                                                },
                                                                type: 'touchend'
                                                            };
                                                            // The drop zone will handle this via its onDrop handler
                                                            const dropEvent = new Event('drop', { bubbles: true });
                                                            dropZone.dispatchEvent(dropEvent);
                                                        }
                                                    }

                                                    setTimeout(() => {
                                                        dragStarted = false;
                                                    }, 200);
                                                }
                                            }}
                                        >
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden md:table-cell text-sm">
                                                {formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}
                                                {visitor.dateOfBirth && (
                                                    <span className="text-slate-500 ml-1">({getAgeYearsMonthsDisplay(visitor)})</span>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700">
                                                <div className="font-medium text-sm">
                                                    {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                </div>
                                                <div className="md:hidden mt-2 space-y-1 text-xs text-slate-500">
                                                    <div>DOB: {formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}{visitor.dateOfBirth ? ` (${getAgeYearsMonthsDisplay(visitor)})` : ''}</div>
                                                    <div>ID: {getVisitorSerialDisplay(visitor)}</div>
                                                    {(visitor.specialNotes && String(visitor.specialNotes).trim()) && (
                                                        <div className="text-red-600 font-medium">Special notes: {String(visitor.specialNotes).trim()}</div>
                                                    )}
                                                    <div>Phone: {formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-'}</div>
                                                    <div>Health Card: {formatHealthCardDisplay(visitor.healthCardNumber || '') || '-'}</div>
                                                    <div>Last Visit: {getLastVisitDisplay(visitor, lastVisits, interactions)}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{getVisitorSerialDisplay(visitor)}</td>
                                            <td className="px-4 sm:px-6 py-4 text-sm">
                                                {(visitor.specialNotes && String(visitor.specialNotes).trim()) ? (
                                                    <span className="text-red-600 font-medium" title={visitor.specialNotes}>{String(visitor.specialNotes).trim()}</span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{formatHealthCardDisplay(visitor.healthCardNumber || '') || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor.healthCardVersion || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">
                                                {getLastVisitDisplay(visitor, lastVisits, interactions)}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditVisitor?.(visitor)}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Edit
                                                    </button>
                                                    {actionsMode === 'entity' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onDeleteVisitor?.(visitor)}
                                                            disabled={deletingVisitorId === visitor.id}
                                                            className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {deletingVisitorId === visitor.id ? (
                                                                <>
                                                                    <svg className="animate-spin h-3.5 w-3.5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Deleting...
                                                                </>
                                                            ) : 'Delete'}
                                                        </button>
                                                    ) : (() => {
                                                        const isRegistered =
                                                            visitor.stillInService === true ||
                                                            interactionsForRegistration.some(i => i.visitorId === visitor.id && !i.completed && !i.cancelled);
                                                        const isRegisteringThis = isCreatingInteraction && pendingRegisterVisitor?.id === visitor.id;
                                                        const isDisabled = isRegistered || isRegisteringThis;
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={() => !isDisabled && initiateRegistration(visitor)}
                                                                disabled={isDisabled}
                                                                className={`px-3 py-1 ${isDisabled ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[90px]`}
                                                            >
                                                                {isRegisteringThis ? (
                                                                    <>
                                                                        <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Registering...
                                                                    </>
                                                                ) : isRegistered ? 'In Service' : 'Register'}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RegisterConfirmationModal
                open={showRegisterConfirmModal}
                pendingRegisterVisitor={pendingRegisterVisitor}
                reasonForVisit={reasonForVisit}
                setReasonForVisit={setReasonForVisit}
                visitMode={visitMode}
                setVisitMode={setVisitMode}
                parentInteractionId={parentInteractionId}
                setParentInteractionId={setParentInteractionId}
                newVisitNotes={newVisitNotes}
                setNewVisitNotes={setNewVisitNotes}
                priorVisitsForPatient={priorVisitsForPatient}
                formatDate={formatDate}
                isCreatingInteraction={isCreatingInteraction}
                onClose={closeRegisterConfirmModal}
                onConfirm={confirmRegistration}
            />

            {/* Onboarding Link Modal */}
            {showOnboardingModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-[scaleIn_0.2s_ease-out]">
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold">Onboarding Link Ready</h3>
                            <p className="text-indigo-100 text-sm mt-1">Expires in 30 minutes. One-time use only.</p>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registration Link</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={onboardingLink} 
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none"
                                    />
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(onboardingLink);
                                            alert('Link copied to clipboard!');
                                        }}
                                        className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                                        title="Copy Link"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => window.open(onboardingLink, '_blank')}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all"
                                >
                                    Open Link
                                </button>
                                <button 
                                    onClick={() => setShowOnboardingModal(false)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorsSection;
