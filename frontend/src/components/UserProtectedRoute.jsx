import { Navigate, Outlet, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const { serial } = useParams();

    if (!token) {
        return <Navigate to="/user/login" replace />;
    }

    let decoded;
    try {
        decoded = jwtDecode(token);
    } catch (e) {
        localStorage.removeItem('token');
        return <Navigate to="/user/login" replace />;
    }

    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        return <Navigate to="/user/login" replace />;
    }

    // Allow both officers and receptionists
    if (decoded.role !== 'officer' && decoded.role !== 'receptionist') {
        return <Navigate to="/user/login" replace />;
    }

    if (serial && decoded.entitySerial && decoded.entitySerial.toLowerCase() !== serial.toLowerCase()) {
        return <Navigate to={`/${decoded.entitySerial.toLowerCase()}/user/dashboard`} replace />;
    }

    return <Outlet />;
};

export default UserProtectedRoute;

