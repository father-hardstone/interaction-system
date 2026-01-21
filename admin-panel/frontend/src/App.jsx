import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminHome from './pages/AdminHome';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

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
          {/* Public-only Auth Routes (if logged in as admin, redirect to dashboard) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/admin/login" element={<Login type="admin" />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminHome />} />
          </Route>

          <Route path="/" element={
            <div className="flex-1 flex items-center justify-center p-8 w-full">
              <div className="text-center">
                <h1 className="text-5xl mb-4 font-bold">Interaction System</h1>
                <p className="mb-8 text-gray-600">Select a portal to continue.</p>
                <div className="flex gap-4 justify-center">
                  <Link to="/admin/login" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-base no-underline inline-block transition-all hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg">Admin Portal</Link>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
