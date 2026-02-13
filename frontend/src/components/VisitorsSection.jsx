import PhoneInput from './PhoneInput';
import { useMasterData } from '../contexts/MasterDataContext';
import { formatPhoneDisplay, getVisitorSerialDisplay, formatHealthCardDisplay, parseHealthCardToDigits, formatDateMMDDYYYY, stripEntityPrefix } from '../utils/formatUtils';

import { useState, useMemo } from 'react';

const REASON_FOR_VISIT_OPTIONS = [
    { value: 'new_visit', label: 'New visit' },
    { value: 'followup', label: 'Followup' },
    { value: 'refill_medicine', label: 'Refill medicine' }
];

const VisitorsSection = ({
    visitors,
    isLoadingVisitors = false,
    interactions = [],
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
    setViewingMedia
}) => {
    const { services = [], diagnostics = [] } = useMasterData();
    const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);
    const [pendingRegisterVisitor, setPendingRegisterVisitor] = useState(null);
    const [reasonForVisit, setReasonForVisit] = useState('new_visit');
    const [parentInteractionId, setParentInteractionId] = useState('');
    const [newVisitNotes, setNewVisitNotes] = useState('');
    const [guardianIdError, setGuardianIdError] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);

    const validateDates = (effectivity, expiry) => {
        if (effectivity && expiry) {
            const effDate = new Date(effectivity);
            const expDate = new Date(expiry);
            if (expDate < effDate) {
                return 'Expiry date cannot be before effectivity date';
            }
        }
        return '';
    };

    const confirmRegistration = async () => {
        if (!pendingRegisterVisitor || !handleRegisterPatient) return;
        if (reasonForVisit === 'followup' && !parentInteractionId) return;
        const success = await handleRegisterPatient(pendingRegisterVisitor, {
            reasonForVisit: reasonForVisit || 'new_visit',
            parentInteractionId: (reasonForVisit === 'followup' || reasonForVisit === 'refill_medicine') ? parentInteractionId : '',
            reasonForVisitNotes: reasonForVisit === 'new_visit' ? newVisitNotes : ''
        });
        if (success) {
            setShowRegisterConfirmModal(false);
            setPendingRegisterVisitor(null);
            setReasonForVisit('new_visit');
            setParentInteractionId('');
            setNewVisitNotes('');
        }
    };

    const initiateRegistration = (visitor) => {
        setPendingRegisterVisitor(visitor);
        setReasonForVisit('new_visit');
        setParentInteractionId('');
        setNewVisitNotes('');
        setShowRegisterConfirmModal(true);
    };

    const priorVisitsForPatient = useMemo(() => {
        if (!pendingRegisterVisitor) return [];
        return interactions
            .filter(i => i.visitorId === pendingRegisterVisitor.id && i.completed)
            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
    }, [pendingRegisterVisitor, interactions]);

    const handlePostalChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
        value = value.slice(0, 7);
        setVisitorForm({ ...visitorForm, postalCode: value });
        const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
        if (!value.trim()) setFieldErrors(prev => ({ ...prev, postalCode: 'Postal code is required' }));
        else if (value.length === 7 && !postalMask.test(value)) setFieldErrors(prev => ({ ...prev, postalCode: 'Must be format A1B-2C3' }));
        else setFieldErrors(prev => { const n = { ...prev }; delete n.postalCode; return n; });
    };

    const onHealthCardVersionChange = handleHealthCardVersionChange || ((e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        setHealthCardVersion(val);
        if (val && /^[A-Za-z]{1,2}$/.test(val)) setFieldErrors(prev => { const n = { ...prev }; delete n.healthCardVersion; return n; });
    });



    const handleGuardianIdChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
        let updates = { ...visitorForm, guardianId: val };

        setGuardianIdError('');

        if (val.length < 6) {
            // Any removal or incomplete ID: clear guardian name & contact, enable editing
            updates.guardianName = '';
            updates.guardianPhone = '';
            setGuardianPhoneData({ fullNumber: '', valid: false });
            if (val.length > 0) {
                setGuardianIdError('Guardian ID must be 6 digits');
            }
        } else if (val.length === 6) {
            const guardian = visitors.find((v) => {
                const serial = v.serial ? String(v.serial).padStart(6, '0') : '';
                return serial === val;
            });

            if (guardian) {
                updates.guardianName = guardian.firstName ? `${guardian.firstName} ${guardian.lastName || ''}`.trim() : '';
                setGuardianPhoneData({ fullNumber: guardian.phone || '', valid: !!guardian.phone });
                setGuardianIdError('');
            } else {
                updates.guardianName = '';
                updates.guardianPhone = '';
                setGuardianPhoneData({ fullNumber: '', valid: false });
                setGuardianIdError('Guardian ID not found in the system');
            }
        }

        setVisitorForm(updates);
    };

    const guardianIdValid = useMemo(() => {
        const id = visitorForm.guardianId || '';
        if (id.length !== 6) return false;
        return visitors.some((v) => {
            const serial = v.serial ? String(v.serial).padStart(6, '0') : '';
            return serial === id;
        });
    }, [visitorForm.guardianId, visitors]);

    const guardianIdInvalid = useMemo(() => {
        const id = visitorForm.guardianId || '';
        if (id.length === 0) return false;
        if (id.length < 6) return true;
        return !guardianIdValid;
    }, [visitorForm.guardianId, guardianIdValid]);
    const filteredVisitors = visitors
        .filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial || ''}`.toLowerCase();
            const phoneDigits = (v.phone || '').replace(/\D/g, '').replace(/^1/, '');
            const searchPhoneDigits = (searchPhone || '').replace(/\D/g, '');
            const healthCardStr = parseHealthCardToDigits(v.healthCardNumber || '');
            const dobStr = (v.dateOfBirth || '').toLowerCase();

            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesMiddleName = !searchMiddleName || middleName.includes(searchMiddleName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const matchesPhone = !searchPhone || phoneDigits.includes(searchPhoneDigits);
            const searchHealthCardDigits = parseHealthCardToDigits(searchHealthCard || '');
            const matchesHealthCard = !searchHealthCardDigits || healthCardStr.includes(searchHealthCardDigits);
            const matchesDob = !searchDob || (() => {
                const parts = searchDob.split('-');
                if (parts.length !== 3) return false;
                const [y, m, d] = parts;
                const formattedSearch = `${m}-${d}-${y}`;
                return dobStr.includes(formattedSearch);
            })();

            return matchesFirstName && matchesMiddleName && matchesLastName && matchesSerial && matchesPhone && matchesHealthCard && matchesDob;
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
                    <button
                        onClick={onOpenAddModal || (() => setShowVisitorModal(true))}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors w-full sm:w-auto"
                    >
                        Add a patient
                    </button>
                </div>

                <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 border-b border-slate-200 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search by last name"
                        value={searchLastName}
                        onChange={(e) => setSearchLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by first name"
                        value={searchFirstName}
                        onChange={(e) => setSearchFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <div className="relative flex items-center">
                        <input
                            type={dobSearchFocused || searchDob ? "date" : "text"}
                            placeholder={!dobSearchFocused && !searchDob ? "Search by DOB" : ""}
                            value={searchDob}
                            onFocus={() => setDobSearchFocused(true)}
                            onBlur={() => setDobSearchFocused(false)}
                            onChange={(e) => setSearchDob(e.target.value)}
                            className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 placeholder-slate-400"
                        />
                        {searchDob && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchDob('');
                                }}
                                className="absolute right-9 text-slate-400 hover:text-slate-600 transition-colors bg-white px-1"
                                title="Clear date"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <input
                        type="text"
                        placeholder="Search by health card (XXXX-XXX-XXX)"
                        value={searchHealthCard}
                        onChange={(e) => setSearchHealthCard(formatHealthCardDisplay(parseHealthCardToDigits(e.target.value)))}
                        maxLength={12}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchSerial}
                        onChange={(e) => setSearchSerial(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        maxLength={6}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
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
                                    <td colSpan="9" className="px-6 py-16 text-center">
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
                                    <td colSpan="9" className="px-6 py-8 text-center text-slate-400">
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
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden md:table-cell text-sm">{formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700">
                                                <div className="font-medium text-sm">
                                                    {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                </div>
                                                <div className="md:hidden mt-2 space-y-1 text-xs text-slate-500">
                                                    <div>DOB: {formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}</div>
                                                    <div>ID: {getVisitorSerialDisplay(visitor)}</div>
                                                    <div>Phone: {formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-'}</div>
                                                    <div>Health Card: {formatHealthCardDisplay(visitor.healthCardNumber || '') || '-'}</div>
                                                    <div>Last Visit: {(() => {
                                                        const lastVisit = lastVisits[visitor.id] || interactions
                                                            .filter(i => i.visitorId === visitor.id && i.completed)
                                                            .sort((a, b) => {
                                                                const dateA = new Date(a.editedAt || a.createdAt);
                                                                const dateB = new Date(b.editedAt || b.createdAt);
                                                                return dateB - dateA;
                                                            })[0];
                                                        return lastVisit ? formatDate(lastVisit.editedAt || lastVisit.createdAt, true) : '-';
                                                    })()}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{getVisitorSerialDisplay(visitor)}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{formatHealthCardDisplay(visitor.healthCardNumber || '') || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor.healthCardVersion || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">
                                                {(() => {
                                                    const lastVisit = lastVisits[visitor.id] || interactions
                                                        .filter(i => i.visitorId === visitor.id && i.completed)
                                                        .sort((a, b) => {
                                                            const dateA = new Date(a.editedAt || a.createdAt);
                                                            const dateB = new Date(b.editedAt || b.createdAt);
                                                            return dateB - dateA;
                                                        })[0];
                                                    if (lastVisit) {
                                                        return formatDate(lastVisit.editedAt || lastVisit.createdAt, true);
                                                    }
                                                    return '-';
                                                })()}
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
                                                    {(() => {
                                                        const isRegistered = interactions.some(i => i.visitorId === visitor.id && !i.completed);
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

            {/* Add Visitor Modal */}
            {showVisitorModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[1000]">
                    <div className="bg-white w-full max-w-[720px] max-h-[95vh] overflow-y-auto p-4 sm:p-5 lg:p-6 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]">
                        {/* Header: Title | ID + Buttons div */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 shrink-0">
                                {editingVisitorId ? 'Edit Patient' : 'Add New Patient'}
                            </h2>
                            <div className="flex-1 min-w-0 flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl ml-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-blue-900">Patient ID:</span>
                                    <span className="text-sm font-semibold text-blue-700 font-sans">
                                        {editingVisitorId ? (
                                            (() => {
                                                const v = visitors.find(v => v.id === editingVisitorId);
                                                return v ? getVisitorSerialDisplay(v) : 'Loading...';
                                            })()
                                        ) : (nextVisitorSerial ? String(nextVisitorSerial).padStart(6, '0') : '-')}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
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
                                                allergies: 'N/A',
                                                drugReactions: 'N/A',
                                                ongoingHealthConditions: 'N/A',
                                                specialNotes: '',
                                                highBloodPressure: '',
                                                heartDisease: '',
                                                diabetes: '',
                                                cholesterol: '',
                                                smoke: '',
                                                guardianName: '',
                                                guardianId: '',
                                                guardianPhone: ''
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
                                        className="px-4 py-2 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors text-sm font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="visitor-form"
                                        disabled={isCreatingVisitor}
                                        className="px-4 py-2 bg-primary text-white border-none rounded-xl font-semibold text-sm cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                    >
                                        {isCreatingVisitor ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {editingVisitorId ? 'Saving...' : 'Creating...'}
                                            </>
                                        ) : (
                                            editingVisitorId ? 'Save Changes' : 'Create Patient'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {error && <p className="bg-red-50 border border-red-200 text-red-600 py-2 px-4 rounded-xl text-sm mb-4">{error}</p>}

                        <form id="visitor-form" onSubmit={handleCreateVisitor} className="flex flex-col gap-3">
                            {/* Line 1: Last Name, First Name, Middle Name */}
                            {(() => {
                                const rowHasError = fieldErrors.lastName || fieldErrors.firstName;
                                return (
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-36">
                                            <label className="text-sm font-semibold text-slate-900">Last Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                value={visitorForm.lastName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, lastName: val });
                                                    if (!val.trim()) setFieldErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.lastName; return n; });
                                                }}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.lastName && <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>}</div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-36">
                                            <label className="text-sm font-semibold text-slate-900">First Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                value={visitorForm.firstName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, firstName: val });
                                                    if (!val.trim()) setFieldErrors(prev => ({ ...prev, firstName: 'First name is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.firstName; return n; });
                                                }}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.firstName && <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>}</div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-36">
                                            <label className="text-sm font-semibold text-slate-900">Middle Name</label>
                                            <input
                                                type="text"
                                                placeholder="Middle name"
                                                value={visitorForm.middleName}
                                                onChange={(e) => setVisitorForm({ ...visitorForm, middleName: e.target.value })}
                                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                            />
                                            {rowHasError && <div className="min-h-[1.25rem]" />}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Line 2: Health Card Number, Version, Effectivity & Expiry Dates (single row, tight spacing) */}
                            {(() => {
                                const rowHasError = fieldErrors.healthCard || fieldErrors.healthCardVersion || fieldErrors.healthCardEffectivity || fieldErrors.healthCardExpiry || fieldErrors.healthCardDate;
                                return (
                                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-2">
                                        <div className="w-full md:w-36 md:min-w-[9rem] flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Health Card Number <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="XXXX-XXX-XXX"
                                                value={healthCardNumber}
                                                onChange={handleHealthCardChange}
                                                maxLength={12}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCard ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.healthCard && <p className="text-red-500 text-xs">{fieldErrors.healthCard}</p>}</div>
                                        </div>
                                        <div className="w-full md:w-[calc(4rem)] flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Version <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="AB"
                                                value={healthCardVersion}
                                                onChange={onHealthCardVersionChange}
                                                maxLength={2}
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCardVersion ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.healthCardVersion && <p className="text-red-500 text-xs">{fieldErrors.healthCardVersion}</p>}</div>
                                        </div>
                                        <div className="w-full md:w-40 flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Effectivity Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={healthCardEffectivityDate || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setHealthCardEffectivityDate(val);
                                                    setFieldErrors(prev => {
                                                        const n = { ...prev }; delete n.healthCardEffectivity; delete n.healthCardDate;
                                                        if (val && healthCardExpiryDate) {
                                                            const msg = validateDates(val, healthCardExpiryDate);
                                                            if (msg) n.healthCardDate = msg;
                                                        }
                                                        return n;
                                                    });
                                                }}
                                                className={`w-full py-2.5 px-3.5 border ${(fieldErrors.healthCardEffectivity || fieldErrors.healthCardDate) ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{(fieldErrors.healthCardEffectivity || fieldErrors.healthCardDate) && <p className="text-red-500 text-xs">{fieldErrors.healthCardEffectivity || fieldErrors.healthCardDate}</p>}</div>
                                        </div>
                                        <div className="w-full md:w-40 flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Expiry Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={healthCardExpiryDate || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setHealthCardExpiryDate(val);
                                                    setFieldErrors(prev => {
                                                        const n = { ...prev }; delete n.healthCardExpiry; delete n.healthCardDate;
                                                        if (healthCardEffectivityDate && val) {
                                                            const msg = validateDates(healthCardEffectivityDate, val);
                                                            if (msg) n.healthCardDate = msg;
                                                        }
                                                        return n;
                                                    });
                                                }}
                                                className={`w-full py-2.5 px-3.5 border ${(fieldErrors.healthCardExpiry || fieldErrors.healthCardDate) ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{(fieldErrors.healthCardExpiry || fieldErrors.healthCardDate) && <p className="text-red-500 text-xs w-full">{fieldErrors.healthCardExpiry || fieldErrors.healthCardDate}</p>}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Line 3: DOB (Calendar), Age (Calculated), Sex */}
                            {(() => {
                                const rowHasError = fieldErrors.dob || fieldErrors.gender;
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Date of Birth <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={visitorForm.dateOfBirth ? (() => {
                                                    const parts = visitorForm.dateOfBirth.split('-');
                                                    if (parts.length === 3) {
                                                        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                                                    }
                                                    return '';
                                                })() : ''}
                                                max={new Date().toISOString().split('T')[0]} // Native browser constraint
                                                onChange={(e) => {
                                                    const dateValue = e.target.value;
                                                    if (dateValue) {
                                                        const parts = dateValue.split('-');
                                                        const formatted = `${parts[1]}-${parts[2]}-${parts[0]}`;

                                                        // Future date check
                                                        const selectedDate = new Date(dateValue);
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);

                                                        if (selectedDate > today) {
                                                            setFieldErrors(prev => ({ ...prev, dob: 'Date of birth cannot be in the future' }));
                                                        } else {
                                                            setFieldErrors(prev => { const n = { ...prev }; delete n.dob; return n; });
                                                        }

                                                        setVisitorForm({ ...visitorForm, dateOfBirth: formatted });
                                                    } else {
                                                        setVisitorForm({ ...visitorForm, dateOfBirth: '' });
                                                        setFieldErrors(prev => ({ ...prev, dob: 'Date of birth is required' }));
                                                    }
                                                }}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.dob ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.dob && <p className="text-red-500 text-xs">{fieldErrors.dob}</p>}</div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:w-28">
                                            <label className="text-sm font-semibold text-slate-900">Age</label>
                                            <input
                                                type="text"
                                                value={(() => {
                                                    if (!visitorForm.dateOfBirth) return '';
                                                    const parts = visitorForm.dateOfBirth.split('-');
                                                    if (parts.length !== 3) return '';
                                                    const month = parseInt(parts[0], 10) - 1;
                                                    const day = parseInt(parts[1], 10);
                                                    const year = parseInt(parts[2], 10);
                                                    const dob = new Date(year, month, day);
                                                    const today = new Date();
                                                    let years = today.getFullYear() - dob.getFullYear();
                                                    let months = today.getMonth() - dob.getMonth();
                                                    if (today.getDate() < dob.getDate()) months--;
                                                    if (months < 0) { years--; months += 12; }
                                                    if (isNaN(years) || years < 0) return '';
                                                    if (years === 0) return `${months} mo`;
                                                    return months > 0 ? `${years} yr ${months} mo` : `${years} yr`;
                                                })()}
                                                readOnly
                                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                                            />
                                            {rowHasError && <div className="min-h-[1.25rem]" />}
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:w-32">
                                            <label className="text-sm font-semibold text-slate-900">Sex <span className="text-red-500">*</span></label>
                                            <div className="flex flex-row gap-4 items-center">
                                                {['M', 'F', 'O'].map((opt) => (
                                                    <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="sex"
                                                            value={opt}
                                                            checked={visitorForm.gender === opt}
                                                            onChange={() => {
                                                                setVisitorForm({ ...visitorForm, gender: opt });
                                                                setFieldErrors(prev => { const n = { ...prev }; delete n.gender; return n; });
                                                            }}
                                                            className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                                                        />
                                                        <span className="text-sm font-medium text-slate-800">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.gender && <p className="text-red-500 text-xs">{fieldErrors.gender}</p>}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Phone (M), Phone (B), Phone (H) */}
                            {(() => {
                                const rowHasError = fieldErrors.phoneM;
                                return (
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-40">
                                            <label className="text-sm font-semibold text-slate-900">Phone (M) <span className="text-red-500">*</span></label>
                                            <PhoneInput
                                                value={phoneMData.fullNumber}
                                                onChange={setPhoneMData}
                                                required
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.phoneM && <p className="text-red-500 text-xs">{fieldErrors.phoneM}</p>}</div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-40">
                                            <label className="text-sm font-semibold text-slate-900">Phone (B)</label>
                                            <PhoneInput
                                                value={phoneData.fullNumber}
                                                onChange={setPhoneData}
                                            />
                                            {rowHasError && <div className="min-h-[1.25rem]" />}
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-40">
                                            <label className="text-sm font-semibold text-slate-900">Phone (H)</label>
                                            <PhoneInput
                                                value={phoneHData.fullNumber}
                                                onChange={setPhoneHData}
                                            />
                                            {rowHasError && <div className="min-h-[1.25rem]" />}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Email */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex flex-col gap-2 w-full sm:min-w-[12rem] sm:w-72">
                                    <label className="text-sm font-semibold text-slate-900">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={visitorForm.email ?? ''}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Street, City, Province, Postal Code */}
                            {(() => {
                                const rowHasError = fieldErrors.street || fieldErrors.city || fieldErrors.state || fieldErrors.postalCode;
                                return (
                                    <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-2">
                                        <div className="w-full md:min-w-[10rem] md:w-48 flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Street <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Street address"
                                                value={visitorForm.addressLine}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, addressLine: val });
                                                    if (!val.trim()) setFieldErrors(prev => ({ ...prev, street: 'Street is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.street; return n; });
                                                }}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.street ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.street && <p className="text-red-500 text-xs">{fieldErrors.street}</p>}</div>
                                        </div>
                                        <div className="w-full md:w-28 flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">City <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={visitorForm.city}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, city: val });
                                                    if (!val.trim()) setFieldErrors(prev => ({ ...prev, city: 'City is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                                                }}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.city && <p className="text-red-500 text-xs">{fieldErrors.city}</p>}</div>
                                        </div>
                                        <div className="w-full md:w-40 flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Province <span className="text-red-500">*</span></label>
                                            <select
                                                value={visitorForm.state}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, state: val });
                                                    if (!val) setFieldErrors(prev => ({ ...prev, state: 'Province is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.state; return n; });
                                                }}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.state ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            >
                                                <option value="">Select province</option>
                                                <option value="Alberta">Alberta</option>
                                                <option value="British Columbia">British Columbia</option>
                                                <option value="Manitoba">Manitoba</option>
                                                <option value="New Brunswick">New Brunswick</option>
                                                <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                                                <option value="Northwest Territories">Northwest Territories</option>
                                                <option value="Nova Scotia">Nova Scotia</option>
                                                <option value="Nunavut">Nunavut</option>
                                                <option value="Ontario">Ontario</option>
                                                <option value="Prince Edward Island">Prince Edward Island</option>
                                                <option value="Quebec">Quebec</option>
                                                <option value="Saskatchewan">Saskatchewan</option>
                                                <option value="Yukon">Yukon</option>
                                            </select>
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.state && <p className="text-red-500 text-xs">{fieldErrors.state}</p>}</div>
                                        </div>
                                        <div className="w-full md:w-32 flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Postal Code <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="A1B-2C3"
                                                value={visitorForm.postalCode}
                                                onChange={handlePostalChange}
                                                maxLength={7}
                                                required
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.postalCode ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{fieldErrors.postalCode && <p className="text-red-500 text-xs">{fieldErrors.postalCode}</p>}</div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Allergies, Drug Reactions, Ongoing Health Conditions, Special Notes - red highlighter */}
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-red-900">Allergies <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="N/A if none"
                                            value={visitorForm.allergies ?? ''}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, allergies: e.target.value })}
                                            className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-red-900">Drug Reactions <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="N/A if none"
                                            value={visitorForm.drugReactions ?? ''}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, drugReactions: e.target.value })}
                                            className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-red-900">Ongoing Health Conditions <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="N/A if none"
                                            value={visitorForm.ongoingHealthConditions ?? ''}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, ongoingHealthConditions: e.target.value })}
                                            className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-red-900">Special Notes</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            value={visitorForm.specialNotes ?? ''}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, specialNotes: e.target.value })}
                                            className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Past medical history */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                <label className="text-sm font-semibold text-slate-900 block mb-3">Past medical history</label>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {[
                                        { key: 'highBloodPressure', label: 'High blood pressure' },
                                        { key: 'heartDisease', label: 'Heart disease' },
                                        { key: 'diabetes', label: 'Diabetes' },
                                        { key: 'cholesterol', label: 'Cholesterol' },
                                        { key: 'smoke', label: 'Smoke' }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center gap-3">
                                            <span className="text-sm text-slate-700 whitespace-nowrap">{label}</span>
                                            <div className="flex items-center gap-2">
                                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={key}
                                                        value="yes"
                                                        checked={visitorForm[key] === 'yes'}
                                                        onChange={() => setVisitorForm({ ...visitorForm, [key]: 'yes' })}
                                                        className="w-3.5 h-3.5 text-primary border-slate-300"
                                                    />
                                                    <span className="text-xs font-medium text-slate-700">Yes</span>
                                                </label>
                                                <label className="inline-flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={key}
                                                        value="no"
                                                        checked={visitorForm[key] === 'no'}
                                                        onChange={() => setVisitorForm({ ...visitorForm, [key]: 'no' })}
                                                        className="w-3.5 h-3.5 text-primary border-slate-300"
                                                    />
                                                    <span className="text-xs font-medium text-slate-700">No</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Guardian Info (optional) */}
                            {(() => {
                                const rowHasError = !!guardianIdError;
                                return (
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[6rem] sm:w-24">
                                            <label className="text-sm font-semibold text-slate-900">Guardian ID</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="000000"
                                                    value={visitorForm.guardianId}
                                                    onChange={handleGuardianIdChange}
                                                    maxLength={6}
                                                    className={`w-full py-2.5 pl-3.5 pr-10 border ${guardianIdError ? 'border-red-300 bg-red-50' : guardianIdValid ? 'border-green-300 bg-green-50/50' : 'border-slate-200 bg-slate-50'} rounded-xl font-sans text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center w-5 h-5">
                                                    {guardianIdValid && (
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white" title="Valid guardian ID">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                    {guardianIdInvalid && (
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white" title="Invalid guardian ID">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={rowHasError ? 'min-h-[1.25rem]' : ''}>{guardianIdError && <p className="text-red-500 text-xs">{guardianIdError}</p>}</div>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[12rem] sm:w-56 flex-1">
                                            <label className="text-sm font-semibold text-slate-900">Guardian Name <span className="text-xs text-slate-400 font-normal">(max 3 words)</span></label>
                                            <input
                                                type="text"
                                                placeholder="Enter guardian name"
                                                value={visitorForm.guardianName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const words = val.trim().split(/\s+/).filter(w => w.length > 0);
                                                    if (words.length <= 3) {
                                                        setVisitorForm({ ...visitorForm, guardianName: val });
                                                    } else {
                                                        const limitedVal = words.slice(0, 3).join(' ');
                                                        setVisitorForm({ ...visitorForm, guardianName: limitedVal });
                                                    }
                                                }}
                                                disabled={guardianIdValid}
                                                readOnly={guardianIdValid}
                                                className={`w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 ${guardianIdValid ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-slate-50 text-slate-900 focus:border-primary focus:bg-white'}`}
                                            />
                                            {rowHasError && <div className="min-h-[1.25rem]" />}
                                        </div>
                                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-40">
                                            <label className="text-sm font-semibold text-slate-900">Guardian Contact (M)</label>
                                            <PhoneInput
                                                value={guardianPhoneData.fullNumber}
                                                onChange={setGuardianPhoneData}
                                                disabled={guardianIdValid}
                                            />
                                            {rowHasError && <div className="min-h-[1.25rem]" />}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Notes and Memo */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex flex-col gap-2 flex-1 min-w-[12rem] sm:min-w-[14rem]">
                                    <label className="text-sm font-semibold text-slate-900">
                                        Notes <span className="text-xs text-slate-400 font-normal">({visitorForm.notes?.length || 0}/100)</span>
                                    </label>
                                    <textarea
                                        value={visitorForm.notes}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.length <= 100) {
                                                setVisitorForm({ ...visitorForm, notes: val });
                                            }
                                        }}
                                        maxLength={300}
                                        className="w-full min-h-[56px] max-h-[100px] py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 flex-1 min-w-[12rem] sm:min-w-[14rem]">
                                    <label className="text-sm font-semibold text-slate-900">
                                        Memo <span className="text-xs text-slate-400 font-normal">({visitorForm.memo?.length || 0}/100)</span>
                                    </label>
                                    <textarea
                                        value={visitorForm.memo}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val.length <= 100) {
                                                setVisitorForm({ ...visitorForm, memo: val });
                                            }
                                        }}
                                        maxLength={300}
                                        className="w-full min-h-[56px] max-h-[100px] py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100 resize-y"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register Confirmation Modal */}
            {
                showRegisterConfirmModal && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4 pb-4 pt-0 !mt-0">
                        <div
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => !isCreatingInteraction && (setShowRegisterConfirmModal(false), setPendingRegisterVisitor(null), setReasonForVisit('new_visit'), setParentInteractionId(''), setNewVisitNotes(''))}
                        />
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">Confirm Registration</h3>
                                <p className="text-slate-600 text-sm mb-4 text-center">
                                    Register an interaction for {pendingRegisterVisitor ? `${pendingRegisterVisitor.firstName || ''} ${pendingRegisterVisitor.lastName || ''}`.trim() : 'this patient'}?
                                </p>
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for visit</label>
                                        <select
                                            value={reasonForVisit}
                                            onChange={(e) => {
                                                setReasonForVisit(e.target.value);
                                                setParentInteractionId('');
                                            }}
                                            className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                        >
                                            {REASON_FOR_VISIT_OPTIONS.map((opt) => (
                                                <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {reasonForVisit === 'new_visit' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes (optional)</label>
                                            <input
                                                type="text"
                                                value={newVisitNotes}
                                                onChange={(e) => setNewVisitNotes(e.target.value)}
                                                placeholder="e.g. reason for visit, chief complaint"
                                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                            />
                                        </div>
                                    )}
                                    {(reasonForVisit === 'followup' || reasonForVisit === 'refill_medicine') && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                                {reasonForVisit === 'followup' ? 'Prior visit (followup to)' : 'Prior visit (refill from)'}
                                                {reasonForVisit === 'followup' && <span className="text-red-500 ml-0.5">*</span>}
                                            </label>
                                            <select
                                                value={parentInteractionId}
                                                onChange={(e) => setParentInteractionId(e.target.value)}
                                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="">— Select prior visit —</option>
                                                {priorVisitsForPatient.map((i) => (
                                                    <option key={i.id} value={i.id}>
                                                        {stripEntityPrefix(i.interactionSerial) || 'REG'} — {formatDate(i.editedAt || i.createdAt, true)}
                                                    </option>
                                                ))}
                                            </select>
                                            {priorVisitsForPatient.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1">No completed visits found for this patient.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => {
                                            if (!isCreatingInteraction) {
                                                setShowRegisterConfirmModal(false);
                                                setPendingRegisterVisitor(null);
                                                setReasonForVisit('new_visit');
                                                setParentInteractionId('');
                                                setNewVisitNotes('');
                                            }
                                        }}
                                        disabled={isCreatingInteraction}
                                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        No, cancel
                                    </button>
                                    <button
                                        onClick={confirmRegistration}
                                        disabled={isCreatingInteraction || (reasonForVisit === 'followup' && !parentInteractionId)}
                                        className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-200/50 disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                                    >
                                        {isCreatingInteraction ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Registering...
                                            </>
                                        ) : (
                                            'Yes, register'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default VisitorsSection;
