import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { visitorService } from '../services/visitorService';
import { interactionService } from '../services/interactionService';
import { officerService } from '../services/officerService';
import { validateEmail } from '../utils/crypto';
import UserSidebar from '../components/UserSidebar';
import UserHeader from '../components/UserHeader';
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
        phoneH: ''
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
    
    // Loading states
    const [isCreatingVisitor, setIsCreatingVisitor] = useState(false);
    const [deletingVisitorId, setDeletingVisitorId] = useState(null);
    const [isDeletingRegistration, setIsDeletingRegistration] = useState(false);
    const [isCreatingInteraction, setIsCreatingInteraction] = useState(false);
    const [isAssigningInteraction, setIsAssigningInteraction] = useState(false);
    
    // Optimistic UI states for drag and drop
    const [pendingInteractions, setPendingInteractions] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
                // Officers go to officer tab, receptionists go to reception tab
                if (decoded.role === 'officer') {
                    setActiveTab('officer');
                } else if (decoded.role === 'receptionist') {
                    setActiveTab('reception');
                }
                
                // Load visitors, interactions, and officers if user has entityId
                console.log('UserDashboard useEffect - decoded token:', decoded);
                console.log('UserDashboard useEffect - entityId:', decoded.entityId);
                if (decoded.entityId) {
                    loadVisitors(decoded.entityId);
                    loadInteractions(decoded.entityId);
                    loadOfficers(decoded.entityId);
                } else {
                    console.warn('UserDashboard - No entityId found in token');
                }
            } catch (e) {
                console.error('Failed to decode token');
            }
        }
    }, []);

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

    const loadInteractions = async (entityId) => {
        try {
            const data = await interactionService.getByEntity(entityId);
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
        if (userData?.role !== 'receptionist') {
            e.preventDefault();
            showWarning('Only receptionist can perform this action');
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

    const handleDrop = async (e, officer = null) => {
        e.preventDefault();
        
        if (userData?.role !== 'receptionist') {
            showWarning('Only receptionist can perform this action');
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
                showWarning('Only receptionist can perform this action');
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
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        // Limit to 10 digits
        const limited = digits.substring(0, 10);
        // Format: 1234-5678-90
        if (limited.length <= 4) {
            return limited;
        } else if (limited.length <= 8) {
            return `${limited.substring(0, 4)}-${limited.substring(4)}`;
        } else {
            return `${limited.substring(0, 4)}-${limited.substring(4, 8)}-${limited.substring(8)}`;
        }
    };

    const handleHealthCardChange = (e) => {
        const formatted = formatHealthCardNumber(e.target.value);
        setHealthCardNumber(formatted);
    };

    const handleCreateVisitor = async (e) => {
        e.preventDefault();
        setError('');
        setIsCreatingVisitor(true);

        // Validate required fields
        if (!visitorForm.firstName || !visitorForm.lastName || !visitorForm.dateOfBirth ||
            !visitorForm.addressLine || !visitorForm.city || !visitorForm.state ||
            !visitorForm.gender || !phoneData.valid || !healthCardNumber) {
            setError('Please fill in all required fields');
            setIsCreatingVisitor(false);
            return;
        }

        // Validate health card number (should be 10 digits after formatting)
        const cleanHealthCard = healthCardNumber.replace(/-/g, '');
        if (cleanHealthCard.length !== 10) {
            setError('Health card number must be exactly 10 digits');
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

        // Validate postal code (should be exactly 5 digits if provided)
        if (visitorForm.postalCode && visitorForm.postalCode.trim().length > 0) {
            const postalCodeDigits = visitorForm.postalCode.replace(/\D/g, '');
            if (postalCodeDigits.length !== 5) {
                setError('Postal code must be exactly 5 digits');
                setIsCreatingVisitor(false);
                return;
            }
        }

        // Validate health card version (max 2 characters if provided)
        if (healthCardVersion && healthCardVersion.trim().length > 2) {
            setError('Health card version must be maximum 2 characters');
            setIsCreatingVisitor(false);
            return;
        }

        // Validate effectivity date if provided
        if (healthCardEffectivityDate && healthCardEffectivityDate.trim().length > 0) {
            if (!dateRegex.test(healthCardEffectivityDate)) {
                setError('Effectivity date must be in MM-DD-YYYY format');
                setIsCreatingVisitor(false);
                return;
            }
            const effectivityValidation = validateDate(healthCardEffectivityDate, 'Effectivity date');
            if (!effectivityValidation.valid) {
                setError(effectivityValidation.error);
                setIsCreatingVisitor(false);
                return;
            }
        }

        // Validate expiry date if provided
        if (healthCardExpiryDate && healthCardExpiryDate.trim().length > 0) {
            if (!dateRegex.test(healthCardExpiryDate)) {
                setError('Expiry date must be in MM-DD-YYYY format');
                setIsCreatingVisitor(false);
                return;
            }
            
            // Validate expiry date format and values (but allow future dates)
            const expiryParts = healthCardExpiryDate.split('-');
            const expiryMonth = parseInt(expiryParts[0], 10);
            const expiryDay = parseInt(expiryParts[1], 10);
            const expiryYear = parseInt(expiryParts[2], 10);
            
            // Check for absurd values
            if (expiryMonth < 1 || expiryMonth > 12) {
                setError('Expiry date has an invalid month');
                setIsCreatingVisitor(false);
                return;
            }
            if (expiryDay < 1 || expiryDay > 31) {
                setError('Expiry date has an invalid day');
                setIsCreatingVisitor(false);
                return;
            }
            if (expiryYear < 1900 || expiryYear > 2100) {
                setError('Expiry date has an invalid year');
                setIsCreatingVisitor(false);
                return;
            }
            
            // Create date object and check if it's valid
            const expiryDate = new Date(expiryYear, expiryMonth - 1, expiryDay);
            if (expiryDate.getDate() !== expiryDay || expiryDate.getMonth() !== expiryMonth - 1 || expiryDate.getFullYear() !== expiryYear) {
                setError('Expiry date is not a valid date');
                setIsCreatingVisitor(false);
                return;
            }

            // Check if expiry date is after effectivity date
            if (healthCardEffectivityDate && healthCardEffectivityDate.trim().length > 0) {
                const effectivityParts = healthCardEffectivityDate.split('-');
                const effectivityDate = new Date(
                    parseInt(effectivityParts[2], 10),
                    parseInt(effectivityParts[0], 10) - 1,
                    parseInt(effectivityParts[1], 10)
                );
                
                if (expiryDate <= effectivityDate) {
                    setError('Expiry date must be after effectivity date');
                    setIsCreatingVisitor(false);
                    return;
                }
            }
        }

        try {
            await visitorService.create({
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                firstName: visitorForm.firstName.trim(),
                middleName: visitorForm.middleName.trim(),
                lastName: visitorForm.lastName.trim(),
                dateOfBirth: visitorForm.dateOfBirth,
                addressLine: visitorForm.addressLine.trim(),
                city: visitorForm.city.trim(),
                province: visitorForm.state.trim(), // Frontend uses 'state' but backend expects 'province'
                postalCode: visitorForm.postalCode.trim(),
                gender: visitorForm.gender,
                phone: phoneData.fullNumber,
                phoneH: phoneHData.fullNumber || '',
                email: visitorForm.email.trim(),
                healthCardNumber: cleanHealthCard,
                healthCardVersion: healthCardVersion.trim(),
                healthCardEffectivityDate: healthCardEffectivityDate,
                healthCardExpiryDate: healthCardExpiryDate
            });

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
                phoneH: ''
            });
            setPhoneData({ fullNumber: '', valid: false });
            setPhoneHData({ fullNumber: '', valid: false });
            setHealthCardNumber('');
            setHealthCardVersion('');
            setHealthCardEffectivityDate('');
            setHealthCardExpiryDate('');
            setShowVisitorModal(false);
            setError('');

            // Reload visitors and interactions (a new visitor creates an interaction)
            await loadVisitors(userData.entityId);
            await loadInteractions(userData.entityId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create visitor');
        } finally {
            setIsCreatingVisitor(false);
        }
    };

    const handleDeleteVisitor = async (visitorId) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            setDeletingVisitorId(visitorId);
            try {
                await visitorService.delete(visitorId);
                if (userData?.entityId) {
                    await loadVisitors(userData.entityId);
                }
            } catch (e) {
                alert('Failed to delete patient');
            } finally {
                setDeletingVisitorId(null);
            }
        }
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

        console.log('Dropping patient:', draggedPatient);

        // Optimistic UI - create temporary interaction placeholder
        const tempId = `temp-${Date.now()}`;
        const visitorSerial = draggedPatient.entitySerial 
            ? `${draggedPatient.entitySerial}-${draggedPatient.serial}` 
            : draggedPatient.serial;
        const optimisticInteraction = {
            id: tempId,
            interactionSerial: 'Loading...',
            entityId: userData.entityId,
            entitySerial: userData.entitySerial,
            visitorId: draggedPatient.id,
            visitorSerial: draggedPatient.serial,
            officerId: '',
            officerSerial: '',
            createdAt: new Date().toISOString(),
            editedAt: new Date().toISOString(),
            deletedAt: '',
            isPending: true,
            // Store visitor data for display
            _visitor: draggedPatient
        };
        
        setPendingInteractions(prev => [...prev, optimisticInteraction]);
        setIsCreatingInteraction(true);

        try {
            // Create a new interaction for this patient
            // The backend will generate the interaction serial and timestamp
            // Send just the serial number, not the composite format
            const visitorSerial = draggedPatient.serial;

            console.log('Creating interaction with:', {
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                visitorId: draggedPatient.id,
                visitorSerial: visitorSerial
            });

            const response = await interactionService.create({
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                visitorId: draggedPatient.id,
                visitorSerial: visitorSerial
            });

            console.log('Successfully created interaction:', response);
            
            // Remove optimistic update
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));
            
            // Reload interactions to show the new one
            await loadInteractions(userData.entityId);
            setDraggedPatient(null);
        } catch (err) {
            console.error('Failed to create interaction:', err);
            console.error('Error details:', err.response?.data || err.message);
            // Remove optimistic update on error
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));
            showWarning('Failed to create registration: ' + (err.response?.data?.error || err.message));
            setDraggedPatient(null);
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
        navigate('/user/login');
    };

    return (
        <div className="flex h-[calc(100vh-64px)] relative overflow-x-hidden">
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
                <UserHeader 
                    activeTab={activeTab} 
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />

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
                            handleDeleteVisitor={handleDeleteVisitor}
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
                            isDeletingRegistration={isDeletingRegistration}
                            isCreatingInteraction={isCreatingInteraction}
                            isAssigningInteraction={isAssigningInteraction}
                            pendingInteractions={pendingInteractions}
                            pendingAssignments={pendingAssignments}
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

