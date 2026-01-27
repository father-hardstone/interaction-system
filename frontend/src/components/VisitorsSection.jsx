import PhoneInput from './PhoneInput';
import ReportUpload from './ReportUpload';
import { reportService } from '../services/reportService';
import api from '../services/api';
import PatientDetailsModal from './PatientDetailsModal';

import { useState, useMemo, useEffect } from 'react';

const REPORT_TYPES = [
    { value: 'blood_test', label: 'Blood Test' },
    { value: 'x_ray', label: 'X-Ray' },
    { value: 'ultrasound', label: 'Ultrasound' },
    { value: 'ct_scan', label: 'CT Scan' },
    { value: 'mri_scan', label: 'MRI Scan' },
    { value: 'ecg', label: 'ECG' },
    { value: 'pathology', label: 'Pathology' },
    { value: 'urine_test', label: 'Urine Test' },
    { value: 'other', label: 'Other' }
];

const VisitorsSection = ({
    visitors,
    interactions = [],
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
    onEditVisitor,
    handlePatientClick,
    selectedPatient,
    showPatientDetailModal,
    setShowPatientDetailModal,
    handlePatientDragStart,
    handlePatientDrop,
    isCreatingVisitor,
    deletingVisitorId,
    editingVisitorId,
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
    const [expandedInteractionIds, setExpandedInteractionIds] = useState({});
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [deletingReportId, setDeletingReportId] = useState(null);
    const [services, setServices] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);
    const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);
    const [pendingRegisterVisitor, setPendingRegisterVisitor] = useState(null);
    const [guardianIdError, setGuardianIdError] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [servicesRes, diagnosticsRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/diagnostics')
                ]);
                setServices(servicesRes.data || []);
                setDiagnostics(diagnosticsRes.data || []);
            } catch (error) {
                console.error('Error fetching master data:', error);
            }
        };
        fetchMasterData();
    }, []);

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

    // Get completed interactions for selected patient
    const completedInteractionsForPatient = useMemo(() => {
        if (!selectedPatient) return [];
        return interactions
            .filter((i) => i.visitorId === selectedPatient.id && i.completed)
            .sort((a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime());
    }, [interactions, selectedPatient]);

    // Load reports when patient detail modal opens
    useEffect(() => {
        if (showPatientDetailModal && selectedPatient) {
            loadReports();
        } else {
            setReports([]);
        }
    }, [showPatientDetailModal, selectedPatient]);

    const loadReports = async () => {
        if (!selectedPatient) return;
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

    const handleReportUploadSuccess = () => {
        loadReports();
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return;
        }

        setDeletingReportId(reportId);
        try {
            await reportService.delete(reportId);
            await loadReports();
        } catch (error) {
            console.error('Failed to delete report:', error);
            alert('Failed to delete report. Please try again.');
        } finally {
            setDeletingReportId(null);
        }
    };

    const confirmRegistration = () => {
        if (pendingRegisterVisitor && handleRegisterPatient) {
            handleRegisterPatient(pendingRegisterVisitor);
        }
        setShowRegisterConfirmModal(false);
        setPendingRegisterVisitor(null);
    };

    const initiateRegistration = (visitor) => {
        setPendingRegisterVisitor(visitor);
        setShowRegisterConfirmModal(true);
    };

    const handlePostalChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
        value = value.slice(0, 7);
        setVisitorForm({ ...visitorForm, postalCode: value });
    };

    const handleHealthCardVersionChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        setHealthCardVersion(val);
    };



    const handleGuardianIdChange = (e) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6); // Only digits, max 6
        let updates = { ...visitorForm, guardianId: val };

        // Clear error when changing
        setGuardianIdError('');

        if (val.length === 6) {
            // Try to find guardian by serial number (6 digits)
            const guardian = visitors.find((v) => {
                const serial = v.serial ? String(v.serial).padStart(6, '0') : '';
                return serial === val;
            });

            if (guardian) {
                // Auto-fill only if fields are empty (don't overwrite manual entries)
                if (!updates.guardianName) {
                    updates.guardianName = guardian.firstName ? `${guardian.firstName} ${guardian.lastName || ''}`.trim() : '';
                }
                if (!guardianPhoneData.fullNumber) {
                    setGuardianPhoneData({ fullNumber: guardian.phone || '', valid: !!guardian.phone });
                }
                setGuardianIdError('');
            } else {
                setGuardianIdError('Guardian ID not found in the system');
            }
        } else if (val.length > 0 && val.length < 6) {
            setGuardianIdError('Guardian ID must be 6 digits');
        } else if (val.length === 0) {
            // Clear fields only when guardian ID is completely removed
            updates.guardianName = '';
            updates.guardianPhone = '';
            setGuardianPhoneData({ fullNumber: '', valid: false });
        }

        setVisitorForm(updates);
    };
    const filteredVisitors = visitors
        .filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial || ''}`.toLowerCase();
            const phoneStr = (v.phone || '').toLowerCase();
            const healthCardStr = (v.healthCardNumber || '').toLowerCase();
            const dobStr = (v.dateOfBirth || '').toLowerCase();

            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesMiddleName = !searchMiddleName || middleName.includes(searchMiddleName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const matchesPhone = !searchPhone || phoneStr.includes(searchPhone.toLowerCase());
            const matchesHealthCard = !searchHealthCard || healthCardStr.includes(searchHealthCard.toLowerCase());
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
        <div className="space-y-6">
            {/* Visitors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchSerial}
                        onChange={(e) => setSearchSerial(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        maxLength={6}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by health card"
                        value={searchHealthCard}
                        onChange={(e) => setSearchHealthCard(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        maxLength={10}
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
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Last Visit</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
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
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial || '-'}` : (visitor.serial || '-')}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700">
                                                <div className="font-medium text-sm">
                                                    {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    <span>{visitor.firstName || '-'}</span>
                                                    <span className="text-slate-300 mx-1">•</span>
                                                    <span>{visitor.middleName || '-'}</span>
                                                    <span className="text-slate-300 mx-1">•</span>
                                                    <span>{visitor.lastName || '-'}</span>
                                                </div>
                                                <div className="md:hidden mt-2 space-y-1 text-xs text-slate-500">
                                                    <div>DOB: {visitor.dateOfBirth || '-'}</div>
                                                    <div>Phone: {visitor.phone || '-'}</div>
                                                    <div>Health Card: {visitor.healthCardNumber || '-'}</div>
                                                    <div>Last Visit: {(() => {
                                                        const lastVisit = interactions
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
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden md:table-cell text-sm">{visitor.dateOfBirth || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{visitor.phone || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor.healthCardNumber || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">
                                                {(() => {
                                                    // Find last completed visit for this visitor
                                                    const lastVisit = interactions
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
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={() => !isRegistered && initiateRegistration(visitor)}
                                                                disabled={isRegistered}
                                                                className={`px-3 py-1 ${isRegistered ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                                            >
                                                                {isRegistered ? 'In Service' : 'Register'}
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
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowVisitorModal(false)}>
                    <div className="bg-white w-full max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-5 lg:p-6 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">
                            {editingVisitorId ? 'Edit Patient Details' : 'Add New Patient'}
                        </h2>
                        {error && <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">{error}</p>}

                        {/* Serial Display / Preview */}
                        {(editingVisitorId || nextVisitorSerial) && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-blue-900">Patient ID:</span>
                                        <span className="text-sm font-bold text-blue-700 font-mono">
                                            {editingVisitorId ? (
                                                (() => {
                                                    const v = visitors.find(v => v.id === editingVisitorId);
                                                    return v ? (v.entitySerial ? `${v.entitySerial}-${v.serial}` : v.serial) : 'Loading...';
                                                })()
                                            ) : `${userData?.entitySerial}-${nextVisitorSerial}`}
                                        </span>
                                        {editingVisitorId && (
                                            <span className="ml-auto text-[10px] font-black uppercase text-blue-400 tracking-widest">Read Only</span>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowVisitorModal(false);
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
                                                    phoneH: ''
                                                });
                                                setPhoneData({ fullNumber: '', valid: false });
                                                setPhoneHData({ fullNumber: '', valid: false });
                                                setHealthCardNumber('');
                                                setHealthCardVersion('');
                                                setHealthCardEffectivityDate('');
                                                setHealthCardExpiryDate('');
                                                setError('');
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
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create Patient'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form id="visitor-form" onSubmit={handleCreateVisitor} className="flex flex-col gap-5">
                            {/* Line 1: Last Name, First Name, Middle Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
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
                                    {fieldErrors.lastName && <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
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
                                    {fieldErrors.firstName && <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Middle Name</label>
                                    <input
                                        type="text"
                                        placeholder="Middle name"
                                        value={visitorForm.middleName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, middleName: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Line 2: Health Card Number, Version, Effectivity & Expiry Dates (single row, tight spacing) */}
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                <div className="w-full md:w-1/2 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Health Card Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="10-digit numeric"
                                        value={healthCardNumber}
                                        onChange={handleHealthCardChange}
                                        maxLength={10}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCard ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.healthCard && <p className="text-red-500 text-xs">{fieldErrors.healthCard}</p>}
                                </div>
                                <div className="w-full md:w-12 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Version</label>
                                    <input
                                        type="text"
                                        placeholder="A1"
                                        value={healthCardVersion}
                                        onChange={handleHealthCardVersionChange}
                                        maxLength={2}
                                        className="w-full py-2.5 px-3 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="w-full md:w-40 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Effectivity Date</label>
                                    <input
                                        type="date"
                                        value={healthCardEffectivityDate || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setHealthCardEffectivityDate(val);
                                            const msg = validateDates(val, healthCardExpiryDate);
                                            setFieldErrors(prev => ({ ...prev, healthCardDate: msg }));
                                        }}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="w-full md:w-40 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={healthCardExpiryDate || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setHealthCardExpiryDate(val);
                                            const msg = validateDates(healthCardEffectivityDate, val);
                                            setFieldErrors(prev => ({ ...prev, healthCardDate: msg }));
                                        }}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCardDate ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.healthCardDate && <p className="text-red-500 text-xs w-full">{fieldErrors.healthCardDate}</p>}
                                </div>
                            </div>

                            {/* Line 3: DOB (Calendar), Age (Calculated), Sex */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    {fieldErrors.dob && <p className="text-red-500 text-xs">{fieldErrors.dob}</p>}
                                </div>
                                <div className="flex flex-col gap-2 w-full sm:w-24">
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
                                            let age = today.getFullYear() - dob.getFullYear();
                                            const monthDiff = today.getMonth() - dob.getMonth();
                                            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                                                age--;
                                            }
                                            return isNaN(age) || age < 0 ? '' : age.toString();
                                        })()}
                                        readOnly
                                        className="w-full py-2 px-3 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 w-full sm:w-32">
                                    <label className="text-sm font-semibold text-slate-900">Sex <span className="text-red-500">*</span></label>
                                    <select
                                        value={visitorForm.gender}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVisitorForm({ ...visitorForm, gender: val });
                                            if (!val) setFieldErrors(prev => ({ ...prev, gender: 'Sex is required' }));
                                            else setFieldErrors(prev => { const n = { ...prev }; delete n.gender; return n; });
                                        }}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.gender ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    >
                                        <option value="">Select sex</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {fieldErrors.gender && <p className="text-red-500 text-xs">{fieldErrors.gender}</p>}
                                </div>
                            </div>

                            {/* Street, City, Province, Postal Code */}
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                <div className="flex-1 flex flex-col gap-2">
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
                                    {fieldErrors.street && <p className="text-red-500 text-xs">{fieldErrors.street}</p>}
                                </div>
                                <div className="w-full md:w-40 flex flex-col gap-2">
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
                                    {fieldErrors.city && <p className="text-red-500 text-xs">{fieldErrors.city}</p>}
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
                                    {fieldErrors.state && <p className="text-red-500 text-xs">{fieldErrors.state}</p>}
                                </div>
                                <div className="w-full md:w-32 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Postal Code</label>
                                    <input
                                        type="text"
                                        placeholder="A1B-2C3"
                                        value={visitorForm.postalCode}
                                        onChange={handlePostalChange}
                                        maxLength={7}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Guardian Info (optional) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Guardian ID <span className="text-xs text-slate-400 font-normal">(6 digits)</span></label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={visitorForm.guardianId}
                                        onChange={handleGuardianIdChange}
                                        maxLength={6}
                                        className={`w-full py-2.5 px-3.5 border ${guardianIdError ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-mono text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {guardianIdError && <p className="text-red-500 text-xs mt-1">{guardianIdError}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Guardian Name <span className="text-xs text-slate-400 font-normal">(max 3 words)</span></label>
                                    <input
                                        type="text"
                                        placeholder="Enter guardian name"
                                        value={visitorForm.guardianName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Limit to 3 words
                                            const words = val.trim().split(/\s+/).filter(w => w.length > 0);
                                            if (words.length <= 3) {
                                                setVisitorForm({ ...visitorForm, guardianName: val });
                                            } else {
                                                // Keep only first 3 words
                                                const limitedVal = words.slice(0, 3).join(' ');
                                                setVisitorForm({ ...visitorForm, guardianName: limitedVal });
                                            }
                                        }}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Guardian Contact</label>
                                    <PhoneInput
                                        value={guardianPhoneData.fullNumber}
                                        onChange={setGuardianPhoneData}
                                        disabled={guardianIdError}
                                    />
                                </div>
                            </div>

                            {/* Phone (H), Phone (B), Phone (M) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (H)</label>
                                    <PhoneInput
                                        value={phoneHData.fullNumber}
                                        onChange={setPhoneHData}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (B) <span className="text-red-500">*</span></label>
                                    <PhoneInput
                                        value={phoneData.fullNumber}
                                        onChange={setPhoneData}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (M)</label>
                                    <PhoneInput
                                        value={visitorForm.phoneM}
                                        onChange={(val) => setVisitorForm({ ...visitorForm, phoneM: val.fullNumber })}
                                    />
                                </div>
                            </div>

                            {/* Notes and Memo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
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
                                        className="w-full min-h-[60px] max-h-[100px] py-2 px-3 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100 resize-y"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
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
                                        className="w-full min-h-[60px] max-h-[100px] py-2 px-3 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100 resize-y"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Detail Modal */}
            {showPatientDetailModal && selectedPatient && (
                <PatientDetailsModal
                    selectedPatient={selectedPatient}
                    setShowPatientDetailModal={setShowPatientDetailModal}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    completedInteractionsForPatient={interactions.filter(i => i.visitorId === selectedPatient?.id && i.completed)}
                    expandedInteractionIds={expandedInteractionIds}
                    setExpandedInteractionIds={setExpandedInteractionIds}
                    formatDate={formatDate}
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
            {/* Register Confirmation Modal */}
            {
                showRegisterConfirmModal && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRegisterConfirmModal(false)}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 text-center">
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Registration</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Do u want to register an interaction?
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={() => {
                                            setShowRegisterConfirmModal(false);
                                            setPendingRegisterVisitor(null);
                                        }}
                                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        No, cancel
                                    </button>
                                    <button
                                        onClick={confirmRegistration}
                                        className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-200/50"
                                    >
                                        Yes, register
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
