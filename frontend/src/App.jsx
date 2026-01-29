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
import { jwtDecode } from 'jwt-decode';
import { entityService } from './services/entityService';
import supabaseStorageService from './services/supabaseService';

const NavBar = () => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [entityIconUrl, setEntityIconUrl] = useState(null);
  const [userInfo, setUserInfo] = useState({
    displayName: 'Interaction System',
    isAuthed: false,
    isEntity: false,
    entityId: null,
    userEntityId: null
  });

  // Parse user info from token
  useEffect(() => {
    if (!token) {
      setUserInfo({
        displayName: 'Interaction System',
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
            displayName: localStorage.getItem('entityName') || 'Interaction System',
            isAuthed: true,
            isEntity: false,
            entityId: null,
            userEntityId: null
          });
        }
      } else {
        setUserInfo({
          displayName: 'Interaction System',
          isAuthed: false,
          isEntity: false,
          entityId: null,
          userEntityId: null
        });
      }
    } catch {
      setUserInfo({
        displayName: 'Interaction System',
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

  // Load entity icon with caching
  useEffect(() => {
    const loadEntityIcon = async () => {
      const currentEntityId = userInfo.isEntity ? userInfo.entityId : userInfo.userEntityId;
      
      if (!shouldShowIcon || !currentEntityId || !token) {
        setEntityIconUrl(null);
        return;
      }

      // Check cache first
      const cacheKey = `entityIcon_${currentEntityId}`;
      const cachedIconUrl = localStorage.getItem(cacheKey);
      const cachedEntityId = localStorage.getItem('cachedEntityId');
      
      // Use cache if it exists and entityId matches
      if (cachedIconUrl && cachedEntityId === currentEntityId) {
        console.log('Using cached icon for entity:', currentEntityId);
        setEntityIconUrl(cachedIconUrl);
        return;
      }

      // Fetch icon
      try {
        console.log('Fetching icon for entity:', currentEntityId, 'isEntity:', userInfo.isEntity);
        let data;
        if (userInfo.isEntity) {
          // Entity user - use settings endpoint
          data = await entityService.getSettings();
        } else {
          // Internal user - use getById endpoint
          data = await entityService.getById(currentEntityId);
        }

        console.log('Entity data received:', { hasIcon: !!data.icon, icon: data.icon });

        if (data.icon && !data.icon.startsWith('data:image') && !data.icon.startsWith('http')) {
          // Icon is a path, fetch URL from Supabase
          const url = await supabaseStorageService.getFileUrl('CRM testing', data.icon);
          if (url) {
            console.log('Icon URL fetched from Supabase:', url);
            setEntityIconUrl(url);
            // Cache the URL
            localStorage.setItem(cacheKey, url);
            localStorage.setItem('cachedEntityId', currentEntityId);
          } else {
            console.warn('Failed to get Supabase URL for icon path:', data.icon);
            setEntityIconUrl(null);
            localStorage.removeItem(cacheKey);
          }
        } else if (data.icon && (data.icon.startsWith('http') || data.icon.startsWith('data:image'))) {
          // Icon is already a URL
          console.log('Using icon URL directly:', data.icon);
          setEntityIconUrl(data.icon);
          // Cache the URL
          localStorage.setItem(cacheKey, data.icon);
          localStorage.setItem('cachedEntityId', currentEntityId);
        } else {
          console.warn('No icon found in entity data');
          setEntityIconUrl(null);
          localStorage.removeItem(cacheKey);
        }
      } catch (err) {
        console.error('Failed to load entity icon:', err);
        setEntityIconUrl(null);
        localStorage.removeItem(cacheKey);
      }
    };

    loadEntityIcon();
  }, [location.pathname, token, userInfo.entityId, userInfo.userEntityId, userInfo.isEntity, shouldShowIcon]);

  return (
    <nav className="flex justify-between items-center h-16 px-6 bg-white/80 backdrop-blur-lg sticky top-0 z-[100] border-b border-slate-200 w-full font-inherit">
      <div className="flex items-center gap-3">
        {userInfo.isAuthed && isUserDashboard && (
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
          {userInfo.isAuthed && isDashboardRoute && shouldShowIcon ? (
            // Show entity icon for entity routes and internal user routes
            entityIconUrl ? (
              <div className="flex items-center">
                <img
                  src={entityIconUrl}
                  alt={userInfo.displayName}
                  className="h-14 w-auto object-contain max-w-[240px]"
                  onError={(e) => {
                    // Fallback to name if image fails
                    console.error('Image failed to load:', entityIconUrl);
                    e.target.style.display = 'none';
                    // Clear cache on error
                    const currentEntityId = userInfo.isEntity ? userInfo.entityId : userInfo.userEntityId;
                    if (currentEntityId) {
                      localStorage.removeItem(`entityIcon_${currentEntityId}`);
                    }
                    setEntityIconUrl(null);
                  }}
                  onLoad={() => {
                    console.log('Icon loaded successfully:', entityIconUrl);
                  }}
                />
                <span className="sr-only">{userInfo.displayName}</span>
              </div>
            ) : (
              <span className="font-black text-xl uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
                {userInfo.displayName}
              </span>
            )
          ) : (
            <span className="font-black text-xl uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
              {userInfo.isAuthed && isDashboardRoute ? userInfo.displayName : 'Interaction System'}
            </span>
          )}
          {userInfo.isAuthed && isDashboardRoute && (
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
