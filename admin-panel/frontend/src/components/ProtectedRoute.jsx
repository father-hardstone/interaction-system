import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { SUPERADMIN_ROUTES } from '../constants/routes';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to={SUPERADMIN_ROUTES.LOGIN} replace />;
    }

    let decoded;
    try {
        decoded = jwtDecode(token);
    } catch {
        localStorage.removeItem('token');
        return <Navigate to={SUPERADMIN_ROUTES.LOGIN} replace />;
    }

    const currentTime = Date.now() / 1000;

    if (!decoded.exp || decoded.exp < currentTime) {
        localStorage.removeItem('token');
        return <Navigate to={SUPERADMIN_ROUTES.LOGIN} replace />;
    }

    if (decoded.role !== 'admin') {
        localStorage.removeItem('token');
        return <Navigate to={SUPERADMIN_ROUTES.LOGIN} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
