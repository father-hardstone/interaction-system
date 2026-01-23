import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// NOTE: Admin workflow has moved to admin-panel/frontend.
// This file is kept to avoid breaking imports during transition, but it is no longer used by main `frontend/src/App.jsx`.
const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    let decoded;
    try {
        decoded = jwtDecode(token);
    } catch (e) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    // Check functionality: admin role and expiration
    const currentTime = Date.now() / 1000;

    if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    if (decoded.role !== 'admin') {
        return <Navigate to="/login" replace />; // Or forbidden page
    }

    return <Outlet />;
};

export default ProtectedRoute;

