import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import EntityProtectedRoute from './components/EntityProtectedRoute';
import EntityDashboard from './pages/EntityDashboard';
import EntitySettings from './pages/EntitySettings';
import InternalLogin from './pages/InternalLogin';
import UserProtectedRoute from './components/UserProtectedRoute';
import UserDashboard from './pages/UserDashboard';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
        {/* Navigation removed from auth pages as requested. 
            We can keep a simple logo or minimal header if needed, 
            but the request was to remove buttons from top bar.
            I will keep a minimal header just for Home/Brand navigation if not on auth pages?
            Or just remove the nav links completely since they are now in the cards.
        */}
        <nav className="flex justify-between items-center gap-8 px-6 py-4 bg-white/80 backdrop-blur-lg sticky top-0 z-[100] border-b border-white/30 w-full">
          <Link to="/" className="font-bold text-xl text-gray-800">Interaction System</Link>
          {/* Empty right side, or maybe just simple Home link if deep in app */}
        </nav>

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
