import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import EntityProtectedRoute from './components/EntityProtectedRoute';
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
  const token = localStorage.getItem('token');
  const [entityIconUrl, setEntityIconUrl] = useState(null);
  const [userInfo, setUserInfo] = useState({
    displayName: "Bilal's Interaction System",
    isAuthed: false,
    isEntity: false,
    entityId: null,
    userEntityId: null
  });

  // Parse user info from token
  useEffect(() => {
    if (!token) {
      setUserInfo({
        displayName: "Bilal's Interaction System",
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
            displayName: localStorage.getItem('entityName') || "Bilal's Interaction System",
            isAuthed: true,
            isEntity: false,
            entityId: null,
            userEntityId: null
          });
        }
      } else {
        setUserInfo({
          displayName: "Bilal's Interaction System",
          isAuthed: false,
          isEntity: false,
          entityId: null,
          userEntityId: null
        });
      }
    } catch {
      setUserInfo({
        displayName: "Bilal's Interaction System",
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

  // Default layout (entity, login, etc.)
  return (
    <nav className="flex justify-between items-center h-16 px-6 bg-white/80 backdrop-blur-lg sticky top-0 z-[100] border-b border-slate-200 w-full font-inherit">
      <div className="flex items-center gap-3">
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
              {userInfo.isAuthed && isDashboardRoute ? userInfo.displayName : "Bilal's Interaction System"}
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
      <div className="flex items-center gap-4" />
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

          <Routes>
          {/* Public-only Routes (if logged in, redirect to correct dashboard) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/entity/login" element={<Login type="entity" />} />
            <Route path="/user/login" element={<InternalLogin />} />
            <Route path="/" element={
              <div className="flex-1 flex items-center justify-center p-8 w-full">
                <div className="text-center">
                  <img src="/icons/interaction_system_icon.png" alt="Bilal's Interaction System" className="h-20 w-auto mx-auto mb-6 object-contain" />
                  <h1 className="text-5xl mb-4 font-semibold">Bilal's Interaction System</h1>
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
            <Route path="/:serial/user/dashboard" element={<UserDashboardLayout />}>
              <Route index element={<UserDashboard />} />
              <Route path="settings" element={<UserSettings />} />
            </Route>
          </Route>

          {/* 404 - Catch-all for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </div>
          </ToastProvider>
        </UserDashboardNavProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
