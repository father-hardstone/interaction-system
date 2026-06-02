import { Navigate } from 'react-router-dom';
import { getSuperadminHomePath } from '../utils/authRedirect';

const HomeRedirect = () => <Navigate to={getSuperadminHomePath()} replace />;

export default HomeRedirect;
