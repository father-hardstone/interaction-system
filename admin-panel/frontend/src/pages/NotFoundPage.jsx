import { Link } from 'react-router-dom';
import { getSuperadminHomePath } from '../utils/authRedirect';

const NotFoundPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="max-w-lg w-full text-center">
            <div className="mb-6 text-slate-400">
                <span className="text-8xl font-semibold">404</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Page not found</h1>
            <p className="text-slate-600 mb-6">
                This Superadmin portal page does not exist or has been moved.
            </p>
            <Link
                to={getSuperadminHomePath()}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors no-underline inline-block"
            >
                Go home
            </Link>
        </div>
    </div>
);

export default NotFoundPage;
