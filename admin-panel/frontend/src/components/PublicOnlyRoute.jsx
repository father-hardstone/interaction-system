import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const getRedirectForToken = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (!decoded.exp || decoded.exp < currentTime) {
            return { valid: false };
        }

        if (decoded.role === 'admin') {
            return { valid: true, to: '/admin/dashboard' };
        }

        // Wrong role for admin-panel => clear token
        return { valid: false };
    } catch {
        return { valid: false };
    }
};

const PublicOnlyRoute = () => {
    const token = localStorage.getItem('token');
    if (!token) return <Outlet />;

    const redirect = getRedirectForToken(token);
    if (!redirect.valid) {
        localStorage.removeItem('token');
        return <Outlet />;
    }

    return <Navigate to={redirect.to} replace />;
};

export default PublicOnlyRoute;

