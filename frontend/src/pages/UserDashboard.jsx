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
    const [visitors, setVisitors] = useState([]);
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchMiddleName, setSearchMiddleName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchIdCard, setSearchIdCard] = useState('');
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
    const [idCardNumber, setIdCardNumber] = useState('');
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
            setDraggedInteraction(null);
            setDraggedOverOfficer(null);
            setDraggedOverUnassigned(false);
        } catch (err) {
            console.error('Failed to assign/unassign officer:', err);
            if (err.response?.status === 403) {
                showWarning('Only receptionist can perform this action');
            } else {
                showWarning('Failed to update interaction assignment');
            }
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

    const formatIdCardNumber = (value) => {
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

    const handleIdCardChange = (e) => {
        const formatted = formatIdCardNumber(e.target.value);
        setIdCardNumber(formatted);
    };

    const handleCreateVisitor = async (e) => {
        e.preventDefault();
        setError('');

        // Validate required fields
        if (!visitorForm.firstName || !visitorForm.lastName || !visitorForm.dateOfBirth ||
            !visitorForm.addressLine || !visitorForm.city || !visitorForm.state ||
            !visitorForm.gender || !phoneData.valid || !idCardNumber) {
            setError('Please fill in all required fields');
            return;
        }

        // Validate ID card number (should be 10 digits after formatting)
        const cleanIdCard = idCardNumber.replace(/-/g, '');
        if (cleanIdCard.length !== 10) {
            setError('ID card number must be exactly 10 digits');
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

        // Validate date format (should be DD-MM-YYYY)
        const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
        if (!dateRegex.test(visitorForm.dateOfBirth)) {
            setError('Date of birth must be in DD-MM-YYYY format');
            return;
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
                state: visitorForm.state.trim(),
                postalCode: visitorForm.postalCode.trim(),
                gender: visitorForm.gender,
                phone: phoneData.fullNumber,
                phoneH: phoneHData.fullNumber || '',
                email: visitorForm.email.trim(),
                idCardNumber: cleanIdCard,
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
            setIdCardNumber('');
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
        }
    };

    const handleDeleteVisitor = async (visitorId) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await visitorService.delete(visitorId);
                if (userData?.entityId) {
                    await loadVisitors(userData.entityId);
                }
            } catch (e) {
                alert('Failed to delete patient');
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
            
            // Reload interactions to show the new one
            await loadInteractions(userData.entityId);
            setDraggedPatient(null);
        } catch (err) {
            console.error('Failed to create interaction:', err);
            console.error('Error details:', err.response?.data || err.message);
            showWarning('Failed to create registration: ' + (err.response?.data?.error || err.message));
            setDraggedPatient(null);
        }
    };

    const handleDeleteRegistration = async () => {
        if (!registrationToDelete) return;
        
        try {
            await interactionService.delete(registrationToDelete.id);
            await loadInteractions(userData.entityId);
            setShowDeleteRegistrationModal(false);
            setRegistrationToDelete(null);
        } catch (err) {
            console.error('Failed to delete registration:', err);
            showWarning('Failed to delete registration');
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
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <UserSidebar
                userData={userData}
                serial={serial}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                <UserHeader activeTab={activeTab} />

                <div className="p-8">
                    {activeTab === 'reception' && (
                        <ReceptionTab
                            visitors={visitors}
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
                            searchIdCard={searchIdCard}
                            setSearchIdCard={setSearchIdCard}
                            showVisitorModal={showVisitorModal}
                            setShowVisitorModal={setShowVisitorModal}
                            visitorForm={visitorForm}
                            setVisitorForm={setVisitorForm}
                            phoneData={phoneData}
                            setPhoneData={setPhoneData}
                            phoneHData={phoneHData}
                            setPhoneHData={setPhoneHData}
                            idCardNumber={idCardNumber}
                            setIdCardNumber={setIdCardNumber}
                            healthCardVersion={healthCardVersion}
                            setHealthCardVersion={setHealthCardVersion}
                            healthCardEffectivityDate={healthCardEffectivityDate}
                            setHealthCardEffectivityDate={setHealthCardEffectivityDate}
                            healthCardExpiryDate={healthCardExpiryDate}
                            setHealthCardExpiryDate={setHealthCardExpiryDate}
                            handleCreateVisitor={handleCreateVisitor}
                            handleIdCardChange={handleIdCardChange}
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
                        />
                    )}

                    {activeTab === 'officer' && (
                        <OfficerTab />
                    )}
                </div>
            </main>

        </div>
    );
};

export default UserDashboard;

