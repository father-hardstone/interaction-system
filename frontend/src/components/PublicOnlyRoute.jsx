import { Navigate, Outlet } from 'react-router-dom';
import { getDashboardPathForToken } from '../utils/authRedirect';

// Blocks access to public routes (login/home) when user is already logged in.
const PublicOnlyRoute = () => {
    const token = localStorage.getItem('token');
    if (!token) return <Outlet />;

    const dashboardPath = getDashboardPathForToken(token);
    if (!dashboardPath) {
        localStorage.removeItem('token');
        return <Outlet />;
    }

    return <Navigate to={dashboardPath} replace />;
};

export default PublicOnlyRoute;
