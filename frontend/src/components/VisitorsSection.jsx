import PhoneInput from './PhoneInput';
import ReportUpload from './ReportUpload';
import { reportService } from '../services/reportService';
import api from '../services/api';

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
    onEditVisitor,
    handlePatientClick,
    selectedPatient,
    showPatientDetailModal,
    setShowPatientDetailModal,
    handlePatientDragStart,
    handlePatientDrop,
    isCreatingVisitor,
    deletingVisitorId,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    userData,
    fieldErrors = {},
    setFieldErrors = () => { },
    handleRegisterPatient,
    nextVisitorSerial = ''
}) => {
    const [expandedInteractionIds, setExpandedInteractionIds] = useState({});
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [deletingReportId, setDeletingReportId] = useState(null);
    const [services, setServices] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);

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

    // Helper to get image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
            return imagePath;
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${API_URL.replace('/api', '')}/${imagePath}`;
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
        const val = e.target.value.trim();
        let updates = { ...visitorForm, guardianId: val };
        const guardian = visitors.find((v) => v.id === val);
        if (guardian) {
            updates.guardianName = guardian.firstName ? `${guardian.firstName} ${guardian.lastName || ''}`.trim() : updates.guardianName;
            updates.guardianPhone = guardian.phone || updates.guardianPhone;
        }
        setVisitorForm(updates);
    };
    const filteredVisitors = visitors
        .filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial}`.toLowerCase();
            const phoneStr = (v.phone || '').toLowerCase();
            const healthCardStr = (v.healthCardNumber || '').toLowerCase();

            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesMiddleName = !searchMiddleName || middleName.includes(searchMiddleName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const matchesPhone = !searchPhone || phoneStr.includes(searchPhone.toLowerCase());
            const matchesHealthCard = !searchHealthCard || healthCardStr.includes(searchHealthCard.toLowerCase());

            return matchesFirstName && matchesMiddleName && matchesLastName && matchesSerial && matchesPhone && matchesHealthCard;
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
                        onClick={() => setShowVisitorModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors w-full sm:w-auto"
                    >
                        Add a patient
                    </button>
                </div>

                {/* Search filters */}
                <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 border-b border-slate-200 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search by first name"
                        value={searchFirstName}
                        onChange={(e) => setSearchFirstName(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by middle name"
                        value={searchMiddleName}
                        onChange={(e) => setSearchMiddleName(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by last name"
                        value={searchLastName}
                        onChange={(e) => setSearchLastName(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchSerial}
                        onChange={(e) => setSearchSerial(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by phone"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by health card"
                        value={searchHealthCard}
                        onChange={(e) => setSearchHealthCard(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Email</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
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
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial}` : visitor.serial}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700">
                                                <div className="font-medium text-sm">
                                                    {visitor.firstName} {visitor.middleName ? visitor.middleName + ' ' : ''}{visitor.lastName}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    <span>{visitor.firstName || 'N/A'}</span>
                                                    <span className="text-slate-300 mx-1">•</span>
                                                    <span>{visitor.middleName || 'N/A'}</span>
                                                    <span className="text-slate-300 mx-1">•</span>
                                                    <span>{visitor.lastName || 'N/A'}</span>
                                                </div>
                                                <div className="md:hidden mt-2 space-y-1 text-xs text-slate-500">
                                                    <div>DOB: {visitor.dateOfBirth}</div>
                                                    <div>Phone: {visitor.phone}</div>
                                                    <div>Email: {visitor.email || 'N/A'}</div>
                                                    <div>Health Card: {visitor.healthCardNumber}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden md:table-cell text-sm">{visitor.dateOfBirth}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{visitor.phone}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{visitor.email || 'N/A'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor.healthCardNumber}</td>
                                            <td className="px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onEditVisitor?.(visitor)}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRegisterPatient?.(visitor)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Register
                                                    </button>
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
                    <div className="bg-white w-full max-w-[1100px] max-h-[90vh] overflow-y-auto p-4 sm:p-5 lg:p-6 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Add New Patient</h2>
                        {error && <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">{error}</p>}

                        {/* Next Serial Preview */}
                        {nextVisitorSerial && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold text-blue-900">Patient ID:</span>
                                    <span className="text-sm font-bold text-blue-700 font-mono">{userData?.entitySerial}-{nextVisitorSerial}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleCreateVisitor} className="flex flex-col gap-5">
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
                                <div className="flex-1 flex flex-col gap-2">
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
                                <div className="w-full md:w-24 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Version</label>
                                    <input
                                        type="text"
                                        placeholder="A1"
                                        value={healthCardVersion}
                                        onChange={handleHealthCardVersionChange}
                                        maxLength={2}
                                        className="w-full py-3 px-3 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                                    <label className="text-sm font-semibold text-slate-900">Guardian ID</label>
                                    <input
                                        type="text"
                                        placeholder="Guardian ID"
                                        value={visitorForm.guardianId}
                                        onChange={handleGuardianIdChange}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Guardian Name</label>
                                    <input
                                        type="text"
                                        placeholder="Guardian name"
                                        value={visitorForm.guardianName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, guardianName: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Guardian Contact</label>
                                    <input
                                        type="text"
                                        placeholder="Guardian phone"
                                        value={visitorForm.guardianPhone}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, guardianPhone: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Phone (H), Phone (B), Phone (M) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (H)</label>
                                    <PhoneInput
                                        onChange={setPhoneHData}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (B) <span className="text-red-500">*</span></label>
                                    <PhoneInput
                                        onChange={setPhoneData}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (M)</label>
                                    <PhoneInput
                                        onChange={(val) => setVisitorForm({ ...visitorForm, phoneM: val.fullNumber })}
                                    />
                                </div>
                            </div>

                            {/* Notes and Memo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Notes</label>
                                    <textarea
                                        value={visitorForm.notes}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, notes: e.target.value })}
                                        className="w-full min-h-[64px] py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Memo</label>
                                    <textarea
                                        value={visitorForm.memo}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, memo: e.target.value })}
                                        className="w-full min-h-[64px] py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-3 justify-end">
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
                                        setIdCardNumber('');
                                        setHealthCardVersion('');
                                        setHealthCardEffectivityDate('');
                                        setHealthCardExpiryDate('');
                                        setError('');
                                    }}
                                    className="px-4 py-2.5 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingVisitor}
                                    className="px-4 py-2.5 bg-primary text-white border-none rounded-xl font-semibold text-sm cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Detail Modal */}
            {showPatientDetailModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => {
                    setShowPatientDetailModal(false);
                    setExpandedInteractionIds({});
                }}>
                    <div className="bg-white w-full max-w-[1600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Patient Details</h2>
                            <div className="flex items-center gap-3">
                                {userData && selectedPatient && (
                                    <ReportUpload
                                        visitor={selectedPatient}
                                        entityId={userData.entityId}
                                        entitySerial={userData.entitySerial}
                                        interactions={interactions}
                                        officers={officers}
                                        onUploadSuccess={handleReportUploadSuccess}
                                    />
                                )}
                                <button
                                    onClick={() => {
                                        setShowPatientDetailModal(false);
                                        setExpandedInteractionIds({});
                                    }}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Patient Information - Horizontal Layout */}
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">ID</label>
                                    <p className="text-base text-slate-900 mt-1">
                                        {selectedPatient.entitySerial ? `${selectedPatient.entitySerial}-${selectedPatient.serial}` : selectedPatient.serial}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Date of Birth</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.dateOfBirth || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Gender</label>
                                    <p className="text-base text-slate-900 mt-1 capitalize">{selectedPatient.gender || 'N/A'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-500">Name</label>
                                <p className="text-base text-slate-900 mt-1">
                                    {selectedPatient.firstName} {selectedPatient.middleName ? selectedPatient.middleName + ' ' : ''}{selectedPatient.lastName}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    <span>{selectedPatient.firstName || 'N/A'}</span>
                                    <span className="text-slate-300 mx-1">•</span>
                                    <span>{selectedPatient.middleName || 'N/A'}</span>
                                    <span className="text-slate-300 mx-1">•</span>
                                    <span>{selectedPatient.lastName || 'N/A'}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Address</label>
                                    <p className="text-base text-slate-900 mt-1">
                                        {selectedPatient.addressLine || 'N/A'}
                                        {selectedPatient.city && `, ${selectedPatient.city}`}
                                        {(selectedPatient.province || selectedPatient.state) && `, ${selectedPatient.province || selectedPatient.state}`}
                                        {selectedPatient.postalCode && ` ${selectedPatient.postalCode}`}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Email</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Phone</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Phone (H)</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.phoneH || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Health Card Number</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardNumber || 'N/A'}</p>
                                </div>
                                {selectedPatient.healthCardVersion && (
                                    <div>
                                        <label className="text-sm font-semibold text-slate-500">Health Card Version</label>
                                        <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardVersion}</p>
                                    </div>
                                )}
                                {(selectedPatient.healthCardEffectivityDate || selectedPatient.healthCardExpiryDate) && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedPatient.healthCardEffectivityDate && (
                                            <div>
                                                <label className="text-sm font-semibold text-slate-500">Effectivity Date</label>
                                                <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardEffectivityDate}</p>
                                            </div>
                                        )}
                                        {selectedPatient.healthCardExpiryDate && (
                                            <div>
                                                <label className="text-sm font-semibold text-slate-500">Expiry Date</label>
                                                <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardExpiryDate}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Completed Interactions Section */}
                            <div className="pt-4 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Interactions</h3>
                                {completedInteractionsForPatient.length === 0 ? (
                                    <div className="text-sm text-slate-400 italic py-4">
                                        No completed interactions for this patient.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {completedInteractionsForPatient.map((interaction) => {
                                            const isExpanded = expandedInteractionIds[interaction.id];
                                            return (
                                                <div
                                                    key={interaction.id}
                                                    className="border border-slate-200 rounded-lg overflow-hidden bg-white"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedInteractionIds((prev) => ({
                                                                ...prev,
                                                                [interaction.id]: !isExpanded,
                                                            }))
                                                        }
                                                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-semibold text-blue-700">
                                                                {interaction.interactionSerial || 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-slate-500 mt-0.5">
                                                                Completed: {formatDate(interaction.editedAt || interaction.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${interaction.closed
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {interaction.closed ? 'Closed' : 'Open'}
                                                            </span>
                                                            <svg
                                                                className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-4 py-5 text-sm text-slate-700 space-y-6 bg-slate-50 border-t border-slate-200">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {/* CC/Reason */}
                                                                <div className="space-y-2">
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chief Complaint / Reason</h5>
                                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm min-h-[60px]">
                                                                        {interaction.ccReason?.text && (
                                                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{interaction.ccReason.text}</p>
                                                                        )}
                                                                        {interaction.ccReason?.hasScratchpad && interaction.ccReason?.scratchpad && (
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={getImageUrl(interaction.ccReason.scratchpad)}
                                                                                    alt="CC/Reason"
                                                                                    className="max-w-full h-auto rounded-lg border border-slate-100"
                                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {!interaction.ccReason?.text && !interaction.ccReason?.scratchpad && (
                                                                            <p className="text-xs text-slate-400 italic">No notes provided</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Subjective */}
                                                                <div className="space-y-2">
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subjective (S)</h5>
                                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm min-h-[60px]">
                                                                        {interaction.subjective?.text && (
                                                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{interaction.subjective.text}</p>
                                                                        )}
                                                                        {interaction.subjective?.hasScratchpad && interaction.subjective?.scratchpad && (
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={getImageUrl(interaction.subjective.scratchpad)}
                                                                                    alt="Subjective"
                                                                                    className="max-w-full h-auto rounded-lg border border-slate-100"
                                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {!interaction.subjective?.text && !interaction.subjective?.scratchpad && (
                                                                            <p className="text-xs text-slate-400 italic">No notes provided</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Objective */}
                                                                <div className="space-y-2">
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objective (O)</h5>
                                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm min-h-[60px]">
                                                                        {interaction.objective?.text && (
                                                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{interaction.objective.text}</p>
                                                                        )}
                                                                        {interaction.objective?.hasScratchpad && interaction.objective?.scratchpad && (
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={getImageUrl(interaction.objective.scratchpad)}
                                                                                    alt="Objective"
                                                                                    className="max-w-full h-auto rounded-lg border border-slate-100"
                                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {!interaction.objective?.text && !interaction.objective?.scratchpad && (
                                                                            <p className="text-xs text-slate-400 italic">No notes provided</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Assessment & Plan */}
                                                                <div className="space-y-2">
                                                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assessment & Plan (A&P)</h5>
                                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm min-h-[60px]">
                                                                        {interaction.assessmentPlan?.text && (
                                                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{interaction.assessmentPlan.text}</p>
                                                                        )}
                                                                        {interaction.assessmentPlan?.hasScratchpad && interaction.assessmentPlan?.scratchpad && (
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={getImageUrl(interaction.assessmentPlan.scratchpad)}
                                                                                    alt="Assessment and Plan"
                                                                                    className="max-w-full h-auto rounded-lg border border-slate-100"
                                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {!interaction.assessmentPlan?.text && !interaction.assessmentPlan?.scratchpad && (
                                                                            <p className="text-xs text-slate-400 italic">No notes provided</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Service Lines (Billing) */}
                                                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Services & Billing</h5>
                                                                {interaction.serviceLines && interaction.serviceLines.length > 0 ? (
                                                                    <div className="grid grid-cols-1 gap-2">
                                                                        {interaction.serviceLines.map((line, idx) => (
                                                                            <div key={idx} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                                                                <div className="flex flex-wrap gap-4 items-start">
                                                                                    <div className="flex-1 min-w-[150px]">
                                                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Diagnostic</div>
                                                                                        <div className="text-xs">
                                                                                            <span className="font-bold text-blue-700 mr-2">{line.diagnostic}</span>
                                                                                            <span className="text-slate-600">
                                                                                                {diagnostics.find(d => d.code === line.diagnostic)?.description || 'No description'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-[150px]">
                                                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Service</div>
                                                                                        <div className="text-xs">
                                                                                            <span className="font-bold text-blue-700 mr-2">{line.service}</span>
                                                                                            <span className="text-slate-600">
                                                                                                {services.find(s => s.code === line.service)?.description || 'No description'}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="w-16">
                                                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suffix</div>
                                                                                        <div className="text-xs font-semibold text-slate-700">{line.suffix || '-'}</div>
                                                                                    </div>
                                                                                    <div className="w-20">
                                                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fee</div>
                                                                                        <div className="text-xs font-bold text-slate-900">${line.totalFee || '0.00'}</div>
                                                                                    </div>
                                                                                    <div className="w-24">
                                                                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Acct #</div>
                                                                                        <div className="text-xs font-medium text-slate-500">{line.accountingNumber || 'N/A'}</div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-slate-400 italic">No services recorded</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Reports Section */}
                            <div className="pt-4 border-t border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Reports</h3>
                                {loadingReports ? (
                                    <div className="text-sm text-slate-400 italic py-4">
                                        Loading reports...
                                    </div>
                                ) : reports.length === 0 ? (
                                    <div className="text-sm text-slate-400 italic py-4">
                                        No reports uploaded for this patient.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {reports.map((report) => {
                                            const procDate = new Date(report.procedureDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
                                            const genDate = new Date(report.reportGeneratedDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
                                            const fileUrl = report.fileMetadata.localPath.startsWith('http')
                                                ? report.fileMetadata.localPath
                                                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${report.fileMetadata.localPath}`;

                                            const reportTypeLabel = REPORT_TYPES.find(t => t.value === report.reportType)?.label || report.reportType;

                                            return (
                                                <div
                                                    key={report.id}
                                                    className="group relative bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 transition-all"
                                                >
                                                    <div className="flex gap-4">
                                                        {/* Document Icon / Image Preview */}
                                                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                            {report.fileMetadata.mimeType.startsWith('image/') ? (
                                                                <img
                                                                    src={fileUrl}
                                                                    alt="Preview"
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform cursor-pointer"
                                                                    onClick={() => window.open(fileUrl, '_blank')}
                                                                />
                                                            ) : (
                                                                <div className="text-center">
                                                                    <div className="text-[10px] font-black text-red-600 mb-0.5">PDF</div>
                                                                    <svg className="w-6 h-6 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{reportTypeLabel}</span>
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <a
                                                                        href={fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                                        title="View full document"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                    </a>
                                                                    <button
                                                                        onClick={() => handleDeleteReport(report.id)}
                                                                        className="p-1.5 bg-slate-100 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                                                        title="Delete record"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <p className="text-sm font-bold text-slate-800 truncate mb-1" title={report.labMetadata?.labName}>
                                                                {report.labMetadata?.labName || 'Laboratory Not Specified'}
                                                            </p>

                                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[10px] text-slate-500 font-medium">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <span>Procedure: <span className="text-slate-900">{procDate}</span></span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                    </svg>
                                                                    <span>Report: <span className="text-slate-900">{genDate}</span></span>
                                                                </div>
                                                            </div>

                                                            {report.notes && (
                                                                <p className="mt-2 text-[11px] text-slate-500 line-clamp-1 italic">
                                                                    {report.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => {
                                        setShowPatientDetailModal(false);
                                        setExpandedInteractionIds({});
                                    }}
                                    className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors"
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
