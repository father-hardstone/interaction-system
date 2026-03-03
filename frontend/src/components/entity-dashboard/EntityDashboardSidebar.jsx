import {
  IconDashboard,
  IconPatients,
  IconAppointments,
  IconPayments,
  IconMessages,
  IconDoctors,
  IconEmployees,
  IconSettings,
  IconHelp,
} from './icons';

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { id: 'patients', label: 'Patients', Icon: IconPatients },
  { id: 'interactions', label: 'Interactions', Icon: IconAppointments },
  { id: 'payments', label: 'Payments', Icon: IconPayments },
  { id: 'messages', label: 'Messages', Icon: IconMessages, badge: 5 },
];

const CATALOG = [
  { id: 'doctors', label: 'Doctors', Icon: IconDoctors },
  { id: 'employees', label: 'Employees', Icon: IconEmployees },
];

const HELP_OTHER = [
  { id: 'help', label: 'Help Center', Icon: IconHelp },
];

export default function EntityDashboardSidebar({ serial, activeSection, onNavigate }) {
  const navItemClass = (id) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium w-full text-left transition-colors ${
      activeSection === id ? 'bg-blue-500 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;
  const handleNav = (id) => {
    if (onNavigate) onNavigate(id);
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-[90] w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white">
          <IconDashboard />
        </div>
        <span className="font-semibold text-slate-900">Medical MIS</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {SECTIONS.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleNav(id)}
            className={navItemClass(id)}
          >
            <Icon />
            <span className="flex-1">{label}</span>
            {badge != null && (
              <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}

        <div className="pt-2 mt-2 border-t border-slate-100">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Catalog
          </p>
          {CATALOG.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNav(id)}
              className={navItemClass(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="pt-2 mt-2 border-t border-slate-100">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Help &amp; Settings
          </p>
          <button
            type="button"
            onClick={() => handleNav('settings')}
            className={navItemClass('settings')}
          >
            <IconSettings />
            <span>Settings</span>
          </button>
          {HELP_OTHER.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleNav(id)}
              className={navItemClass(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}
