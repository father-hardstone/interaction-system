import PhoneInput from './PhoneInput';
import ReportUpload from './ReportUpload';
import { reportService } from '../services/reportService';

import { useState, useMemo, useEffect } from 'react';

const VisitorsSection = ({
    visitors,
    interactions = [],
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
    onDeleteVisitor,
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
    userData
}) => {
    const [expandedInteractionIds, setExpandedInteractionIds] = useState({});
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [deletingReportId, setDeletingReportId] = useState(null);

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
            const data = await reportService.getByVisitor(selectedPatient.id);
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
                                        draggable
                                        onDragStart={(e) => {
                                            dragStarted = true;
                                            handlePatientDragStart(e, visitor);
                                            // Add visual feedback - make row look like it's being lifted
                                            e.currentTarget.style.opacity = '0.4';
                                            e.currentTarget.style.transform = 'scale(0.98)';
                                            e.currentTarget.style.transition = 'all 0.2s';
                                        }}
                                        onDragEnd={(e) => {
                                            // Reset visual feedback
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.transform = 'scale(1)';
                                            setTimeout(() => {
                                                dragStarted = false;
                                            }, 200);
                                        }}
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
                                                            setData: () => {},
                                                            getData: () => 'patient'
                                                        },
                                                        preventDefault: () => {}
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
                                                            preventDefault: () => {},
                                                            stopPropagation: () => {},
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
                                            <button
                                                onClick={() => onDeleteVisitor(visitor.id)}
                                                disabled={deletingVisitorId === visitor.id}
                                                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {deletingVisitorId === visitor.id ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    'Delete'
                                                )}
                                            </button>
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
                    <div className="bg-white w-full max-w-[1400px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Add New Patient</h2>
                        {error && <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">{error}</p>}
                        <form onSubmit={handleCreateVisitor} className="flex flex-col gap-5">
                            {/* Line 1: Last Name, First Name, Middle Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Last Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Last name"
                                        value={visitorForm.lastName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, lastName: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">First Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        value={visitorForm.firstName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, firstName: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Middle Name</label>
                                    <input
                                        type="text"
                                        placeholder="Middle name"
                                        value={visitorForm.middleName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, middleName: e.target.value })}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Line 2: Health Card Number, Version, Effectivity Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Health Card Number <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="1234-5678-90"
                                        value={healthCardNumber}
                                        onChange={handleHealthCardChange}
                                        maxLength={12}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Version</label>
                                    <input
                                        type="text"
                                        placeholder="Version"
                                        value={healthCardVersion}
                                        onChange={(e) => {
                                            const value = e.target.value.substring(0, 2);
                                            setHealthCardVersion(value);
                                        }}
                                        maxLength={2}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Effectivity Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM-DD-YYYY"
                                        value={healthCardEffectivityDate}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
                                            if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 9);
                                            setHealthCardEffectivityDate(value);
                                        }}
                                        maxLength={10}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Line 3: DOB (Calendar), Age (Calculated), Sex, Expiry Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Date of Birth <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={visitorForm.dateOfBirth ? (() => {
                                            // Convert MM-DD-YYYY to YYYY-MM-DD for date input
                                            const parts = visitorForm.dateOfBirth.split('-');
                                            if (parts.length === 3) {
                                                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                                            }
                                            return '';
                                        })() : ''}
                                        onChange={(e) => {
                                            // Convert YYYY-MM-DD to MM-DD-YYYY
                                            const dateValue = e.target.value;
                                            if (dateValue) {
                                                const parts = dateValue.split('-');
                                                const formatted = `${parts[1]}-${parts[2]}-${parts[0]}`;
                                                setVisitorForm({ ...visitorForm, dateOfBirth: formatted });
                                            } else {
                                                setVisitorForm({ ...visitorForm, dateOfBirth: '' });
                                            }
                                        }}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
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
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-100 text-slate-600 cursor-not-allowed"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Sex <span className="text-red-500">*</span></label>
                                    <select
                                        value={visitorForm.gender}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, gender: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="">Select sex</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM-DD-YYYY"
                                        value={healthCardExpiryDate}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
                                            if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 9);
                                            setHealthCardExpiryDate(value);
                                        }}
                                        maxLength={10}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Street */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Street <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Street address"
                                    value={visitorForm.addressLine}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, addressLine: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            {/* City, Province, Postal Code */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">City <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={visitorForm.city}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, city: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Province <span className="text-red-500">*</span></label>
                                    <select
                                        value={visitorForm.state}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, state: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Postal Code</label>
                                    <input
                                        type="text"
                                        placeholder="12345"
                                        value={visitorForm.postalCode}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').substring(0, 5);
                                            setVisitorForm({ ...visitorForm, postalCode: value });
                                        }}
                                        maxLength={5}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Phone (H) and Phone (B) */}
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>

                            <div className="flex gap-4 mt-4">
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
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingVisitor}
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
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
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                                interaction.closed 
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
                                                        <div className="px-4 py-3 text-sm text-slate-700 space-y-4 bg-slate-50 border-t border-slate-200">
                                                            {/* CC/Reason */}
                                                            {interaction.ccReason && (interaction.ccReason.text || interaction.ccReason.scratchpad) && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">CC / Reason</h5>
                                                                    {interaction.ccReason.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.ccReason.text}</p>
                                                                    )}
                                                                    {interaction.ccReason.hasScratchpad && interaction.ccReason.scratchpad && (
                                                                        <img 
                                                                            src={getImageUrl(interaction.ccReason.scratchpad)} 
                                                                            alt="CC/Reason" 
                                                                            className="max-w-full h-auto rounded border border-slate-200"
                                                                            onError={(e) => e.target.style.display = 'none'}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Subjective */}
                                                            {interaction.subjective && (interaction.subjective.text || interaction.subjective.scratchpad) && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">S (Subjective)</h5>
                                                                    {interaction.subjective.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.subjective.text}</p>
                                                                    )}
                                                                    {interaction.subjective.hasScratchpad && interaction.subjective.scratchpad && (
                                                                        <img 
                                                                            src={getImageUrl(interaction.subjective.scratchpad)} 
                                                                            alt="Subjective" 
                                                                            className="max-w-full h-auto rounded border border-slate-200"
                                                                            onError={(e) => e.target.style.display = 'none'}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Objective */}
                                                            {interaction.objective && (interaction.objective.text || interaction.objective.scratchpad) && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">O (Objective)</h5>
                                                                    {interaction.objective.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.objective.text}</p>
                                                                    )}
                                                                    {interaction.objective.hasScratchpad && interaction.objective.scratchpad && (
                                                                        <img 
                                                                            src={getImageUrl(interaction.objective.scratchpad)} 
                                                                            alt="Objective" 
                                                                            className="max-w-full h-auto rounded border border-slate-200"
                                                                            onError={(e) => e.target.style.display = 'none'}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Assessment and Plan */}
                                                            {interaction.assessmentPlan && (interaction.assessmentPlan.text || interaction.assessmentPlan.scratchpad) && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">A and P (Assessment and Plan)</h5>
                                                                    {interaction.assessmentPlan.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.assessmentPlan.text}</p>
                                                                    )}
                                                                    {interaction.assessmentPlan.hasScratchpad && interaction.assessmentPlan.scratchpad && (
                                                                        <img 
                                                                            src={getImageUrl(interaction.assessmentPlan.scratchpad)} 
                                                                            alt="Assessment and Plan" 
                                                                            className="max-w-full h-auto rounded border border-slate-200"
                                                                            onError={(e) => e.target.style.display = 'none'}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Service Lines */}
                                                            {interaction.serviceLines && interaction.serviceLines.length > 0 && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-2">Services</h5>
                                                                    <div className="space-y-1">
                                                                        {interaction.serviceLines.map((line, idx) => (
                                                                            <div key={idx} className="bg-white rounded p-2 text-xs border border-slate-200">
                                                                                <div className="grid grid-cols-6 gap-2">
                                                                                    <div className="font-medium text-slate-600">{line.serialNumber}</div>
                                                                                    <div><span className="text-slate-500">Service:</span> {line.service}</div>
                                                                                    <div><span className="text-slate-500">Suffix:</span> {line.suffix}</div>
                                                                                    <div><span className="text-slate-500">Diagnostic:</span> {line.diagnostic}</div>
                                                                                    <div><span className="text-slate-500">Fee:</span> ${line.totalFee || '0.00'}</div>
                                                                                    <div><span className="text-slate-500">Acct #:</span> {line.accountingNumber || 'N/A'}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
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
                                    <div className="space-y-3">
                                        {reports.map((report) => {
                                            const reportDate = new Date(report.uploadedAt).toLocaleDateString();
                                            const reportTime = new Date(report.uploadedAt).toLocaleTimeString();
                                            const fileUrl = report.filePath.startsWith('http') 
                                                ? report.filePath 
                                                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${report.filePath}`;
                                            
                                            return (
                                                <div
                                                    key={report.id}
                                                    className="border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-semibold text-slate-900">
                                                                    {report.instituteName}
                                                                </span>
                                                                {report.interactionId && (
                                                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                                        {interactions.find(i => i.id === report.interactionId)?.interactionSerial || 'Associated'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mb-2">
                                                                {report.fileName} · {reportDate} {reportTime}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                    View Report
                                                                </a>
                                                                {report.fileType === 'pdf' && (
                                                                    <a
                                                                        href={fileUrl}
                                                                        download
                                                                        className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                        </svg>
                                                                        Download PDF
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {report.fileType === 'image' && (
                                                            <div className="ml-4">
                                                                <img
                                                                    src={fileUrl}
                                                                    alt={report.fileName}
                                                                    className="w-20 h-20 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => window.open(fileUrl, '_blank')}
                                                                    onError={(e) => e.target.style.display = 'none'}
                                                                />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteReport(report.id)}
                                                            disabled={deletingReportId === report.id}
                                                            className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete report"
                                                        >
                                                            {deletingReportId === report.id ? (
                                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            )}
                                                        </button>
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
