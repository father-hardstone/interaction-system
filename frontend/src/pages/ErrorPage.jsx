import { Link } from 'react-router-dom';

/**
 * Generic error page - for network errors, API failures, etc.
 * Can be used with useRouteError() from React Router for routing errors.
 */
const ErrorPage = ({ error, resetError }) => {
    const is404 = error?.status === 404 || error?.statusText === 'Not Found';
    const title = is404 ? 'Page not found' : 'Something went wrong';
    const message = is404
        ? "The page you're looking for doesn't exist or has been moved."
        : error?.message || 'An unexpected error occurred. Please try again.';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
            <div className="max-w-lg w-full text-center">
                <div className={`mb-6 ${is404 ? 'text-slate-400' : 'text-red-500'}`}>
                    {is404 ? (
                        <span className="text-8xl font-semibold">404</span>
                    ) : (
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    )}
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">{title}</h1>
                <p className="text-slate-600 mb-6">{message}</p>
                <div className="flex gap-4 justify-center flex-wrap">
                    {resetError && (
                        <button
                            onClick={resetError}
                            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                        >
                            Try again
                        </button>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                    >
                        Refresh page
                    </button>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors no-underline"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
