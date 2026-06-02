import { jwtDecode } from 'jwt-decode';
import { SUPERADMIN_ROUTES } from '../constants/routes';

export function getSuperadminDashboardPath() {
    return SUPERADMIN_ROUTES.DASHBOARD;
}

export function getSuperadminHomePath() {
    const token = localStorage.getItem('token');
    if (!token) return SUPERADMIN_ROUTES.LOGIN;

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.role === 'admin' && decoded.exp && decoded.exp > currentTime) {
            return SUPERADMIN_ROUTES.DASHBOARD;
        }
    } catch {
        // fall through
    }

    return SUPERADMIN_ROUTES.LOGIN;
}
