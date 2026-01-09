import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

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
