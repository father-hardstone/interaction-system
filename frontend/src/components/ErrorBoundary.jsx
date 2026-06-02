import { Component } from 'react';
import { getHomePath } from '../utils/authRedirect';

/**
 * React Error Boundary - catches JavaScript errors in child component tree.
 * Renders a fallback UI instead of crashing the whole app.
 * Uses <a href> instead of <Link> because when an error occurs, the fallback
 * may render outside Router context (e.g. when Router's subtree throws).
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
                    <div className="max-w-lg w-full text-center">
                        <div className="mb-6 text-red-500">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
                        <p className="text-slate-600 mb-6">
                            An unexpected error occurred. Please try refreshing the page or go back to the home page.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                            >
                                Refresh page
                            </button>
                            <a
                                href={getHomePath()}
                                className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors no-underline inline-block"
                            >
                                Go home
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
