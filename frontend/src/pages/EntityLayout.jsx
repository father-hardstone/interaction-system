import { useParams, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { EntityDashboardSidebar } from '../components/entity-dashboard';

/**
 * Shared layout for entity dashboard and settings: same sidebar, main area is outlet.
 * activeSection: 'settings' when path ends with /settings; otherwise from ?section= (default 'dashboard').
 */
export default function EntityLayout() {
  const { serial } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isSettings = location.pathname.endsWith('/settings');
  const searchParams = new URLSearchParams(location.search);
  const activeSection = isSettings ? 'settings' : (searchParams.get('section') || 'dashboard');

  const onNavigate = (section) => {
    if (section === 'settings') {
      navigate(`/entity/${serial}/settings`);
    } else {
      navigate(`/entity/${serial}/dashboard${section === 'dashboard' ? '' : `?section=${section}`}`);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      <EntityDashboardSidebar
        serial={serial}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
      <main className="ml-60 flex-1 min-h-[calc(100vh-64px)] overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
