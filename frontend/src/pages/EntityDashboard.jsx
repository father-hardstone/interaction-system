import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { officerService } from '../services/officerService';
import { receptionistService } from '../services/receptionistService';
import { accountantService } from '../services/accountantService';
import { interactionService } from '../services/interactionService';
import { visitorService } from '../services/visitorService';
import { validateEmail } from '../utils/crypto';
import {
  EntityDashboardContent,
  AddOfficerModal,
  AddReceptionistModal,
  AddAccountantModal,
} from '../components/entity-dashboard';

const EntityDashboard = () => {
  const { serial } = useParams();
  const [searchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'dashboard';
  const [entityData, setEntityData] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [accountants, setAccountants] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [patientCount, setPatientCount] = useState(null);
  const [patientCountLoading, setPatientCountLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState(null);
  const [statusCountsLoading, setStatusCountsLoading] = useState(false);
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [period, setPeriod] = useState('week'); // 'week' | 'month' | 'year'
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showReceptionistModal, setShowReceptionistModal] = useState(false);
  const [showAccountantModal, setShowAccountantModal] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '' });
  const [newReceptionist, setNewReceptionist] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [newAccountant, setNewAccountant] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
  const [receptionPhoneData, setReceptionPhoneData] = useState({
    fullNumber: '',
    valid: false,
  });
  const [accountantPhoneData, setAccountantPhoneData] = useState({
    fullNumber: '',
    valid: false,
  });
  const [error, setError] = useState('');
  const [receptionError, setReceptionError] = useState('');
  const [accountantError, setAccountantError] = useState('');
  const [officerSubmitting, setOfficerSubmitting] = useState(false);
  const [receptionistSubmitting, setReceptionistSubmitting] = useState(false);
  const [accountantSubmitting, setAccountantSubmitting] = useState(false);

  const getDaysForPeriod = () => {
    if (period === 'month') return 30;
    if (period === 'year') return 365;
    return 7;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setEntityData(decoded);
        if (decoded.id) {
          loadOfficers(decoded.id);
          loadReceptionists(decoded.id);
          loadAccountants(decoded.id);
        }
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!entityData?.id) return;
    const days = getDaysForPeriod();
    loadDailyStats(entityData.id, days);
    loadPatientCount(entityData.id);
    loadStatusCounts(entityData.id, days);
    loadRevenue(entityData.id, days);
  }, [entityData?.id, period]);

  const loadOfficers = async (entityId) => {
    try {
      const data = await officerService.getByEntity(entityId);
      setOfficers(data || []);
    } catch (e) {
      console.error('Failed to load officers:', e);
      setOfficers([]);
    }
  };

  const loadReceptionists = async (entityId) => {
    try {
      const data = await receptionistService.getByEntity(entityId);
      setReceptionists(data || []);
    } catch (e) {
      console.error('Failed to load receptionists:', e);
      setReceptionists([]);
    }
  };

  const loadAccountants = async (entityId) => {
    try {
      const data = await accountantService.getByEntity(entityId);
      setAccountants(data || []);
    } catch (e) {
      console.error('Failed to load accountants:', e);
      setAccountants([]);
    }
  };

  const loadDailyStats = async (entityId, days = 7) => {
    setChartLoading(true);
    try {
      const data = await interactionService.getDailyStats(entityId, days);
      setChartData(data || []);
    } catch (e) {
      console.error('Failed to load daily stats for chart:', e);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const loadPatientCount = async (entityId) => {
    setPatientCountLoading(true);
    try {
      const count = await visitorService.getCount(entityId);
      setPatientCount(count);
    } catch (e) {
      console.error('Failed to load patient count:', e);
      setPatientCount(null);
    } finally {
      setPatientCountLoading(false);
    }
  };

  const loadStatusCounts = async (entityId, days = null) => {
    setStatusCountsLoading(true);
    try {
      const data = await interactionService.getStatusCounts(entityId, days);
      setStatusCounts(data);
    } catch (e) {
      console.error('Failed to load status counts:', e);
      setStatusCounts(null);
    } finally {
      setStatusCountsLoading(false);
    }
  };

  const loadRevenue = async (entityId, days = 7) => {
    setRevenueLoading(true);
    try {
      const amount = await interactionService.getRevenue(entityId, days);
      setRevenue(amount);
    } catch (e) {
      console.error('Failed to load revenue:', e);
      setRevenue(null);
    } finally {
      setRevenueLoading(false);
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    if (officerSubmitting) return;
    setError('');
    if (!newOfficer.name || !newOfficer.email || !newOfficer.password) {
      setError('Please fill in all fields');
      return;
    }
    if (!phoneData.valid) {
      setError('Please enter a valid phone number');
      return;
    }
    const emailValidation = validateEmail(newOfficer.email);
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return;
    }
    try {
      setOfficerSubmitting(true);
      await officerService.create({
        entityId: entityData.id,
        entitySerial: entityData.serial,
        name: newOfficer.name,
        phone: phoneData.fullNumber,
        email: newOfficer.email,
        password: newOfficer.password,
      });
      setNewOfficer({ name: '', email: '', password: '' });
      setPhoneData({ fullNumber: '', valid: false });
      setShowOfficerModal(false);
      setError('');
      await loadOfficers(entityData.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create officer');
    } finally {
      setOfficerSubmitting(false);
    }
  };

  const handleCreateReceptionist = async (e) => {
    e.preventDefault();
    if (receptionistSubmitting) return;
    setReceptionError('');
    if (!newReceptionist.name || !newReceptionist.email || !newReceptionist.password) {
      setReceptionError('Please fill in all fields');
      return;
    }
    if (!receptionPhoneData.valid) {
      setReceptionError('Please enter a valid phone number');
      return;
    }
    const emailValidation = validateEmail(newReceptionist.email);
    if (!emailValidation.valid) {
      setReceptionError(emailValidation.error);
      return;
    }
    try {
      setReceptionistSubmitting(true);
      await receptionistService.create({
        entityId: entityData.id,
        entitySerial: entityData.serial,
        name: newReceptionist.name,
        phone: receptionPhoneData.fullNumber,
        email: newReceptionist.email,
        password: newReceptionist.password,
      });
      setNewReceptionist({ name: '', email: '', password: '' });
      setReceptionPhoneData({ fullNumber: '', valid: false });
      setShowReceptionistModal(false);
      setReceptionError('');
      await loadReceptionists(entityData.id);
    } catch (err) {
      setReceptionError(err.response?.data?.error || 'Failed to create receptionist');
    } finally {
      setReceptionistSubmitting(false);
    }
  };

  const handleCloseOfficerModal = () => {
    if (officerSubmitting) return;
    setShowOfficerModal(false);
    setNewOfficer({ name: '', email: '', password: '' });
    setPhoneData({ fullNumber: '', valid: false });
    setError('');
  };

  const handleCloseReceptionistModal = () => {
    if (receptionistSubmitting) return;
    setShowReceptionistModal(false);
    setNewReceptionist({ name: '', email: '', password: '' });
    setReceptionPhoneData({ fullNumber: '', valid: false });
    setReceptionError('');
  };

  const handleCreateAccountant = async (e) => {
    e.preventDefault();
    if (accountantSubmitting) return;
    setAccountantError('');
    if (!newAccountant.name || !newAccountant.email || !newAccountant.password) {
      setAccountantError('Please fill in all fields');
      return;
    }
    if (!accountantPhoneData.valid) {
      setAccountantError('Please enter a valid phone number');
      return;
    }
    const emailValidation = validateEmail(newAccountant.email);
    if (!emailValidation.valid) {
      setAccountantError(emailValidation.error);
      return;
    }
    try {
      setAccountantSubmitting(true);
      await accountantService.create({
        entityId: entityData.id,
        entitySerial: entityData.serial,
        name: newAccountant.name,
        phone: accountantPhoneData.fullNumber,
        email: newAccountant.email,
        password: newAccountant.password,
      });
      setNewAccountant({ name: '', email: '', password: '' });
      setAccountantPhoneData({ fullNumber: '', valid: false });
      setShowAccountantModal(false);
      setAccountantError('');
      await loadAccountants(entityData.id);
    } catch (err) {
      setAccountantError(err.response?.data?.error || 'Failed to create accountant');
    } finally {
      setAccountantSubmitting(false);
    }
  };

  const handleCloseAccountantModal = () => {
    if (accountantSubmitting) return;
    setShowAccountantModal(false);
    setNewAccountant({ name: '', email: '', password: '' });
    setAccountantPhoneData({ fullNumber: '', valid: false });
    setAccountantError('');
  };

  const handleDeleteOfficer = async (officerId) => {
    try {
      await officerService.delete(officerId);
      if (entityData?.id) await loadOfficers(entityData.id);
    } catch (e) {
      alert('Failed to delete officer');
    }
  };

  const handleDeleteReceptionist = async (receptionistId) => {
    try {
      await receptionistService.delete(receptionistId);
      if (entityData?.id) await loadReceptionists(entityData.id);
    } catch (e) {
      alert('Failed to delete receptionist');
    }
  };

  const handleDeleteAccountant = async (accountantId) => {
    try {
      await accountantService.delete(accountantId);
      if (entityData?.id) await loadAccountants(entityData.id);
    } catch (e) {
      alert('Failed to delete accountant');
    }
  };

  /** Export dashboard chart data (daily registered/completed) as CSV. */
  const handleExportCsv = () => {
    const rows = Array.isArray(chartData) ? chartData : [];
    const header = 'Date,Registered,Completed';
    const lines = [header, ...rows.map((r) => `${r.date},${r.registered ?? 0},${r.completed ?? 0}`)];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-stats-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const entityName = entityData?.name || 'Clinic';

  return (
    <>
      <EntityDashboardContent
        activeSection={activeSection}
        entityId={entityData?.id}
        entitySerial={entityData?.serial}
        entityName={entityName}
        officers={officers}
        receptionists={receptionists}
        accountants={accountants}
        chartData={chartData}
        chartLoading={chartLoading}
        patientCount={patientCount}
        patientCountLoading={patientCountLoading}
        statusCounts={statusCounts}
        statusCountsLoading={statusCountsLoading}
        revenue={revenue}
        revenueLoading={revenueLoading}
        period={period}
        onPeriodChange={setPeriod}
        onExportCsv={handleExportCsv}
        onAddOfficer={() => setShowOfficerModal(true)}
        onAddReceptionist={() => setShowReceptionistModal(true)}
        onAddAccountant={() => setShowAccountantModal(true)}
        onDeleteOfficer={handleDeleteOfficer}
        onDeleteReceptionist={handleDeleteReceptionist}
        onDeleteAccountant={handleDeleteAccountant}
      />

      <AddOfficerModal
        open={showOfficerModal}
        onClose={handleCloseOfficerModal}
        error={error}
        newOfficer={newOfficer}
        setNewOfficer={setNewOfficer}
        phoneData={phoneData}
        setPhoneData={setPhoneData}
        onSubmit={handleCreateOfficer}
        isSubmitting={officerSubmitting}
      />

      <AddReceptionistModal
        open={showReceptionistModal}
        onClose={handleCloseReceptionistModal}
        error={receptionError}
        newReceptionist={newReceptionist}
        setNewReceptionist={setNewReceptionist}
        receptionPhoneData={receptionPhoneData}
        setReceptionPhoneData={setReceptionPhoneData}
        onSubmit={handleCreateReceptionist}
        isSubmitting={receptionistSubmitting}
      />

      <AddAccountantModal
        open={showAccountantModal}
        onClose={handleCloseAccountantModal}
        error={accountantError}
        newAccountant={newAccountant}
        setNewAccountant={setNewAccountant}
        accountantPhoneData={accountantPhoneData}
        setAccountantPhoneData={setAccountantPhoneData}
        onSubmit={handleCreateAccountant}
        isSubmitting={accountantSubmitting}
      />
    </>
  );
};

export default EntityDashboard;
