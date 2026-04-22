import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function GeneralServicesClaimFormPage() {
  const { interactionId } = useParams();
  const [data, setData] = useState({ clinicianName: '', clinicName: '', patientName: '', patientDob: '' });

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

        const clinicianName = me?.name || decoded?.name || '';
        const clinicName = localStorage.getItem('entityName') || '';
        const patientName = visitor ? [visitor.firstName, visitor.middleName, visitor.lastName].filter(Boolean).join(' ') : '';
        const patientDob = visitor?.dateOfBirth || '';

        if (!cancelled) setData({ clinicianName, clinicName, patientName, patientDob });
      } catch {
        if (!cancelled) setData({ clinicianName: decoded?.name || '', clinicName: localStorage.getItem('entityName') || '', patientName: '', patientDob: '' });
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

      <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">General services claim form</h1>
          <p className="text-xs text-slate-500">Form contents will be finalized later.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">Clinician</div>
            <div className="text-sm font-semibold text-slate-900">{data.clinicianName || '—'}</div>
            <div className="text-xs text-slate-500 mt-1">{data.clinicName || '—'}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">Patient</div>
            <div className="text-sm font-semibold text-slate-900">{data.patientName || '—'}</div>
            <div className="text-xs text-slate-500 mt-1">DOB: {data.patientDob || '—'}</div>
          </div>
        </div>

        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-6 text-sm text-slate-500">
          Placeholder: claim fields (to be provided).
        </div>
      </div>
    </div>
  );
}

