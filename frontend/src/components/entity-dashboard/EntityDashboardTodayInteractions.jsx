import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { interactionService } from '../../services/interactionService';
import { visitorService } from '../../services/visitorService';
import { officerService } from '../../services/officerService';
import { getInteractionStatus, getInteractionSerialDisplay, getVisitorSerialDisplay } from '../../utils/formatUtils';

const STATUS_CLASSES = {
  registered: 'bg-slate-100 text-slate-700',
  queued: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-indigo-100 text-indigo-700',
  incomplete: 'bg-amber-100 text-amber-700',
  complete: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  billed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function EntityDashboardTodayInteractions({ entityId }) {
  const { serial } = useParams();
  const [interactions, setInteractions] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [data, visitorsData, officersData] = await Promise.all([
          interactionService.getByEntity(entityId, 'today'),
          visitorService.getByEntity(entityId),
          officerService.getByEntity(entityId),
        ]);
        const list = data?.interactions || [];
        setInteractions(Array.isArray(list) ? list : []);
        setVisitors(Array.isArray(visitorsData) ? visitorsData : []);
        setOfficers(Array.isArray(officersData) ? officersData : []);
      } catch (e) {
        console.error('Failed to load today\'s interactions:', e);
        setInteractions([]);
        setVisitors([]);
        setOfficers([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [entityId]);

  const visitorMap = Object.fromEntries((visitors || []).map((v) => [v.id, v]));
  const officerMap = Object.fromEntries((officers || []).map((o) => [o.id, o]));

  const sorted = [...interactions].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  const getVisitorName = (i) => {
    const v = visitorMap[i.visitorId];
    if (!v) return '—';
    return `${v.firstName || ''} ${v.middleName ? v.middleName + ' ' : ''}${v.lastName || ''}`.trim() || '—';
  };

  const getVisitorSerial = (i) => {
    const v = visitorMap[i.visitorId];
    return v ? getVisitorSerialDisplay(v) : '—';
  };

  const getOfficerName = (i) => {
    const o = officerMap[i.officerId];
    return o?.name || i.officerSerial || '—';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">Today&apos;s Interactions</h2>
        <Link
          to={serial ? `/entity/${serial}/dashboard?section=interactions` : '#'}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          See All →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden md:table-cell">Officer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm text-slate-500">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-sm">
                  No interactions today.
                </td>
              </tr>
            ) : (
              sorted.map((i) => {
                const status = getInteractionStatus(i);
                const statusClass = STATUS_CLASSES[status] || 'bg-slate-100 text-slate-600';
                return (
                  <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900 text-sm">
                      {getInteractionSerialDisplay(i.interactionSerial) || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-slate-900">{getVisitorName(i)}</div>
                      <div className="text-xs text-slate-500">{getVisitorSerial(i)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                      {getOfficerName(i)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusClass}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
