import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminHome from './pages/AdminHome';
import HomeRedirect from './pages/HomeRedirect';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import ErrorBoundary from './components/ErrorBoundary';
import SuperadminAuthShell from './components/SuperadminAuthShell';
import SuperadminDashboardLayout from './layouts/SuperadminDashboardLayout';
import { SUPERADMIN_ROUTES, LEGACY_ADMIN_ROUTES } from './constants/routes';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="w-full min-h-screen flex flex-col overflow-x-hidden">
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route element={<SuperadminAuthShell />}>
                <Route path={SUPERADMIN_ROUTES.LOGIN} element={<Login />} />
                <Route path={SUPERADMIN_ROUTES.REGISTER} element={<Register />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<SuperadminDashboardLayout />}>
                <Route path={SUPERADMIN_ROUTES.DASHBOARD} element={<AdminHome />} />
              </Route>
            </Route>

            <Route path="/" element={<HomeRedirect />} />

            <Route path={LEGACY_ADMIN_ROUTES.LOGIN} element={<Navigate to={SUPERADMIN_ROUTES.LOGIN} replace />} />
            <Route path={LEGACY_ADMIN_ROUTES.DASHBOARD} element={<Navigate to={SUPERADMIN_ROUTES.DASHBOARD} replace />} />
            <Route path={LEGACY_ADMIN_ROUTES.REGISTER} element={<Navigate to={SUPERADMIN_ROUTES.REGISTER} replace />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
