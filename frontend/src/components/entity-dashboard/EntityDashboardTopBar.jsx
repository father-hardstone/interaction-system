import { IconSearch, IconBell } from './icons';

export default function EntityDashboardTopBar({ entityName, userDropdownOpen, onToggleUserDropdown, onLogout }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-slate-900 text-lg">{entityName}</span>
      </div>
      <div className="flex-1 max-w-xl mx-6 hidden sm:block">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search for patients, doctors and etc."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Notifications">
          <IconBell />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleUserDropdown}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {(entityName || 'E').charAt(0)}
            </div>
            <span className="text-sm font-medium text-slate-700 hidden sm:inline">{entityName}</span>
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {userDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={onToggleUserDropdown} aria-hidden="true" />
              <div className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-xl shadow-lg border border-slate-200 z-20">
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
