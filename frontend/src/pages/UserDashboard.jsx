import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { visitorService } from '../services/visitorService';
import { interactionService } from '../services/interactionService';
import { officerService } from '../services/officerService';
import { validateEmail } from '../utils/crypto';
import { formatHealthCardDisplay, parseHealthCardToDigits, getVisitorSerialDisplay } from '../utils/formatUtils';
import { useUserDashboardNav } from '../contexts/UserDashboardNavContext';
import ReceptionTab from '../components/ReceptionTab';
import { MasterDataProvider } from '../contexts/MasterDataContext';
import OfficerTab from '../components/OfficerTab';
import InteractionDetailsModal from '../components/InteractionDetailsModal';
import QueueRegistrationModal from '../components/QueueRegistrationModal';
import MediaViewerModal from '../components/MediaViewerModal';
import { reportService } from '../services/reportService';

const UserDashboard = () => {
    const navigate = useNavigate();
    const { serial } = useParams();
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('reception');
    const { register, unregister } = useUserDashboardNav();
    const [visitors, setVisitors] = useState([]);
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchMiddleName, setSearchMiddleName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [searchHealthCard, setSearchHealthCard] = useState('');
    const [searchDob, setSearchDob] = useState('');
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
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [phoneHData, setPhoneHData] = useState({ fullNumber: '', valid: false });
    const [phoneMData, setPhoneMData] = useState({ fullNumber: '', valid: false });
    const [guardianPhoneData, setGuardianPhoneData] = useState({ fullNumber: '', valid: false });
    const [healthCardNumber, setHealthCardNumber] = useState('');
    const [healthCardVersion, setHealthCardVersion] = useState('');
    const [healthCardEffectivityDate, setHealthCardEffectivityDate] = useState('');
    const [healthCardExpiryDate, setHealthCardExpiryDate] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
    const [draggedPatient, setDraggedPatient] = useState(null);
    const [showDeleteRegistrationModal, setShowDeleteRegistrationModal] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState(null);
    const [queueModalInteraction, setQueueModalInteraction] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [error, setError] = useState('');
    const [interactions, setInteractions] = useState([]);
    const [lastVisits, setLastVisits] = useState({}); // visitorId -> last completed interaction (from backend, ignores time filter)
    const [isLoadingInteractions, setIsLoadingInteractions] = useState(true);
    const [officers, setOfficers] = useState([]);
    const [warningMessage, setWarningMessage] = useState('');
    const [draggedInteraction, setDraggedInteraction] = useState(null);
    const [draggedOverOfficer, setDraggedOverOfficer] = useState(null);
    const [draggedOverUnassigned, setDraggedOverUnassigned] = useState(false);

    const [fieldErrors, setFieldErrors] = useState({});

    // Filter state
    const [interactionFilter, setInteractionFilter] = useState('this_week');

    // Loading states
    const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);
    const [isCreatingVisitor, setIsCreatingVisitor] = useState(false);
    const [deletingVisitorId, setDeletingVisitorId] = useState(null);
    const [isDeletingRegistration, setIsDeletingRegistration] = useState(false);
    const [isCreatingInteraction, setIsCreatingInteraction] = useState(false);
    const [isAssigningInteraction, setIsAssigningInteraction] = useState(false);
    const [registeringFollowupForId, setRegisteringFollowupForId] = useState(null);

    // Optimistic UI states for drag and drop
    const [pendingInteractions, setPendingInteractions] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState({}); // { interactionId: targetOfficerId | '' }
    const [assignmentFailed, setAssignmentFailed] = useState({}); // { interactionId: true } when API failed

    // Next visitor serial (for preview in create form)
    const [nextVisitorSerial, setNextVisitorSerial] = useState('');

    // Interaction & Media details
    const [selectedInteraction, setSelectedInteraction] = useState(null);
    const [showInteractionDetailModal, setShowInteractionDetailModal] = useState(false);
    const [patientReports, setPatientReports] = useState([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [viewingMedia, setViewingMedia] = useState(null);

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

    }, []);

    const handleLogout = useCallback(() => {
        setShowLogoutModal(true);
    }, []);

    // Register nav state with NavBar context (for top bar tabs + profile dropdown)
    useEffect(() => {
        if (userData && serial) {
            register({
                activeTab,
                setActiveTab,
                userData,
                serial,
                onLogout: handleLogout
            });
        }
        return () => unregister();
    }, [userData, serial, activeTab, register, unregister, handleLogout]);

    // 2. Load Constant Data (Visitors, Officers)
    useEffect(() => {
        if (userData?.entityId) {
            loadVisitors(userData.entityId);
            loadOfficers(userData.entityId);
        } else {
            setIsLoadingVisitors(false);
        }
    }, [userData?.entityId]);

    // 3. Load Interactions once on mount/filter change (no polling - fetch only when needed)
    useEffect(() => {
        if (!userData?.entityId) {
            setIsLoadingInteractions(false);
            return;
        }
        loadInteractions(userData.entityId, interactionFilter);
    }, [userData?.entityId, interactionFilter]);

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
        setIsLoadingVisitors(true);
        try {
            const data = await visitorService.getByEntity(entityId);
            setVisitors(data || []);
        } catch (e) {
            console.error('Failed to load visitors:', e);
            setVisitors([]);
        } finally {
            setIsLoadingVisitors(false);
        }
    };

    const loadInteractions = async (entityId, filter = 'this_week') => {
        setIsLoadingInteractions(true);
        try {
            const data = await interactionService.getByEntity(entityId, filter);
            setInteractions(data?.interactions ?? data ?? []);
            setLastVisits(data?.lastVisits ?? {});
        } catch (e) {
            console.error('Failed to load interactions:', e);
            setInteractions([]);
            setLastVisits({});
        } finally {
            setIsLoadingInteractions(false);
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
        const targetOfficerId = officer ? officer.id : '';
        const currentOfficerId = draggedInteraction.officerId || '';

        // No change - drop back where it came from (unassigned→unassigned or same officer)
        if (targetOfficerId === currentOfficerId) {
            setDraggedInteraction(null);
            setDraggedOverOfficer(null);
            setDraggedOverUnassigned(false);
            return;
        }

        // Optimistic UI: show card in target area immediately with spinner until API completes
        setPendingAssignments(prev => ({
            ...prev,
            [interactionId]: targetOfficerId
        }));
        setAssignmentFailed(prev => {
            const next = { ...prev };
            delete next[interactionId];
            return next;
        });

        try {
            let updated;
            if (!officer) {
                updated = await interactionService.assignOfficer(draggedInteraction.id, '', '');
            } else {
                updated = await interactionService.assignOfficer(draggedInteraction.id, officer.id, officer.serial);
            }

            // Update local state from API response immediately – spinner stops only when assign API returns
            if (updated) {
                setInteractions(prev =>
                    prev.map(i => (i.id === interactionId ? { ...i, ...updated } : i))
                );
            }

            // Clear pending state only after assign API has fully succeeded
            setPendingAssignments(prev => {
                const newState = { ...prev };
                delete newState[interactionId];
                return newState;
            });

            setDraggedInteraction(null);
            setDraggedOverOfficer(null);
            setDraggedOverUnassigned(false);

            // Refresh list in background for consistency (no await – don't block spinner removal)
            loadInteractions(userData.entityId, interactionFilter);
        } catch (err) {
            console.error('Failed to assign/unassign officer:', err);
            setAssignmentFailed(prev => ({ ...prev, [interactionId]: true }));
            if (err.response?.status === 403) {
                showWarning('Only receptionist and doctors can perform this action');
            } else {
                showWarning('Failed to update interaction assignment');
            }
            // After 1s, revert: remove from target area, card goes back to origin
            setTimeout(() => {
                setPendingAssignments(prev => {
                    const newState = { ...prev };
                    delete newState[interactionId];
                    return newState;
                });
                setAssignmentFailed(prev => {
                    const next = { ...prev };
                    delete next[interactionId];
                    return next;
                });
            }, 1000);
        } finally {
            setIsAssigningInteraction(false);
        }
    };

    /** Assign a registration to a doctor (same as drop-on-doctor, without drag). Returns true on success. */
    const handleAssignToOfficer = async (interaction, officer) => {
        if (userData?.role !== 'receptionist' && userData?.role !== 'officer') {
            showWarning('Only receptionist and doctors can perform this action');
            return false;
        }
        const interactionId = interaction.id;
        setPendingAssignments(prev => ({ ...prev, [interactionId]: officer.id }));
        setAssignmentFailed(prev => {
            const next = { ...prev };
            delete next[interactionId];
            return next;
        });
        try {
            const updated = await interactionService.assignOfficer(interaction.id, officer.id, officer.serial);
            if (updated) {
                setInteractions(prev =>
                    prev.map(i => (i.id === interactionId ? { ...i, ...updated } : i))
                );
            }
            setPendingAssignments(prev => {
                const next = { ...prev };
                delete next[interactionId];
                return next;
            });
            loadInteractions(userData.entityId, interactionFilter);
            return true;
        } catch (err) {
            console.error('Failed to assign officer:', err);
            setAssignmentFailed(prev => ({ ...prev, [interactionId]: true }));
            if (err.response?.status === 403) {
                showWarning('Only receptionist and doctors can perform this action');
            } else {
                showWarning('Failed to update interaction assignment');
            }
            setTimeout(() => {
                setPendingAssignments(prev => {
                    const next = { ...prev };
                    delete next[interactionId];
                    return next;
                });
                setAssignmentFailed(prev => {
                    const next = { ...prev };
                    delete next[interactionId];
                    return next;
                });
            }, 1000);
            return false;
        }
    };

    const formatDate = (dateString, includeTime = true) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        const datePart = `${mm}-${dd}-${yyyy}`;

        if (!includeTime) return datePart;

        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${datePart} ${hh}:${min}`;
    };

    const getVisitorName = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        if (!visitor) return 'Unknown';
        return `${visitor.firstName} ${visitor.middleName ? visitor.middleName + ' ' : ''}${visitor.lastName}`;
    };
    const getVisitorSerial = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        if (!visitor) return 'N/A';
        const raw = visitor.serial ?? (visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial || ''}` : visitor.serial || '');
        if (!raw) return 'N/A';
        const s = String(raw);
        const num = s.includes('-') ? s.split('-').pop() : s;
        return num ? String(num).padStart(6, '0') : 'N/A';
    };

    const getVisitorHealthCard = (visitorId) => {
        const visitor = visitors.find(v => v.id === visitorId);
        return visitor?.healthCardNumber ? formatHealthCardDisplay(visitor.healthCardNumber) : 'N/A';
    };

    const getOfficerName = (officerId) => {
        if (!officerId) return 'Unassigned';
        const officer = officers.find(o => o.id === officerId);
        if (!officer) return 'Unassigned';
        return officer.name || 'Unassigned';
    };

    const handleRegisterFollowup = async (interaction) => {
        if (!interaction) return;

        setRegisteringFollowupForId(interaction.id);

        // Get visitor data
        const visitor = visitors.find(v => v.id === interaction.visitorId);
        if (!visitor) {
            setRegisteringFollowupForId(null);
            showWarning('Patient not found');
            return;
        }

        // Check if patient already has an active (incomplete) registration
        const isAlreadyRegistered = interactions.some(i => i.visitorId === interaction.visitorId && !i.completed && i.id !== interaction.id);
        if (isAlreadyRegistered) {
            setRegisteringFollowupForId(null);
            showWarning(`${visitor.firstName} ${visitor.lastName} is already registered and hasn't completed their visit.`);
            return;
        }

        console.log('Registering followup for interaction:', interaction);

        // Optimistic UI - create temporary interaction placeholder
        const tempId = `temp-${Date.now()}`;
        const visitorSerial = visitor.serial;
        const optimisticInteraction = {
            id: tempId,
            interactionSerial: 'Loading...',
            entityId: userData.entityId,
            entitySerial: userData.entitySerial,
            visitorId: visitor.id,
            visitorSerial: visitorSerial,
            officerId: '',
            officerSerial: '',
            createdAt: new Date().toISOString(),
            editedAt: new Date().toISOString(),
            deletedAt: '',
            isPending: true,
            _visitor: visitor
        };

        setPendingInteractions(prev => [...prev, optimisticInteraction]);
        setIsCreatingInteraction(true);

        try {
            // Create a new interaction for this patient
            const response = await interactionService.create({
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                visitorId: visitor.id,
                visitorSerial: visitorSerial
            });

            console.log('Successfully created followup interaction:', response);

            // Update the main interaction with reference to the followup (unassigned)
            const existingFr = interaction.followupRequired || interaction.followup;
            await interactionService.saveDetails(interaction.id, {
                followupRequired: {
                    required: existingFr?.required ?? true,
                    date: existingFr?.date || '',
                    followupInteractionId: response.id
                }
            });

            // Mark the new interaction as a followup with parent reference (keep started: false so it stays deletable)
            await interactionService.saveDetails(response.id, {
                followup: { isFollowup: true, parentInteractionId: interaction.id },
                started: false,
                ongoing: false,
                incomplete: false
            });

            // Remove optimistic update
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));

            // Reload interactions to show the new one
            await loadInteractions(userData.entityId, interactionFilter);
        } catch (err) {
            console.error('Failed to create followup interaction:', err);
            // Remove optimistic update on error
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));
            showWarning('Failed to create followup registration: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsCreatingInteraction(false);
            setRegisteringFollowupForId(null);
        }
    };

    const checkHealthCardDuplicate = (digits, version) => {
        if (!digits || digits.length !== 10) return null;
        const ver = (version || '').trim().toUpperCase();
        if (!ver || !/^[A-Za-z]{1,2}$/.test(ver)) return null;
        const duplicate = visitors.find(v =>
            v.id !== editingVisitorId &&
            parseHealthCardToDigits(v.healthCardNumber || '') === digits &&
            (v.healthCardVersion || '').trim().toUpperCase() === ver
        );
        return duplicate ? duplicate : null;
    };

    const handleHealthCardVersionChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        setHealthCardVersion(val);
        if (val && /^[A-Za-z]{1,2}$/.test(val)) {
            setFieldErrors(prev => { const n = { ...prev }; delete n.healthCardVersion; return n; });
        }
        const dup = checkHealthCardDuplicate(parseHealthCardToDigits(healthCardNumber), val);
        if (dup) {
            setFieldErrors(prev => ({ ...prev, healthCard: `Health card already in use (${dup.firstName} ${dup.lastName})` }));
        } else {
            setFieldErrors(prev => { const n = { ...prev }; delete n.healthCard; return n; });
        }
    };

    const handleHealthCardChange = (e) => {
        const raw = parseHealthCardToDigits(e.target.value);
        const masked = formatHealthCardDisplay(raw);
        setHealthCardNumber(masked);

        const digits = parseHealthCardToDigits(masked);
        if (!digits) setFieldErrors(prev => ({ ...prev, healthCard: 'Health card number is required' }));
        else if (digits.length < 10) setFieldErrors(prev => ({ ...prev, healthCard: 'Must be 10 digits (XXXX-XXX-XXX)' }));
        else {
            const dup = checkHealthCardDuplicate(digits, healthCardVersion);
            if (dup) {
                setFieldErrors(prev => ({ ...prev, healthCard: `Health card already in use (${dup.firstName} ${dup.lastName})` }));
            } else {
                setFieldErrors(prev => { const n = { ...prev }; delete n.healthCard; return n; });
            }
        }
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
        if (!visitorForm.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';
        else {
            const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
            if (!postalMask.test(visitorForm.postalCode.trim())) {
                newErrors.postalCode = 'Postal code must be in format A1B-2C3';
            }
        }
        if (!visitorForm.gender) newErrors.gender = 'Sex is required';
        if (!phoneMData.valid) newErrors.phoneM = 'Phone (M) is required';
        if (!healthCardNumber?.trim()) newErrors.healthCard = 'Health card number is required';
        else if (parseHealthCardToDigits(healthCardNumber).length !== 10) newErrors.healthCard = 'Must be 10 digits (XXXX-XXX-XXX)';
        if (!healthCardVersion?.trim()) newErrors.healthCardVersion = 'Health card version is required';
        else if (!/^[A-Za-z]{1,2}$/.test(healthCardVersion.trim())) newErrors.healthCardVersion = 'Version must be 1-2 letters (e.g. AB)';
        if (!healthCardEffectivityDate) newErrors.healthCardEffectivity = 'Effectivity date is required';
        if (!healthCardExpiryDate) newErrors.healthCardExpiry = 'Expiry date is required';

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
        const healthCardDigits = parseHealthCardToDigits(healthCardNumber);
        if (healthCardDigits.length !== 10) {
            setError('Health card number must be exactly 10 digits (XXXX-XXX-XXX)');
            setIsCreatingVisitor(false);
            return;
        }
        const versionNorm = (healthCardVersion || '').trim().toUpperCase();
        const duplicate = visitors.find(v =>
            v.id !== editingVisitorId &&
            parseHealthCardToDigits(v.healthCardNumber || '') === healthCardDigits &&
            (v.healthCardVersion || '').trim().toUpperCase() === versionNorm
        );
        if (duplicate) {
            setError('Health card number and version already in use');
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

        // Validate postal code (required, Canadian mask A1B-2C3)
        if (!visitorForm.postalCode?.trim()) {
            setError('Postal code is required');
            setIsCreatingVisitor(false);
            return;
        }
        const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
        if (!postalMask.test(visitorForm.postalCode.trim())) {
            setError('Postal code must be in format A1B-2C3');
            setIsCreatingVisitor(false);
            return;
        }

        // Validate health card version (1-2 alphabetic, required)
        if (!healthCardVersion?.trim()) {
            setError('Health card version is required (e.g. AB)');
            setIsCreatingVisitor(false);
            return;
        }
        if (!/^[A-Za-z]{1,2}$/.test(healthCardVersion.trim())) {
            setError('Health card version must be 1-2 letters (e.g. AB)');
            setIsCreatingVisitor(false);
            return;
        }

        // Dates: required, expiry >= effectivity
        if (!healthCardEffectivityDate) {
            setError('Effectivity date is required');
            setIsCreatingVisitor(false);
            return;
        }
        if (!healthCardExpiryDate) {
            setError('Expiry date is required');
            setIsCreatingVisitor(false);
            return;
        }
        const effDate = new Date(healthCardEffectivityDate);
        const expDate = new Date(healthCardExpiryDate);
        if (isNaN(effDate.getTime())) {
            setError('Effectivity date is invalid');
            setIsCreatingVisitor(false);
            return;
        }
        if (isNaN(expDate.getTime())) {
            setError('Expiry date is invalid');
            setIsCreatingVisitor(false);
            return;
        }
        if (expDate < effDate) {
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
                phone: phoneMData.fullNumber || '',
                phoneM: phoneMData.fullNumber || '',
                phoneB: phoneData.fullNumber || '',
                phoneH: phoneHData.fullNumber || '',
                email: visitorForm.email.trim(),
                healthCardNumber: healthCardDigits,
                healthCardVersion: healthCardVersion.trim().toUpperCase(),
                healthCardEffectivityDate: healthCardEffectivityDate,
                healthCardExpiryDate: healthCardExpiryDate,
                notes: visitorForm.notes,
                memo: visitorForm.memo,
                // Red-zone (clinical) fields – always send so backend persists them
                allergies: (visitorForm.allergies != null && String(visitorForm.allergies).trim()) ? String(visitorForm.allergies).trim() : 'N/A',
                drugReactions: (visitorForm.drugReactions != null && String(visitorForm.drugReactions).trim()) ? String(visitorForm.drugReactions).trim() : 'N/A',
                ongoingHealthConditions: (visitorForm.ongoingHealthConditions != null && String(visitorForm.ongoingHealthConditions).trim()) ? String(visitorForm.ongoingHealthConditions).trim() : 'N/A',
                specialNotes: (visitorForm.specialNotes != null && String(visitorForm.specialNotes).trim()) ? String(visitorForm.specialNotes).trim() : '',
                highBloodPressure: visitorForm.highBloodPressure === 'yes' || visitorForm.highBloodPressure === 'no' ? visitorForm.highBloodPressure : '',
                heartDisease: visitorForm.heartDisease === 'yes' || visitorForm.heartDisease === 'no' ? visitorForm.heartDisease : '',
                diabetes: visitorForm.diabetes === 'yes' || visitorForm.diabetes === 'no' ? visitorForm.diabetes : '',
                cholesterol: visitorForm.cholesterol === 'yes' || visitorForm.cholesterol === 'no' ? visitorForm.cholesterol : '',
                smoke: visitorForm.smoke === 'yes' || visitorForm.smoke === 'no' ? visitorForm.smoke : '',
                guardianName: visitorForm.guardianName || '',
                guardianPhone: guardianPhoneData.fullNumber || '',
                ...(visitorForm.guardianId?.length === 6 && visitors.some((v) => {
                    const serial = v.serial ? String(v.serial).padStart(6, '0') : '';
                    return serial === visitorForm.guardianId;
                })
                    ? { guardianId: visitorForm.guardianId }
                    : {}),
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
            setShowVisitorModal(false);
            setError('');
            setEditingVisitorId(null);

            // Reload visitors and interactions
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

    const handleOpenAddModal = () => {
        setEditingVisitorId(null);
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
            allergies: 'N/A',
            drugReactions: 'N/A',
            ongoingHealthConditions: 'N/A',
            specialNotes: '',
            highBloodPressure: '',
            heartDisease: '',
            diabetes: '',
            cholesterol: '',
            smoke: '',
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
        setGuardianPhoneData({ fullNumber: '', valid: false });
        setHealthCardNumber('');
        setHealthCardVersion('');
        setHealthCardEffectivityDate('');
        setHealthCardExpiryDate('');
        setError('');
        setFieldErrors({});
        setShowVisitorModal(true);
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
            gender: (() => { const g = (visitor.gender || '').toLowerCase(); if (g === 'male') return 'M'; if (g === 'female') return 'F'; if (g === 'other' || g === 'm' || g === 'f' || g === 'o') return (visitor.gender || '').toUpperCase().slice(0, 1); return visitor.gender || ''; })(),
            email: visitor.email || '',
            allergies: visitor.allergies || 'N/A',
            drugReactions: visitor.drugReactions || 'N/A',
            ongoingHealthConditions: visitor.ongoingHealthConditions || 'N/A',
            specialNotes: visitor.specialNotes || '',
            highBloodPressure: visitor.highBloodPressure || '',
            heartDisease: visitor.heartDisease || '',
            diabetes: visitor.diabetes || '',
            cholesterol: visitor.cholesterol || '',
            smoke: visitor.smoke || '',
            phoneH: visitor.phoneH || '',
            phoneM: visitor.phoneM || '',
            notes: visitor.notes || '',
            memo: visitor.memo || '',
            guardianName: visitor.guardianName || '',
            guardianId: visitor.guardianId || '',
            guardianPhone: visitor.guardianPhone || ''
        });
        // Backward compat: old data may have phone (B or M) but no phoneB
        const mobile = visitor.phoneM || visitor.phone || '';
        const business = visitor.phoneB || (visitor.phone && visitor.phone !== mobile ? visitor.phone : '');
        setPhoneData({ fullNumber: business, valid: !!business });
        setPhoneHData({ fullNumber: visitor.phoneH || '', valid: !!visitor.phoneH });
        setPhoneMData({ fullNumber: mobile, valid: !!mobile });
        setGuardianPhoneData({ fullNumber: visitor.guardianPhone || '', valid: !!visitor.guardianPhone });
        setHealthCardNumber(formatHealthCardDisplay(visitor.healthCardNumber || ''));
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
            <div class="text-xs text-slate-600 mt-1">ID: ${getVisitorSerialDisplay(patient)}</div>
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

    const handleRegisterPatient = async (patient, options = {}) => {
        if (!patient) return false;

        const { reasonForVisit = '', parentInteractionId = '', reasonForVisitNotes = '' } = options;

        // Check if patient already has an active (incomplete) registration
        const isAlreadyRegistered = interactions.some(i => i.visitorId === patient.id && !i.completed);
        if (isAlreadyRegistered) {
            showWarning(`${patient.firstName} ${patient.lastName} is already registered and hasn't completed their visit.`);
            return false;
        }

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
            _visitor: patient
        };

        setPendingInteractions(prev => [...prev, optimisticInteraction]);
        setIsCreatingInteraction(true);

        try {
            const visitorSerial = patient.serial;
            const response = await interactionService.create({
                entityId: userData.entityId,
                entitySerial: userData.entitySerial,
                visitorId: patient.id,
                visitorSerial: visitorSerial,
                reasonForVisit: reasonForVisit || '',
                reasonForVisitNotes: (reasonForVisitNotes != null && String(reasonForVisitNotes).trim()) ? String(reasonForVisitNotes).trim() : ''
            });

            if (reasonForVisit === 'followup' && parentInteractionId) {
                const parentInteraction = interactions.find(i => i.id === parentInteractionId);
                if (parentInteraction) {
                    const existingFr = parentInteraction.followupRequired || parentInteraction.followup;
                    await interactionService.saveDetails(parentInteractionId, {
                        followupRequired: {
                            required: existingFr?.required ?? true,
                            date: existingFr?.date || '',
                            followupInteractionId: response.id
                        }
                    });
                    await interactionService.saveDetails(response.id, {
                        followup: { isFollowup: true, parentInteractionId },
                        started: false,
                        ongoing: false,
                        incomplete: false
                    });
                }
            }

            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));
            await loadInteractions(userData.entityId, interactionFilter);
            return true;
        } catch (err) {
            console.error('Failed to create interaction:', err);
            setPendingInteractions(prev => prev.filter(i => i.id !== tempId));
            showWarning('Failed to create registration: ' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setIsCreatingInteraction(false);
        }
    };

    const handleDeleteRegistration = async () => {
        if (!registrationToDelete) return;

        setIsDeletingRegistration(true);
        try {
            await interactionService.delete(registrationToDelete.id);

            // If this was a followup interaction, clear the parent's followupInteractionId so it becomes re-followup-able
            const parentInteraction = interactions.find(i =>
                i.followupRequired?.followupInteractionId === registrationToDelete.id ||
                i.followupInteractionId === registrationToDelete.id
            );
            if (parentInteraction) {
                const fr = parentInteraction.followupRequired || parentInteraction.followup || {};
                await interactionService.saveDetails(parentInteraction.id, {
                    followupRequired: {
                        required: fr.required ?? false,
                        date: fr.date || '',
                        followupInteractionId: ''
                    }
                });
            }

            await loadInteractions(userData.entityId, interactionFilter);
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

    const handleRequestDeleteRegistration = (interaction) => {
        if (interaction) {
            setRegistrationToDelete(interaction);
            setShowDeleteRegistrationModal(true);
        }
    };

    const handleInteractionClick = async (interaction) => {
        if (!interaction) return;
        setSelectedInteraction(interaction);
        setShowInteractionDetailModal(true);

        // Fetch reports for the patient associated with this interaction
        if (interaction.visitorId) {
            setIsLoadingReports(true);
            try {
                const reports = await reportService.getByPatient(interaction.visitorId);
                setPatientReports(reports || []);
            } catch (error) {
                console.error('Error fetching reports for interaction click:', error);
                setPatientReports([]);
            } finally {
                setIsLoadingReports(false);
            }
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
            return imagePath;
        }
        // Supabase paths are handled by components that fetch URLs async
        if (imagePath.includes('/interactions/')) {
            return null; // Components will fetch Supabase URL
        }
        // Local file path
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${API_URL.replace('/api', '')}/${imagePath}`;
    };

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('entityName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('entityId');
        localStorage.removeItem('entitySerial');
        navigate('/user/login');
    };

    return (
        <div className="flex h-[calc(100vh-64px)] relative overflow-x-hidden">
            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50">
                <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-8">
                    <MasterDataProvider>
                    {activeTab === 'reception' && (
                        <ReceptionTab
                            interactionFilter={interactionFilter}
                            setInteractionFilter={setInteractionFilter}
                            visitors={visitors}
                            isLoadingVisitors={isLoadingVisitors}
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
                            searchDob={searchDob}
                            setSearchDob={setSearchDob}
                            showVisitorModal={showVisitorModal}
                            setShowVisitorModal={setShowVisitorModal}
                            onOpenAddModal={handleOpenAddModal}
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
                            onEditVisitor={handleEditVisitor}
                            handlePatientClick={handlePatientClick}
                            selectedPatient={selectedPatient}
                            showPatientDetailModal={showPatientDetailModal}
                            setShowPatientDetailModal={setShowPatientDetailModal}
                            handlePatientDragStart={handlePatientDragStart}
                            handlePatientDrop={handlePatientDrop}
                            warningMessage={warningMessage}
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
                            onOpenQueueModal={setQueueModalInteraction}
                            handleRegistrationDropOnBin={handleRegistrationDropOnBin}
                            onRequestDelete={handleRequestDeleteRegistration}
                            showDeleteRegistrationModal={showDeleteRegistrationModal}
                            setShowDeleteRegistrationModal={setShowDeleteRegistrationModal}
                            registrationToDelete={registrationToDelete}
                            handleDeleteRegistration={handleDeleteRegistration}
                            getVisitorName={getVisitorName}
                            getVisitorSerial={getVisitorSerial}
                            getVisitorHealthCard={getVisitorHealthCard}
                            getOfficerName={getOfficerName}
                            onInteractionClick={handleInteractionClick}

                            getImageUrl={getImageUrl}
                            setViewingMedia={setViewingMedia}
                            formatDate={formatDate}

                            isDeletingRegistration={isDeletingRegistration}
                            isCreatingInteraction={isCreatingInteraction}
                            isAssigningInteraction={isAssigningInteraction}
                            pendingInteractions={pendingInteractions}
                            pendingAssignments={pendingAssignments}
                            assignmentFailed={assignmentFailed}
                            handleDragEnd={handleDragEnd}
                            draggedInteraction={draggedInteraction}
                            handleRegisterPatient={handleRegisterPatient}
                            nextVisitorSerial={nextVisitorSerial}
                            handleRegisterFollowup={handleRegisterFollowup}
                            registeringFollowupForId={registeringFollowupForId}
                        />
                    )}

                    {activeTab === 'officer' && (
                        <OfficerTab
                            userData={userData}
                            interactions={interactions}
                            lastVisits={lastVisits}
                            visitors={visitors}
                            isLoadingInteractions={isLoadingInteractions}
                            onRefreshInteractions={() => loadInteractions(userData.entityId, interactionFilter)}
                            onInteractionClick={handleInteractionClick}
                        />
                    )}
                    </MasterDataProvider>
                </div>
            </main>

            {/* Interaction Detail Modal */}
            {showInteractionDetailModal && (
                <InteractionDetailsModal
                    interaction={selectedInteraction}
                    onClose={() => setShowInteractionDetailModal(false)}
                    getVisitorName={getVisitorName}
                    getVisitorSerial={getVisitorSerial}
                    formatDate={formatDate}
                    getImageUrl={getImageUrl}
                    setViewingMedia={setViewingMedia}
                    patientReports={patientReports}
                    officers={officers}
                    onOpenQueueModal={setQueueModalInteraction}
                />
            )}

            {/* Queue registration modal (from cards or from interaction detail) */}
            {queueModalInteraction && (
                <QueueRegistrationModal
                    isOpen={!!queueModalInteraction}
                    onClose={() => setQueueModalInteraction(null)}
                    interaction={queueModalInteraction}
                    officers={officers}
                    getVisitorName={getVisitorName}
                    onAssign={handleAssignToOfficer}
                />
            )}

            {/* Media Viewer Modal */}
            <MediaViewerModal
                viewingMedia={viewingMedia}
                setViewingMedia={setViewingMedia}
            />

            {warningMessage && (
                <div className="fixed top-20 right-4 bg-red-800/95 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] animate-[slideUp_0.3s_ease-out] border border-red-400/50 backdrop-blur-md flex items-center gap-4 transition-all">
                    <div className="bg-white/20 p-2 rounded-lg shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-xs font-semibold normal-case tracking-wide opacity-60 mb-0.5">System Alert</div>
                        <span className="font-semibold text-sm tracking-tight">{warningMessage}</span>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[2000]" onClick={() => setShowLogoutModal(false)}>
                    <div className="bg-white w-full max-w-[400px] p-6 sm:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Logout</h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Are you sure you want to log out of the interaction system?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;

