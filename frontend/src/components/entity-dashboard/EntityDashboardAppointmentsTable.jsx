import { IconCopy, IconFilter, IconPlus, IconMore } from './icons';

const STATIC_ROWS = [
  {
    name: 'Isa Isgenderov',
    id: '12345678',
    date: '23 Jan 2024, 10:00',
    type: 'Check-up',
    doctor: 'Dr. Smith',
    status: 'Changed',
    statusColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Murad Mamedli',
    id: '87654321',
    date: '23 Jan 2024, 10:30',
    type: 'Follow-up',
    doctor: 'Dr. Jones',
    status: 'Confirmed',
    statusColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Diana Huseynova',
    id: '11223344',
    date: '23 Jan 2024, 11:00',
    type: 'Consultation',
    doctor: 'Dr. Smith',
    status: 'Confirmed',
    statusColor: 'bg-blue-100 text-blue-700',
  },
  {
    name: 'Alekber Rzayev',
    id: '44332211',
    date: '23 Jan 2024, 11:30',
    type: 'Surgery',
    doctor: 'Dr. Lee',
    status: 'Canceled',
    statusColor: 'bg-red-100 text-red-700',
  },
  {
    name: 'Said Qasimov',
    id: '55667788',
    date: '23 Jan 2024, 12:00',
    type: 'Check-up',
    doctor: 'Dr. Jones',
    status: 'Confirmed',
    statusColor: 'bg-blue-100 text-blue-700',
  },
];

export default function EntityDashboardAppointmentsTable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">Today&apos;s Appointments</h2>
        <a href="#all" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          See All →
        </a>
      </div>
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 flex-1 min-w-[120px]"
        />
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
        >
          <IconFilter />
          Filter
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
        >
          <IconPlus />
          New Appointment
        </button>
        <select className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm focus:outline-none focus:border-blue-500">
          <option>Newest to oldest</option>
          <option>Oldest to newest</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-10">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                ID Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                Date &amp; Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Doctor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {STATIC_ROWS.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600 flex items-center gap-1">
                  {row.id}
                  <button type="button" className="p-0.5" aria-label="Copy">
                    <IconCopy />
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.date}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.type}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.doctor}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${row.statusColor}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
                    aria-label="Actions"
                  >
                    <IconMore />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
