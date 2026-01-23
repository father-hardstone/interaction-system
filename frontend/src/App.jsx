import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import EntityProtectedRoute from './components/EntityProtectedRoute';
import EntityDashboard from './pages/EntityDashboard';
import EntitySettings from './pages/EntitySettings';
import InternalLogin from './pages/InternalLogin';
import UserProtectedRoute from './components/UserProtectedRoute';
import UserDashboard from './pages/UserDashboard';
import { jwtDecode } from 'jwt-decode';

const NavBar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  let displayName = localStorage.getItem('entityName') || 'Interaction System';
  let isAuthed = false;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const valid = decoded.exp && decoded.exp > currentTime;
      if (valid) {
        isAuthed = true;
        if (decoded.role === 'entity') {
          displayName = decoded.name || decoded.entityName || decoded.serial || localStorage.getItem('entityName') || 'Entity';
        } else {
          displayName = decoded.entityName || localStorage.getItem('entityName') || decoded.entitySerial || 'Dashboard';
        }
      }
    } catch {
      isAuthed = false;
    }
  }

  const isDashboardRoute = location.pathname !== '/' && !location.pathname.endsWith('/login');
  const isUserDashboard = location.pathname.includes('/user/dashboard');

  return (
    <nav className="flex justify-between items-center h-16 px-6 bg-white/80 backdrop-blur-lg sticky top-0 z-[100] border-b border-slate-200 w-full font-inherit">
      <div className="flex items-center gap-3">
        {isAuthed && isUserDashboard && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link to="/" className="flex items-center group">
          <span className="font-black text-xl uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
            {isAuthed && isDashboardRoute ? displayName : 'Interaction System'}
          </span>
          {isAuthed && isDashboardRoute && (
            <div className="flex items-center ml-3">
              <span className="text-xl font-thin text-slate-300">|</span>
              <span className="text-[10px] font-black text-slate-400 ml-3 uppercase tracking-[0.3em] mt-0.5">Dashboard</span>
            </div>
          )}
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {/* Right side navigation items can be added here */}
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
        <NavBar />

        <Routes>
          {/* Public-only Routes (if logged in, redirect to correct dashboard) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/entity/login" element={<Login type="entity" />} />
            <Route path="/user/login" element={<InternalLogin />} />
            <Route path="/" element={
              <div className="flex-1 flex items-center justify-center p-8 w-full">
                <div className="text-center">
                  <h1 className="text-5xl mb-4 font-bold">Interaction System</h1>
                  <p className="mb-8 text-gray-600">Select a portal to continue.</p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/entity/login" className="px-6 py-3 bg-white text-primary border border-primary rounded-xl font-semibold text-base no-underline inline-block transition-all hover:bg-blue-50">Entity Portal</Link>
                    <Link to="/user/login" className="px-6 py-3 bg-white text-primary border border-dashed border-primary rounded-xl font-semibold text-base no-underline inline-block transition-all hover:bg-blue-50">Internal Login</Link>
                  </div>
                </div>
              </div>
            } />
          </Route>

          {/* Entity Protected Routes */}
          <Route element={<EntityProtectedRoute />}>
            <Route path="/entity/:serial/dashboard" element={<EntityDashboard />} />
            <Route path="/entity/:serial/settings" element={<EntitySettings />} />
          </Route>

          {/* Internal User (Officer) Protected Routes */}
          <Route element={<UserProtectedRoute />}>
            <Route path="/:serial/user/dashboard" element={<UserDashboard />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
