import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import LabRequisitionForm from '../components/LabRequisitionForm';
import LabRequisitionActionModal from '../components/LabRequisitionActionModal';
import api from '../services/api';

export default function LabRequisitionPage() {
  const { interactionId } = useParams();
  const [prefill, setPrefill] = useState(null);
  const [draft, setDraft] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [patientMeta, setPatientMeta] = useState({ entityId: '', patientId: '', patientEmail: '' });
  const [doctorMeta, setDoctorMeta] = useState({ doctorId: '', doctorName: '' });

  const toDateInputValue = (raw) => {
    if (!raw) return '';
    const s = String(raw).trim();
    // Already in yyyy-mm-dd (HTML date input format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // Handle mm-dd-yyyy or mm/dd/yyyy
    const mdy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (mdy) {
      const mm = String(mdy[1]).padStart(2, '0');
      const dd = String(mdy[2]).padStart(2, '0');
      const yyyy = mdy[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    // Try parsing ISO-ish strings
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const decoded = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!interactionId) return;
      try {
        const interactionRes = await api.get(`/interactions/${interactionId}`);
        const interaction = interactionRes?.data;
        const entityId = interaction?.entityId || decoded?.entityId || '';

        const [visitorsRes, meRes] = await Promise.all([
          entityId ? api.get(`/visitors/entity/${entityId}`) : Promise.resolve({ data: [] }),
          api.get('/officers/me').catch(() => ({ data: null })),
        ]);

        const visitors = Array.isArray(visitorsRes?.data) ? visitorsRes.data : [];
        const visitor = visitors.find((v) => v?.id === interaction?.visitorId) || null;
        const me = meRes?.data || null;

        const patientFirstName = visitor
          ? [visitor.firstName, visitor.middleName].filter(Boolean).join(' ').trim()
          : '';
        const patientLastName = visitor?.lastName || '';
        const patientDob = toDateInputValue(visitor?.dateOfBirth || '');
        const patientHealthCard = visitor?.healthCardNumber || '';
        const patientPhone = visitor?.phoneM || visitor?.phone || '';
        const patientAddress = visitor
          ? [visitor.addressLine, visitor.city, visitor.province || visitor.state, visitor.postalCode]
              .filter(Boolean)
              .join(', ')
          : '';

        const clinicianName = me?.name || decoded?.name || '';
        const clinicName = localStorage.getItem('entityName') || '';
        const clinicianPhone = me?.phone || me?.phoneM || me?.phoneH || '';
        const clinicianFax = me?.fax || '';
        const doctorId = me?.id || decoded?.id || '';

        const nextPrefill = {
          clinicianName,
          clinicName,
          clinicianPhone,
          clinicianFax,
          patientLastName,
          patientFirstName,
          patientDob,
          patientHealthCard,
          patientPhone,
          patientAddress,
        };

        if (!cancelled) {
          setPrefill(nextPrefill);
          setDraft((prev) => prev || nextPrefill);
          setPatientMeta({
            entityId: entityId || '',
            patientId: visitor?.id || interaction?.visitorId || '',
            patientEmail: visitor?.email || '',
          });
          setDoctorMeta({
            doctorId,
            doctorName: clinicianName,
          });
        }
      } catch {
        if (!cancelled) setPrefill(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [interactionId, decoded?.entityId, decoded?.name]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-100 flex flex-col items-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-5xl mb-4">
        <p className="text-xs text-slate-500">
          Interaction ID:&nbsp;
          <span className="font-mono text-slate-700">{interactionId}</span>
        </p>
      </div>
      <LabRequisitionForm
        prefill={prefill}
        onDraftChange={(p) => setDraft(p)}
        onGenerate={(p) => {
          setDraft(p);
          setActionOpen(true);
        }}
      />

      <LabRequisitionActionModal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        visitor={{
          entityId: patientMeta.entityId,
          id: patientMeta.patientId,
          email: patientMeta.patientEmail,
          doctorId: doctorMeta.doctorId,
        }}
        interactionId={interactionId}
        doctorName={doctorMeta.doctorName}
        patientName={[draft?.patientFirstName, draft?.patientLastName].filter(Boolean).join(' ').trim()}
        formPayload={draft}
      />
    </div>
  );
}

