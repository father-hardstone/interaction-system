import { Navigate, Outlet, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const EntityProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const { serial } = useParams();

    if (!token) {
        return <Navigate to="/entity/login" replace />;
    }

    let decoded;
    try {
        decoded = jwtDecode(token);
    } catch (e) {
        localStorage.removeItem('token');
        return <Navigate to="/entity/login" replace />;
    }

    // Check expiration
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
        localStorage.removeItem('token');
        return <Navigate to="/entity/login" replace />;
    }

    // Check role
    if (decoded.role !== 'entity') {
        return <Navigate to="/entity/login" replace />;
    }

    // Check if serial in URL matches token serial
    if (serial && decoded.serial.toLowerCase() !== serial.toLowerCase()) {
        return <Navigate to={`/entity/${decoded.serial.toLowerCase()}/dashboard`} replace />;
    }

    return <Outlet context={{ entityData: decoded }} />;
};

export default EntityProtectedRoute;

