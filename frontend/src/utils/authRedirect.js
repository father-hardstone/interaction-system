import { jwtDecode } from 'jwt-decode';

const INTERNAL_USER_ROLES = ['officer', 'receptionist', 'accountant', 'admin'];

/**
 * Returns the app dashboard path for a valid JWT, or null if unauthenticated / expired / unknown role.
 */
export function getDashboardPathForToken(token) {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (!decoded.exp || decoded.exp < currentTime) {
            return null;
        }

        if (decoded.role === 'entity' && decoded.serial) {
            return `/entity/${String(decoded.serial).toLowerCase()}/dashboard`;
        }

        if (INTERNAL_USER_ROLES.includes(decoded.role)) {
            const entitySerial = (decoded.entitySerial || decoded.serial || '').toString().toLowerCase();
            if (entitySerial) {
                return `/${entitySerial}/user/dashboard`;
            }
        }

        return null;
    } catch {
        return null;
    }
}

/** Home link target: dashboard when logged in, public landing otherwise. */
export function getHomePath() {
    const token = localStorage.getItem('token');
    return getDashboardPathForToken(token) || '/';
}
