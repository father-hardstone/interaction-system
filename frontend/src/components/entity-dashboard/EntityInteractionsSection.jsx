import { useState, useEffect } from 'react';
import { interactionService } from '../../services/interactionService';
import { visitorService } from '../../services/visitorService';
import { officerService } from '../../services/officerService';
import { getInteractionStatus, getInteractionSerialDisplay, getVisitorSerialDisplay } from '../../utils/formatUtils';
import { formatDateMMDDYYYY } from '../../utils/formatUtils';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'registered', label: 'Registered' },
  { value: 'queued', label: 'Queued' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'complete', label: 'Complete' },
  { value: 'closed', label: 'Closed' },
  { value: 'billed', label: 'Billed' },
  { value: 'cancelled', label: 'Cancelled' },
];

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

export default function EntityInteractionsSection({ entityId }) {
  const [interactions, setInteractions] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!entityId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [data, visitorsData, officersData] = await Promise.all([
          interactionService.getByEntity(entityId, 'all'),
          visitorService.getByEntity(entityId),
          officerService.getByEntity(entityId),
        ]);
        const list = data?.interactions || [];
        setInteractions(Array.isArray(list) ? list : []);
        setVisitors(Array.isArray(visitorsData) ? visitorsData : []);
        setOfficers(Array.isArray(officersData) ? officersData : []);
      } catch (e) {
        console.error('Failed to load interactions:', e);
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

  const filtered = statusFilter
    ? interactions.filter((i) => getInteractionStatus(i) === statusFilter)
    : interactions;

  const sorted = [...filtered].sort(
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

  const formatDate = (d) => (d ? formatDateMMDDYYYY(d) : '—');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Interactions</h2>
          <p className="text-sm text-slate-500 mt-1">All visits and registrations for your entity</p>
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">
            {filtered.length} of {interactions.length} interactions
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Patient</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Date</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Officer</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-600">Loading interactions...</span>
                    </div>
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                    No interactions found.
                  </td>
                </tr>
              ) : (
                sorted.map((i) => {
                  const status = getInteractionStatus(i);
                  const statusClass = STATUS_CLASSES[status] || 'bg-slate-100 text-slate-600';
                  return (
                    <tr key={i.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-sm">
                        {getInteractionSerialDisplay(i.interactionSerial) || '—'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm">
                        <div className="font-medium text-slate-900">{getVisitorName(i)}</div>
                        <div className="text-xs text-slate-500">{getVisitorSerial(i)}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600">
                        {formatDate(i.createdAt)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                        {getOfficerName(i)}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${statusClass}`}>
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
    </div>
  );
}
