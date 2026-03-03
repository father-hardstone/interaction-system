import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import EntityProtectedRoute from './components/EntityProtectedRoute';
import EntityLayout from './pages/EntityLayout';
import EntityDashboard from './pages/EntityDashboard';
import EntitySettings from './pages/EntitySettings';
import InternalLogin from './pages/InternalLogin';
import UserProtectedRoute from './components/UserProtectedRoute';
import UserDashboard from './pages/UserDashboard';
import UserDashboardLayout from './pages/UserDashboardLayout';
import UserSettings from './pages/UserSettings';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';
import { UserDashboardNavProvider, useUserDashboardNav } from './contexts/UserDashboardNavContext';
import { ToastProvider } from './contexts/ToastContext';
import UserDashboardNavContent from './components/UserDashboardNavContent';
import { jwtDecode } from 'jwt-decode';
import { entityService } from './services/entityService';
import supabaseStorageService from './services/supabaseService';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [entityIconUrl, setEntityIconUrl] = useState(null);
  const [entityUserDropdownOpen, setEntityUserDropdownOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    displayName: "Medical Interaction System",
    isAuthed: false,
    isEntity: false,
    entityId: null,
    userEntityId: null
  });

  // Parse user info from token
  useEffect(() => {
    if (!token) {
      setUserInfo({
        displayName: "Medical Interaction System",
        isAuthed: false,
        isEntity: false,
        entityId: null,
        userEntityId: null
      });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const valid = decoded.exp && decoded.exp > currentTime;
      
      if (valid) {
        if (decoded.role === 'entity') {
          setUserInfo({
            displayName: decoded.name || decoded.entityName || decoded.serial || localStorage.getItem('entityName') || 'Entity',
            isAuthed: true,
            isEntity: true,
            entityId: decoded.id,
            userEntityId: null
          });
        } else if (decoded.role === 'officer' || decoded.role === 'receptionist') {
          setUserInfo({
            displayName: decoded.entityName || localStorage.getItem('entityName') || decoded.entitySerial || 'Dashboard',
            isAuthed: true,
            isEntity: false,
            entityId: null,
            userEntityId: decoded.entityId
          });
        } else {
          setUserInfo({
            displayName: localStorage.getItem('entityName') || "Medical Interaction System",
            isAuthed: true,
            isEntity: false,
            entityId: null,
            userEntityId: null
          });
        }
      } else {
        setUserInfo({
          displayName: "Medical Interaction System",
          isAuthed: false,
          isEntity: false,
          entityId: null,
          userEntityId: null
        });
      }
    } catch {
      setUserInfo({
        displayName: "Medical Interaction System",
        isAuthed: false,
        isEntity: false,
        entityId: null,
        userEntityId: null
      });
    }
  }, [token]);

  const isDashboardRoute = location.pathname !== '/' && !location.pathname.endsWith('/login');
  const isUserDashboard = location.pathname.includes('/user/dashboard');
  const isEntityRoute = location.pathname.includes('/entity/');
  const shouldShowIcon = (userInfo.isEntity && isEntityRoute) || (isUserDashboard && userInfo.userEntityId);
  const { navState } = useUserDashboardNav();
  const showUserDashboardNav = isUserDashboard && userInfo.isAuthed && navState;

  // Load entity icon with caching (base64 in localStorage – survives refresh, no re-fetch)
  useEffect(() => {
    const loadEntityIcon = async () => {
      const currentEntityId = userInfo.isEntity ? userInfo.entityId : userInfo.userEntityId;

      if (!shouldShowIcon || !currentEntityId || !token) {
        setEntityIconUrl(null);
        return;
      }

      const cacheKey = `entityIcon_${currentEntityId}`;
      const cacheEntityKey = 'cachedEntityId';

      // 1. Check localStorage for cached icon – use immediately, no network
      const cached = localStorage.getItem(cacheKey);
      const cachedEntityId = localStorage.getItem(cacheEntityKey);
      if (cached && cachedEntityId === currentEntityId) {
        if (cached.startsWith('data:image')) {
          setEntityIconUrl(cached);
          return;
        }
        if (cached.startsWith('http')) {
          setEntityIconUrl(cached);
          // Background: fetch and cache as base64 (URLs like Supabase signed expire)
          fetch(cached)
            .then((res) => res.blob())
            .then((blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result;
                if (typeof base64 === 'string' && base64.length < 500000) {
                  localStorage.setItem(cacheKey, base64);
                }
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => {});
          return;
        }
      }

      // 2. Fetch icon from API
      try {
        let data;
        if (userInfo.isEntity) {
          data = await entityService.getSettings();
        } else {
          data = await entityService.getById(currentEntityId);
        }

        let urlToUse = null;
        if (data.icon && !data.icon.startsWith('data:image') && !data.icon.startsWith('http')) {
          urlToUse = await supabaseStorageService.getFileUrl('CRM testing', data.icon);
        } else if (data.icon && (data.icon.startsWith('http') || data.icon.startsWith('data:image'))) {
          urlToUse = data.icon;
        }

        if (!urlToUse) {
          setEntityIconUrl(null);
          localStorage.removeItem(cacheKey);
          return;
        }

        setEntityIconUrl(urlToUse);

        // 3. Fetch image and cache as base64 so it survives refresh (URLs like Supabase signed expire)
        try {
          const res = await fetch(urlToUse);
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result;
            if (typeof base64 === 'string' && base64.length < 500000) {
              localStorage.setItem(cacheKey, base64);
              localStorage.setItem(cacheEntityKey, currentEntityId);
            } else if (typeof base64 === 'string') {
              localStorage.setItem(cacheKey, urlToUse);
              localStorage.setItem(cacheEntityKey, currentEntityId);
            }
          };
          reader.readAsDataURL(blob);
        } catch {
          localStorage.setItem(cacheKey, urlToUse);
          localStorage.setItem(cacheEntityKey, currentEntityId);
        }
      } catch (err) {
        console.error('Failed to load entity icon:', err);
        setEntityIconUrl(null);
        localStorage.removeItem(cacheKey);
      }
    };

    loadEntityIcon();
  }, [location.pathname, token, userInfo.entityId, userInfo.userEntityId, userInfo.isEntity, shouldShowIcon]);

  // User Dashboard layout: center tabs + right profile
  if (showUserDashboardNav) {
    return (
      <UserDashboardNavContent
        navState={navState}
        entityIconUrl={entityIconUrl}
        userInfo={userInfo}
        shouldShowIcon={shouldShowIcon}
      />
    );
  }

  const showEntityTopBar = isEntityRoute && userInfo.isAuthed && userInfo.isEntity;
  const handleEntityLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('entityName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('entityId');
    localStorage.removeItem('entitySerial');
    setEntityUserDropdownOpen(false);
    navigate('/entity/login');
  };

  // Default layout (entity, login, etc.)
  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-between items-center h-16 px-6 bg-white/80 backdrop-blur-lg z-[100] border-b border-slate-200 w-full font-inherit">
      <div className="flex items-center gap-3 shrink-0">
        <Link to="/" className="flex items-center group">
          {userInfo.isAuthed && isDashboardRoute && shouldShowIcon ? (
            entityIconUrl ? (
              <div className="flex items-center">
                <img
                  src={entityIconUrl}
                  alt={userInfo.displayName}
                  className="h-14 w-auto object-contain max-w-[240px]"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const currentEntityId = userInfo.isEntity ? userInfo.entityId : userInfo.userEntityId;
                    if (currentEntityId) localStorage.removeItem(`entityIcon_${currentEntityId}`);
                    setEntityIconUrl(null);
                  }}
                />
                <span className="sr-only">{userInfo.displayName}</span>
              </div>
            ) : (
              <span className="font-semibold text-xl normal-case tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
                {userInfo.displayName}
              </span>
            )
          ) : (
            <span className="font-semibold text-xl normal-case tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
              {userInfo.isAuthed && isDashboardRoute ? userInfo.displayName : "Medical Interaction System"}
            </span>
          )}
          {userInfo.isAuthed && isDashboardRoute && (
            <div className="flex items-center ml-3">
              <span className="text-xl font-normal text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-400 ml-3 normal-case tracking-[0.3em] mt-0.5">Dashboard</span>
            </div>
          )}
        </Link>
      </div>

      {showEntityTopBar && (
        <>
          {!location.pathname.endsWith('/settings') ? (
            <div className="flex-1 max-w-xl mx-6 hidden sm:block min-w-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search for patients, doctors and etc."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0" aria-hidden="true" />
          )}
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Notifications">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setEntityUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {(userInfo.displayName || 'E').charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:inline max-w-[120px] truncate">{userInfo.displayName}</span>
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {entityUserDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setEntityUserDropdownOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-xl shadow-lg border border-slate-200 z-20">
                    <button
                      onClick={handleEntityLogout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {!showEntityTopBar && <div className="flex items-center gap-4" />}
    </nav>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <UserDashboardNavProvider>
          <ToastProvider>
          <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
            <NavBar />
            <div className="flex-1 flex flex-col pt-16">
          <Routes>
          {/* Public-only Routes (if logged in, redirect to correct dashboard) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/entity/login" element={<Login type="entity" />} />
            <Route path="/user/login" element={<InternalLogin />} />
            <Route path="/" element={
              <div className="flex-1 flex items-center justify-center p-8 w-full">
                <div className="text-center">
                  <img src="/icons/interaction_system_icon.png" alt="Medical Interaction System" className="h-20 w-auto mx-auto mb-6 object-contain" />
                  <h1 className="text-5xl mb-4 font-semibold">Medical Interaction System</h1>
                  <p className="mb-8 text-gray-600">Select a portal to continue.</p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/entity/login" className="px-6 py-3 bg-white text-primary border border-primary rounded-xl font-semibold text-base no-underline inline-block transition-all hover:bg-blue-50">Entity Portal</Link>
                    <Link to="/user/login" className="px-6 py-3 bg-white text-primary border border-dashed border-primary rounded-xl font-semibold text-base no-underline inline-block transition-all hover:bg-blue-50">Internal Login</Link>
                  </div>
                </div>
              </div>
            } />
          </Route>

          {/* Entity Protected Routes - shared layout (sidebar) for dashboard and settings */}
          <Route element={<EntityProtectedRoute />}>
            <Route path="/entity/:serial" element={<EntityLayout />}>
              <Route path="dashboard" element={<EntityDashboard />} />
              <Route path="settings" element={<EntitySettings />} />
            </Route>
          </Route>

          {/* Internal User (Officer) Protected Routes */}
          <Route element={<UserProtectedRoute />}>
            <Route path="/:serial/user/dashboard" element={<UserDashboardLayout />}>
              <Route index element={<UserDashboard />} />
              <Route path="settings" element={<UserSettings />} />
            </Route>
          </Route>

          {/* 404 - Catch-all for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
            </div>
        </div>
          </ToastProvider>
        </UserDashboardNavProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
