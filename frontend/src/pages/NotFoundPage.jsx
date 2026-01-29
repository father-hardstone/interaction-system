import { Link } from 'react-router-dom';

/**
 * 404 - Page not found (routing errors)
 */
const NotFoundPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
            <div className="max-w-lg w-full text-center">
                <div className="mb-6 text-slate-400">
                    <span className="text-8xl font-black">404</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h1>
                <p className="text-slate-600 mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors no-underline"
                    >
                        Go home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                    >
                        Go back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
