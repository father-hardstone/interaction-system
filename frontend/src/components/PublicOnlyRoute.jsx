import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const getRedirectForToken = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (!decoded.exp || decoded.exp < currentTime) {
            return { valid: false };
        }

        if (decoded.role === 'entity' && decoded.serial) {
            return { valid: true, to: `/entity/${decoded.serial.toLowerCase()}/dashboard` };
        }

        if ((decoded.role === 'officer' || decoded.role === 'receptionist') && (decoded.entitySerial || decoded.serial)) {
            const entitySerial = (decoded.entitySerial || decoded.serial).toLowerCase();
            return { valid: true, to: `/${entitySerial}/user/dashboard` };
        }

        // If token exists but role isn't valid for this app, treat as invalid and clear it
        return { valid: false };
    } catch {
        return { valid: false };
    }
};

// Blocks access to public routes (login/home) when user is already logged in.
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

