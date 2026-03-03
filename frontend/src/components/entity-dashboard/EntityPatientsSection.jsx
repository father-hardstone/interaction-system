import { useState, useEffect } from 'react';
import { visitorService } from '../../services/visitorService';
import { validateEmail } from '../../utils/crypto';
import {
  parsePhoneToDigits,
  parseHealthCardToDigits,
  formatHealthCardDisplay,
  formatDateMMDDYYYY,
  getVisitorSerialDisplay,
} from '../../utils/formatUtils';
import VisitorsSection from '../VisitorsSection';
import { MasterDataProvider } from '../../contexts/MasterDataContext';

const EMPTY_VISITOR_FORM = {
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
  emergencyPhone: '',
};

export default function EntityPatientsSection({ entityId, entitySerial, entityName }) {
  const [visitors, setVisitors] = useState([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(true);
  const [searchFirstName, setSearchFirstName] = useState('');
  const [searchMiddleName, setSearchMiddleName] = useState('');
  const [searchLastName, setSearchLastName] = useState('');
  const [searchSerial, setSearchSerial] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [searchHealthCard, setSearchHealthCard] = useState('');
  const [searchDob, setSearchDob] = useState('');
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [editingVisitorId, setEditingVisitorId] = useState(null);
  const [visitorForm, setVisitorForm] = useState(EMPTY_VISITOR_FORM);
  const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
  const [phoneHData, setPhoneHData] = useState({ fullNumber: '', valid: false });
  const [phoneMData, setPhoneMData] = useState({ fullNumber: '', valid: false });
  const [guardianPhoneData, setGuardianPhoneData] = useState({ fullNumber: '', valid: false });
  const [healthCardNumber, setHealthCardNumber] = useState('');
  const [healthCardVersion, setHealthCardVersion] = useState('');
  const [healthCardEffectivityDate, setHealthCardEffectivityDate] = useState('');
  const [healthCardExpiryDate, setHealthCardExpiryDate] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isCreatingVisitor, setIsCreatingVisitor] = useState(false);
  const [deletingVisitorId, setDeletingVisitorId] = useState(null);
  const [nextVisitorSerial, setNextVisitorSerial] = useState('');

  useEffect(() => {
    if (!entityId) return;
    const load = async () => {
      setIsLoadingVisitors(true);
      try {
        const data = await visitorService.getByEntity(entityId);
        setVisitors(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load visitors:', e);
        setVisitors([]);
      } finally {
        setIsLoadingVisitors(false);
      }
    };
    load();
  }, [entityId]);

  useEffect(() => {
    if (!entityId || !showVisitorModal) return;
    visitorService.getNextSerial(entityId).then((s) => setNextVisitorSerial(s || '')).catch(() => {});
  }, [entityId, showVisitorModal]);

  const resetForm = () => {
    setVisitorForm(EMPTY_VISITOR_FORM);
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
  };

  const handleOpenAddModal = () => {
    setEditingVisitorId(null);
    resetForm();
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
      gender: (() => {
        const g = (visitor.gender || '').toLowerCase();
        if (g === 'male') return 'M';
        if (g === 'female') return 'F';
        return (visitor.gender || '').toUpperCase().slice(0, 1) || '';
      })(),
      email: visitor.email || '',
      allergies: visitor.allergies && String(visitor.allergies).trim().toUpperCase() !== 'N/A' ? visitor.allergies : '',
      drugReactions: visitor.drugReactions && String(visitor.drugReactions).trim().toUpperCase() !== 'N/A' ? visitor.drugReactions : '',
      ongoingHealthConditions: visitor.ongoingHealthConditions && String(visitor.ongoingHealthConditions).trim().toUpperCase() !== 'N/A' ? visitor.ongoingHealthConditions : '',
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
      emergencyName: visitor.emergencyName || visitor.guardianName || '',
      emergencyRelation: visitor.emergencyRelation || '',
      emergencyPhone: visitor.emergencyPhone || visitor.guardianPhone || '',
    });
    setPhoneData({ fullNumber: parsePhoneToDigits(visitor.phoneB || visitor.phone || ''), valid: !!(visitor.phoneB || visitor.phone) });
    setPhoneHData({ fullNumber: parsePhoneToDigits(visitor.phoneH || ''), valid: !!visitor.phoneH });
    setPhoneMData({ fullNumber: parsePhoneToDigits(visitor.phoneM || visitor.phone || ''), valid: !!(visitor.phoneM || visitor.phone) });
    setGuardianPhoneData({ fullNumber: parsePhoneToDigits(visitor.emergencyPhone || visitor.guardianPhone || ''), valid: !!(visitor.emergencyPhone || visitor.guardianPhone) });
    setHealthCardNumber(formatHealthCardDisplay(visitor.healthCardNumber || ''));
    setHealthCardVersion(visitor.healthCardVersion || '');
    setHealthCardEffectivityDate(visitor.healthCardEffectivityDate || '');
    setHealthCardExpiryDate(visitor.healthCardExpiryDate || '');
    setShowVisitorModal(true);
  };

  const handleDeleteVisitor = async (visitor) => {
    if (!window.confirm(`Delete patient ${visitor.firstName} ${visitor.lastName}? This cannot be undone.`)) return;
    setDeletingVisitorId(visitor.id);
    try {
      await visitorService.delete(visitor.id);
      setVisitors((prev) => prev.filter((v) => v.id !== visitor.id));
    } catch (e) {
      console.error('Failed to delete visitor:', e);
      alert('Failed to delete patient');
    } finally {
      setDeletingVisitorId(null);
    }
  };

  const handleHealthCardChange = (e) => {
    const raw = parseHealthCardToDigits(e.target.value);
    const masked = formatHealthCardDisplay(raw);
    setHealthCardNumber(masked);
    const digits = parseHealthCardToDigits(masked);
    if (!digits) setFieldErrors((prev) => ({ ...prev, healthCard: 'HC is required' }));
    else if (digits.length < 10) setFieldErrors((prev) => ({ ...prev, healthCard: 'Must be 10 digits' }));
    else setFieldErrors((prev) => { const n = { ...prev }; delete n.healthCard; return n; });
  };

  const handleHealthCardVersionChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    setHealthCardVersion(val);
    if (val && /^[A-Za-z]{1,2}$/.test(val)) setFieldErrors((prev) => { const n = { ...prev }; delete n.healthCardVersion; return n; });
  };

  const handleCreateVisitor = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsCreatingVisitor(true);

    const newErrors = {};
    if (!visitorForm.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!visitorForm.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!visitorForm.dateOfBirth) newErrors.dob = 'Date of birth is required';
    if (!visitorForm.addressLine?.trim()) newErrors.street = 'Street is required';
    if (!visitorForm.city?.trim()) newErrors.city = 'City is required';
    if (!visitorForm.state) newErrors.state = 'Province is required';
    if (!visitorForm.postalCode?.trim()) newErrors.postalCode = 'Postal code is required';
    else if (!/^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/.test(visitorForm.postalCode.trim())) newErrors.postalCode = 'Format A1B-2C3';
    if (!visitorForm.gender) newErrors.gender = 'Sex is required';
    if (!phoneMData.valid) newErrors.phoneM = 'Phone (M) is required';
    if (!healthCardNumber?.trim()) newErrors.healthCard = 'HC is required';
    else if (parseHealthCardToDigits(healthCardNumber).length !== 10) newErrors.healthCard = 'Must be 10 digits';
    if (!healthCardVersion?.trim()) newErrors.healthCardVersion = 'Version is required';
    else if (!/^[A-Za-z]{1,2}$/.test(healthCardVersion.trim())) newErrors.healthCardVersion = '1-2 letters';
    if (!healthCardEffectivityDate) newErrors.healthCardEffectivity = 'Issue date is required';
    if (!healthCardExpiryDate) newErrors.healthCardExpiry = 'Expiry date is required';
    if (healthCardEffectivityDate && healthCardExpiryDate && new Date(healthCardExpiryDate) < new Date(healthCardEffectivityDate)) {
      newErrors.healthCardDate = 'Expiry cannot be before issue date';
    }
    const pmhKeys = ['highBloodPressure', 'heartDisease', 'diabetes', 'cholesterol', 'smoke'];
    if (!pmhKeys.every((k) => visitorForm[k] === 'yes' || visitorForm[k] === 'no')) newErrors.pastMedicalHistory = 'Fill past medical history';

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setIsCreatingVisitor(false);
      return;
    }

    if (visitorForm.email?.trim()) {
      const ev = validateEmail(visitorForm.email);
      if (!ev.valid) {
        setError(ev.error);
        setIsCreatingVisitor(false);
        return;
      }
    }

    try {
      const payload = {
        entityId,
        entitySerial,
        firstName: visitorForm.firstName.trim(),
        middleName: visitorForm.middleName.trim(),
        lastName: visitorForm.lastName.trim(),
        dateOfBirth: visitorForm.dateOfBirth,
        addressLine: visitorForm.addressLine.trim(),
        city: visitorForm.city.trim(),
        province: visitorForm.state.trim(),
        postalCode: visitorForm.postalCode.trim(),
        gender: visitorForm.gender,
        phone: '',
        phoneM: phoneMData.fullNumber || '',
        phoneB: phoneData.fullNumber || '',
        phoneH: phoneHData.fullNumber || '',
        email: visitorForm.email.trim(),
        healthCardNumber: parseHealthCardToDigits(healthCardNumber),
        healthCardVersion: healthCardVersion.trim().toUpperCase(),
        healthCardEffectivityDate,
        healthCardExpiryDate,
        notes: visitorForm.notes,
        memo: visitorForm.memo,
        allergies: visitorForm.allergies?.trim() && visitorForm.allergies.toUpperCase() !== 'N/A' ? visitorForm.allergies : '',
        drugReactions: visitorForm.drugReactions?.trim() && visitorForm.drugReactions.toUpperCase() !== 'N/A' ? visitorForm.drugReactions : '',
        ongoingHealthConditions: visitorForm.ongoingHealthConditions?.trim() && visitorForm.ongoingHealthConditions.toUpperCase() !== 'N/A' ? visitorForm.ongoingHealthConditions : '',
        specialNotes: visitorForm.specialNotes?.trim() || '',
        highBloodPressure: visitorForm.highBloodPressure === 'yes' || visitorForm.highBloodPressure === 'no' ? visitorForm.highBloodPressure : '',
        heartDisease: visitorForm.heartDisease === 'yes' || visitorForm.heartDisease === 'no' ? visitorForm.heartDisease : '',
        diabetes: visitorForm.diabetes === 'yes' || visitorForm.diabetes === 'no' ? visitorForm.diabetes : '',
        cholesterol: visitorForm.cholesterol === 'yes' || visitorForm.cholesterol === 'no' ? visitorForm.cholesterol : '',
        smoke: visitorForm.smoke === 'yes' || visitorForm.smoke === 'no' ? visitorForm.smoke : '',
        emergencyName: visitorForm.emergencyName?.trim() || '',
        emergencyRelation: visitorForm.emergencyRelation?.trim() || '',
        emergencyPhone: guardianPhoneData.fullNumber || '',
      };

      if (editingVisitorId) {
        await visitorService.update(editingVisitorId, payload);
      } else {
        await visitorService.create(payload);
      }

      resetForm();
      setEditingVisitorId(null);
      setShowVisitorModal(false);
      const data = await visitorService.getByEntity(entityId);
      setVisitors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || (editingVisitorId ? 'Failed to update patient' : 'Failed to create patient'));
    } finally {
      setIsCreatingVisitor(false);
    }
  };

  const formatDate = (d) => (d ? formatDateMMDDYYYY(d) : '-');

  return (
    <MasterDataProvider>
      <VisitorsSection
        visitors={visitors}
        isLoadingVisitors={isLoadingVisitors}
        interactions={[]}
        allInteractionsForPatients={[]}
        lastVisits={{}}
        officers={[]}
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
        onEditVisitor={handleEditVisitor}
        handlePatientClick={() => {}}
        onInteractionClick={undefined}
        handlePatientDragStart={() => {}}
        handlePatientDrop={() => {}}
        isCreatingVisitor={isCreatingVisitor}
        deletingVisitorId={deletingVisitorId}
        editingVisitorId={editingVisitorId}
        setEditingVisitorId={setEditingVisitorId}
        getVisitorName={(v) => `${v.firstName || ''} ${v.lastName || ''}`.trim()}
        getVisitorSerial={getVisitorSerialDisplay}
        formatDate={formatDate}
        userData={{ entityId, entitySerial }}
        fieldErrors={fieldErrors}
        setFieldErrors={setFieldErrors}
        nextVisitorSerial={nextVisitorSerial}
        actionsMode="entity"
        onDeleteVisitor={handleDeleteVisitor}
      />
    </MasterDataProvider>
  );
}
