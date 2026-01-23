import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { visitorService } from '../services/visitorService';
import { interactionService } from '../services/interactionService';
import { officerService } from '../services/officerService';
import { validateEmail } from '../utils/crypto';
import UserSidebar from '../components/UserSidebar';
import ReceptionTab from '../components/ReceptionTab';
import OfficerTab from '../components/OfficerTab';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { serial } = useParams();
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('reception');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [visitors, setVisitors] = useState([]);
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchMiddleName, setSearchMiddleName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchHealthCard, setSearchHealthCard] = useState('');
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [editingVisitorId, setEditingVisitorId] = useState(null);
    const [visitorForm, setVisitorForm] = useState({
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
        guardianName: '',
        guardianId: '',
        guardianPhone: ''
    });
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [phoneHData, setPhoneHData] = useState({ fullNumber: '', valid: false });
    const [healthCardNumber, setHealthCardNumber] = useState('');
    const [healthCardVersion, setHealthCardVersion] = useState('');
    const [healthCardEffectivityDate, setHealthCardEffectivityDate] = useState('');
    const [healthCardExpiryDate, setHealthCardExpiryDate] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
    const [draggedPatient, setDraggedPatient] = useState(null);
    const [showDeleteRegistrationModal, setShowDeleteRegistrationModal] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState(null);
    const [error, setError] = useState('');
    const [interactions, setInteractions] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [warningMessage, setWarningMessage] = useState('');
    const [draggedInteraction, setDraggedInteraction] = useState(null);
    const [draggedOverOfficer, setDraggedOverOfficer] = useState(null);
    const [draggedOverUnassigned, setDraggedOverUnassigned] = useState(false);

    const [fieldErrors, setFieldErrors] = useState({});

    // Filter state
    const [interactionFilter, setInteractionFilter] = useState('today');

    // Loading states
    const [isCreatingVisitor, setIsCreatingVisitor] = useState(false);
    const [deletingVisitorId, setDeletingVisitorId] = useState(null);
    const [isDeletingRegistration, setIsDeletingRegistration] = useState(false);
    const [isCreatingInteraction, setIsCreatingInteraction] = useState(false);
    const [isAssigningInteraction, setIsAssigningInteraction] = useState(false);

    // Optimistic UI states for drag and drop
    const [pendingInteractions, setPendingInteractions] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState({});

    // Next visitor serial (for preview in create form)
    const [nextVisitorSerial, setNextVisitorSerial] = useState('');

    // 1. Initial Auth & Tab Setup
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
                // Set initial tab ONLY ONCE when component mounts/login happens
                if (decoded.role === 'officer') {
                    setActiveTab('officer');
                } else if (decoded.role === 'receptionist') {
                    setActiveTab('reception');
                }
            } catch (e) {
                console.error('Failed to decode token');
            }
        }

        // Listen for sidebar toggle event from NavBar
        const handleToggleSidebar = () => setSidebarOpen(prev => !prev);
        window.addEventListener('toggleSidebar', handleToggleSidebar);
        return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
    }, []);

    // 2. Load Constant Data (Visitors, Officers)
    useEffect(() => {
        if (userData?.entityId) {
            loadVisitors(userData.entityId);
            loadOfficers(userData.entityId);
        }
    }, [userData?.entityId]);

    // 3a. Load Interactions when filter changes
    useEffect(() => {
        if (!userData?.entityId) return;
        loadInteractions(userData.entityId, interactionFilter);
    }, [userData?.entityId, interactionFilter]);

    // 3b. Polling for updates (independent of filter changes to avoid interval stacking)
    useEffect(() => {
        if (!userData?.entityId) return;

        const interval = setInterval(() => {
            // Use the current filter value from state
            loadInteractions(userData.entityId, interactionFilter);
        }, 30000);

        return () => clearInterval(interval);
    }, [userData?.entityId]); // Only restart interval if entityId changes, NOT on filter change

    // 4. Fetch next visitor serial when modal opens
    useEffect(() => {
        const fetchNextSerial = async () => {
            if (showVisitorModal && !editingVisitorId && userData?.entityId) {
                try {
                    const serial = await visitorService.getNextSerial(userData.entityId);
                    setNextVisitorSerial(serial);
                } catch (e) {
                    console.error('Failed to fetch next serial:', e);
                    setNextVisitorSerial('');
                }
            }
        };
        fetchNextSerial();
    }, [showVisitorModal, editingVisitorId, userData?.entityId]);

    const loadVisitors = async (entityId) => {
        try {
            console.log('loadVisitors - entityId:', entityId);
            const data = await visitorService.getByEntity(entityId);
            console.log('loadVisitors - received data:', data);
            console.log('loadVisitors - data length:', data?.length);
            setVisitors(data || []);
        } catch (e) {
            console.error('Failed to load visitors:', e);
            console.error('Failed to load visitors - error details:', e.response?.data || e.message);
            setVisitors([]);
        }
    };

    const loadInteractions = async (entityId, filter = 'today') => {
        try {
            const data = await interactionService.getByEntity(entityId, filter);
            setInteractions(data || []);
        } catch (e) {
            console.error('Failed to load interactions:', e);
            setInteractions([]);
        }
    };

    const loadOfficers = async (entityId) => {
        try {
            const data = await officerService.getByEntity(entityId);
            setOfficers(data || []);
        } catch (e) {
            console.error('Failed to load officers:', e);
            setOfficers([]);
        }
    };

    const showWarning = (message) => {
        setWarningMessage(message);
        setTimeout(() => {
            setWarningMessage('');
        }, 3000);
    };

    const handleDragStart = (e, interaction) => {
        if (userData?.role !== 'receptionist' && userData?.role !== 'officer') {
            e.preventDefault();
            showWarning('Only receptionist and doctors can perform this action');
            return;
        }
        setDraggedInteraction(interaction);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, officer) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (officer) {
            setDraggedOverOfficer(officer.id);
        }
    };

    const handleDragLeave = () => {
        setDraggedOverOfficer(null);
    };

    const handleDragEnd = () => {
        setDraggedInteraction(null);
        setDraggedOverOfficer(null);
        setDraggedOverUnassigned(false);
    };

    const handleDrop = async (e, officer = null) => {
        e.preventDefault();

        if (userData?.role !== 'receptionist' && userData?.role !== 'officer') {
            showWarning('Only receptionist and doctors can perform this action');
            return;
        }

        if (!draggedInteraction) return;

        const interactionId = draggedInteraction.id;
        const targetOfficerId = officer ? officer.id : null;

        // Optimistic UI update - show immediately
        if (officer) {
            setPendingAssignments(prev => ({
                ...prev,
                [interactionId]: targetOfficerId
            }));
        } else {
            setPendingAssignments(prev => ({
                ...prev,
                [interactionId]: null
            }));
        }

        setIsAssigningInteraction(true);

        try {
            // If dropping on unassigned area, unassign the officer
            if (!officer) {
                await interactionService.assignOfficer(
                    draggedInteraction.id,
                    '',
                    ''
                );
            } else {
                // Assign to officer
                await interactionService.assignOfficer(
                    draggedInteraction.id,
                    officer.id,
                    officer.serial
                );
            }

            // Reload interactions to get updated data
            await loadInteractions(userData.entityId);

            // Clear optimistic update after successful assignment
            setPendingAssignments(prev => {
                const newState = { ...prev };
                delete newState[interactionId];
                return newState;
            });

            setDraggedInteraction(null);
            setDraggedOverOfficer(null);
            setDraggedOverUnassigned(false);
        } catch (err) {
            console.error('Failed to assign/unassign officer:', err);
            // Remove optimistic update on error
            setPendingAssignments(prev => {
                const newState = { ...prev };
                delete newState[interactionId];
                return newState;
            });
            if (err.response?.status === 403) {
                showWarning('Only receptionist and doctors can perform this action');
            } else {
                showWarning('Failed to update interaction assignment');
            }
        } finally {
            setIsAssigningInteraction(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getVisitorName = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        if (!visitor) return 'Unknown';
        return `${visitor.firstName} ${visitor.middleName ? visitor.middleName + ' ' : ''}${visitor.lastName}`;
    };

    const getVisitorSerial = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        if (!visitor) return 'N/A';
        return (visitor.serial && visitor.serial.includes('-'))
            ? visitor.serial
            : (visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial}` : visitor.serial || '');
    };

    const formatHealthCardNumber = (value) => {
        // digits only, max 10
        const digits = value.replace(/\D/g, '').substring(0, 10);
        return digits;
    };

    const handleHealthCardChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setHealthCardNumber(val);

        if (!val.trim()) setFieldErrors(prev => ({ ...prev, healthCard: 'Health card number is required' }));
        else if (val.length < 10) setFieldErrors(prev => ({ ...prev, healthCard: 'Must be 10 digits' }));
        else setFieldErrors(prev => { const n = { ...prev }; delete n.healthCard; return n; });
    };

    const handleCreateVisitor = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setIsCreatingVisitor(true);

        // Validate required fields
        const newErrors = {};
        if (!visitorForm.lastName?.trim()) newErrors.lastName = 'Last name is required';
        if (!visitorForm.firstName?.trim()) newErrors.firstName = 'First name is required';
        if (!visitorForm.dateOfBirth) newErrors.dob = 'Date of birth is required';
        if (!visitorForm.addressLine?.trim()) newErrors.street = 'Street is required';
        if (!visitorForm.city?.trim()) newErrors.city = 'City is required';
        if (!visitorForm.state) newErrors.state = 'Province is required';
        if (!visitorForm.gender) newErrors.gender = 'Sex is required';
        if (!phoneData.valid) newErrors.phone = 'Valid phone number is required';
        if (!healthCardNumber?.trim()) newErrors.healthCard = 'Health card number is required';
        else if (healthCardNumber.length !== 10) newErrors.healthCard = 'Must be 10 digits';

        // Date comparison validation
        if (healthCardEffectivityDate && healthCardExpiryDate) {
            const eff = new Date(healthCardEffectivityDate);
            const exp = new Date(healthCardExpiryDate);
            if (exp < eff) {
                newErrors.healthCardDate = 'Expiry date cannot be before effectivity date';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            setIsCreatingVisitor(false);
            return;
        }

        // Validate health card number (10 digits, unique)
        if (healthCardNumber.length !== 10) {
            setError('Health card number must be exactly 10 digits');
            setIsCreatingVisitor(false);
            return;
        }
        const duplicate = visitors.find(v => v.healthCardNumber === healthCardNumber && v.id !== editingVisitorId);
        if (duplicate) {
            setError('Health card number already exists');
            setIsCreatingVisitor(false);
            return;
        }

        // Validate email if provided
        if (visitorForm.email && visitorForm.email.trim().length > 0) {
            const emailValidation = validateEmail(visitorForm.email);
            if (!emailValidation.valid) {
                setError(emailValidation.error);
                return;
            }
        }

        // Validate date format (should be MM-DD-YYYY)
        const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
        if (!dateRegex.test(visitorForm.dateOfBirth)) {
            setError('Date of birth must be in MM-DD-YYYY format');
            setIsCreatingVisitor(false);
            return;
        }

        // Validate date of birth - check if it's a valid date and not in the future
        const validateDate = (dateString, fieldName) => {
            const parts = dateString.split('-');
            const month = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);

            // Check for absurd values
            if (month < 1 || month > 12) {
                return { valid: false, error: `${fieldName} has an invalid month` };
            }
            if (day < 1 || day > 31) {
                return { valid: false, error: `${fieldName} has an invalid day` };
            }
            if (year < 1900 || year > 2100) {
                return { valid: false, error: `${fieldName} has an invalid year` };
            }

            // Create date object and check if it's valid
            const date = new Date(year, month - 1, day);
            if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
                return { valid: false, error: `${fieldName} is not a valid date` };
            }

            // Check if date is in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date > today) {
                return { valid: false, error: `${fieldName} cannot be in the future` };
            }

            return { valid: true };
        };

        const dobValidation = validateDate(visitorForm.dateOfBirth, 'Date of birth');
        if (!dobValidation.valid) {
            setError(dobValidation.error);
            setIsCreatingVisitor(false);
            return;
        }

        // Validate postal code (Canadian mask A1B-2C3)
        if (visitorForm.postalCode && visitorForm.postalCode.trim().length > 0) {
            const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
            if (!postalMask.test(visitorForm.postalCode.trim())) {
                setError('Postal code must be in format A1B-2C3');
                setIsCreatingVisitor(false);
                return;
            }
        }

        // Validate health card version (1-2 alphabetic)
        if (healthCardVersion && !/^[A-Za-z]{1,2}$/.test(healthCardVersion.trim())) {
            setError('Health card version must be 1-2 alphabetic characters');
            setIsCreatingVisitor(false);
            return;
        }

        // Dates: ISO from date inputs; ensure expiry >= effectivity
        const effDate = healthCardEffectivityDate ? new Date(healthCardEffectivityDate) : null;
        const expDate = healthCardExpiryDate ? new Date(healthCardExpiryDate) : null;
        if (effDate && isNaN(effDate.getTime())) {
            setError('Effectivity date is invalid');
            setIsCreatingVisitor(false);
            return;
        }
        if (expDate && isNaN(expDate.getTime())) {
            setError('Expiry date is invalid');
            setIsCreatingVisitor(false);
            return;
        }
        if (effDate && expDate && expDate < effDate) {
            setError('Expiry date must be after or equal to effectivity date');
            setIsCreatingVisitor(false);
            return;
        }

        try {
            const payload = {
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                firstName: visitorForm.firstName.trim(),
                middleName: visitorForm.middleName.trim(),
                lastName: visitorForm.lastName.trim(),
                dateOfBirth: visitorForm.dateOfBirth,
                addressLine: visitorForm.addressLine.trim(),
                city: visitorForm.city.trim(),
                province: visitorForm.state.trim(),
                postalCode: visitorForm.postalCode.trim(),
                gender: visitorForm.gender,
                phone: phoneData.fullNumber,
                phoneH: phoneHData.fullNumber || '',
                phoneM: visitorForm.phoneM || '',
                email: visitorForm.email.trim(),
                healthCardNumber: healthCardNumber,
                healthCardVersion: healthCardVersion.trim().toUpperCase(),
                healthCardEffectivityDate: healthCardEffectivityDate,
                healthCardExpiryDate: healthCardExpiryDate,
                notes: visitorForm.notes,
                memo: visitorForm.memo,
                guardianName: visitorForm.guardianName,
                guardianId: visitorForm.guardianId,
                guardianPhone: visitorForm.guardianPhone
            };

            if (editingVisitorId) {
                await visitorService.update(editingVisitorId, payload);
            } else {
                await visitorService.create(payload);
            }

            // Reset form
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
                guardianName: '',
                guardianId: '',
                guardianPhone: ''
            });
            setPhoneData({ fullNumber: '', valid: false });
            setPhoneHData({ fullNumber: '', valid: false });
            setHealthCardNumber('');
            setHealthCardVersion('');
            setHealthCardEffectivityDate('');
            setHealthCardExpiryDate('');
            setShowVisitorModal(false);
            setError('');
            setEditingVisitorId(null);

            // Reload visitors and interactions (a new visitor creates an interaction)
            await loadVisitors(userData.entityId);
            if (!editingVisitorId) {
                await loadInteractions(userData.entityId);
            }
        } catch (err) {
            setError(err.response?.data?.error || (editingVisitorId ? 'Failed to update patient' : 'Failed to create visitor'));
        } finally {
            setIsCreatingVisitor(false);
        }
    };

    const handleEditVisitor = (visitor) => {
        setEditingVisitorId(visitor.id);
        setVisitorForm({
            firstName: visitor.firstName || '',
            middleName: visitor.middleName || '',
            lastName: visitor.lastName || '',
            dateOfBirth: visitor.dateOfBirth || '',
            addressLine: visitor.addressLine || '',
            city: visitor.city || '',
            state: visitor.province || visitor.state || '',
            postalCode: visitor.postalCode || '',
            gender: visitor.gender || '',
            email: visitor.email || '',
            phoneH: visitor.phoneH || '',
            phoneM: visitor.phoneM || '',
            notes: visitor.notes || '',
            memo: visitor.memo || '',
            guardianName: visitor.guardianName || '',
            guardianId: visitor.guardianId || '',
            guardianPhone: visitor.guardianPhone || ''
        });
        setPhoneData({ fullNumber: visitor.phone || '', valid: true });
        setPhoneHData({ fullNumber: visitor.phoneH || '', valid: !!(visitor.phoneH) });
        setHealthCardNumber(formatHealthCardNumber(visitor.healthCardNumber || ''));
        setHealthCardVersion(visitor.healthCardVersion || '');
        setHealthCardEffectivityDate(visitor.healthCardEffectivityDate || '');
        setHealthCardExpiryDate(visitor.healthCardExpiryDate || '');
        setShowVisitorModal(true);
    };

    const handlePatientClick = (patient) => {
        setSelectedPatient(patient);
        setShowPatientDetailModal(true);
    };

    const handlePatientDragStart = (e, patient) => {
        setDraggedPatient(patient);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'patient'); // Use text/plain for better compatibility
        e.dataTransfer.setData('patient', 'true');

        // Create a custom drag image (box/card style)
        const dragImage = document.createElement('div');
        dragImage.className = 'bg-white border-2 border-blue-300 rounded-xl p-3 shadow-lg';
        dragImage.style.width = '180px';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        dragImage.style.pointerEvents = 'none';
        dragImage.innerHTML = `
            <div class="text-xs font-semibold text-blue-700 mb-1">New Registration</div>
            <div class="text-sm font-medium text-slate-900 truncate">${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}</div>
            <div class="text-xs text-slate-600 mt-1">ID: ${patient.entitySerial ? `${patient.entitySerial}-${patient.serial}` : patient.serial}</div>
        `;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 90, 45);

        // Remove the drag image after a short delay
        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 0);
    };

    const handlePatientDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedPatient) {
            console.log('No dragged patient found');
            return;
        }

        await handleRegisterPatient(draggedPatient);
        setDraggedPatient(null);
    };

    const handleRegisterPatient = async (patient) => {
        if (!patient) return;

        console.log('Registering patient:', patient);

        // Optimistic UI - create temporary interaction placeholder
        const tempId = `temp-${Date.now()}`;
        const optimisticInteraction = {
            id: tempId,
            interactionSerial: 'Loading...',
            entityId: userData.entityId,
            entitySerial: userData.entitySerial,
            visitorId: patient.id,
            visitorSerial: patient.serial,
            officerId: '',
            officerSerial: '',
            createdAt: new Date().toISOString(),
            editedAt: new Date().toISOString(),
            deletedAt: '',
            isPending: true,
            // Store visitor data for display
            _visitor: patient
        };

        setPendingInteractions(prev => [...prev, optimisticInteraction]);
        setIsCreatingInteraction(true);

        try {
            // Create a new interaction for this patient
            const visitorSerial = patient.serial;

            const response = await interactionService.create({
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                visitorId: patient.id,
                visitorSerial: visitorSerial
            });

            console.log('Successfully created interaction:', response);

            // Remove optimistic update
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));

            // Reload interactions to show the new one
            await loadInteractions(userData.entityId, interactionFilter);
        } catch (err) {
            console.error('Failed to create interaction:', err);
            // Remove optimistic update on error
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));
            showWarning('Failed to create registration: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsCreatingInteraction(false);
        }
    };

    const handleDeleteRegistration = async () => {
        if (!registrationToDelete) return;

        setIsDeletingRegistration(true);
        try {
            await interactionService.delete(registrationToDelete.id);
            await loadInteractions(userData.entityId);
            setShowDeleteRegistrationModal(false);
            setRegistrationToDelete(null);
        } catch (err) {
            console.error('Failed to delete registration:', err);
            showWarning('Failed to delete registration');
        } finally {
            setIsDeletingRegistration(false);
        }
    };

    const handleRegistrationDropOnBin = (e) => {
        e.preventDefault();
        if (draggedInteraction) {
            setRegistrationToDelete(draggedInteraction);
            setShowDeleteRegistrationModal(true);
            setDraggedInteraction(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('entityName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('entityId');
        localStorage.removeItem('entitySerial');
        navigate('/user/login');
    };

    return (
        <div
            className="flex h-[calc(100vh-64px)] relative overflow-x-hidden"
        >
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <UserSidebar
                userData={userData}
                serial={serial}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50">
                <div className="p-4 sm:p-6 lg:p-8">
                    {activeTab === 'reception' && (
                        <ReceptionTab
                            visitors={visitors}
                            searchFirstName={searchFirstName}
                            isCreatingVisitor={isCreatingVisitor}
                            deletingVisitorId={deletingVisitorId}
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
                            warningMessage={warningMessage}
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
                            handleRegistrationDropOnBin={handleRegistrationDropOnBin}
                            showDeleteRegistrationModal={showDeleteRegistrationModal}
                            setShowDeleteRegistrationModal={setShowDeleteRegistrationModal}
                            registrationToDelete={registrationToDelete}
                            handleDeleteRegistration={handleDeleteRegistration}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}

                            formatDate={formatDate}
                            interactionFilter={interactionFilter}
                            setInteractionFilter={setInteractionFilter}

                            isDeletingRegistration={isDeletingRegistration}
                            isCreatingInteraction={isCreatingInteraction}
                            isAssigningInteraction={isAssigningInteraction}
                            pendingInteractions={pendingInteractions}
                            pendingAssignments={pendingAssignments}
                            handleDragEnd={handleDragEnd}
                            draggedInteraction={draggedInteraction}
                            handleRegisterPatient={handleRegisterPatient}
                            nextVisitorSerial={nextVisitorSerial}
                        />
                    )}

                    {activeTab === 'officer' && (
                        <OfficerTab
                            userData={userData}
                            interactions={interactions}
                            visitors={visitors}
                        />
                    )}
                </div>
            </main>

        </div>
    );
};

export default UserDashboard;

