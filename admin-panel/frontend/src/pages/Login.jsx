import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import { validateEmail } from '../utils/crypto';
import { jwtDecode } from 'jwt-decode';
import { SUPERADMIN_ROUTES } from '../constants/routes';

const Login = () => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const successMessage = location.state?.message;

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value.trim().length > 0) {
            const validation = validateEmail(value);
            setEmailError(validation.error || '');
        } else {
            setEmailError('');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setEmailError('');
        if (isSubmitting) return;

        if (!email || email.trim().length === 0) {
            setError('Please enter your email address');
            return;
        }

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            setEmailError(emailValidation.error);
            return;
        }

        if (!password || password.trim().length === 0) {
            setError('Password is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await authService.login({
                email: email.trim().toLowerCase(),
                password,
            });
            localStorage.setItem('token', res.token);

            const decoded = jwtDecode(res.token);
            if (decoded.role !== 'admin') {
                localStorage.removeItem('token');
                setError('This portal is for superadmins only.');
                return;
            }
            navigate(SUPERADMIN_ROUTES.DASHBOARD);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        'w-full py-3.5 px-4 border border-slate-700 bg-slate-800/50 rounded-xl font-inherit text-base transition-all text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10';

    return (
        <div className="p-8 pt-10">
            <div className="mb-8 text-center">
                <h2 className="m-0 text-3xl font-bold text-white tracking-tight">
                    Superadmin <span className="text-cyan-400">Portal</span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Secure platform administration gateway.
                </p>
            </div>

            {successMessage && (
                <p className="bg-green-500/10 border border-green-500/20 text-green-400 py-3 px-4 rounded-xl text-sm text-center mb-4">
                    {successMessage}
                </p>
            )}

            {error && (
                <p className="bg-red-500/10 border border-red-500/20 text-red-400 py-3 px-4 rounded-xl text-sm text-center mb-4">
                    {error}
                </p>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-300">
                        Email Address <span className="text-error">*</span>
                    </label>
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={handleEmailChange}
                        required
                        autoComplete="email"
                        className={`${inputClass} ${emailError ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                    />
                    {emailError && <span className="text-red-400 text-sm">{emailError}</span>}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-300">
                        Password <span className="text-error">*</span>
                    </label>
                    <PasswordInput
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        variant="dark"
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-none rounded-xl font-bold text-base cursor-pointer transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                        </span>
                    ) : (
                        'Login'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-500 font-medium">Don&apos;t have an account? </span>
                <Link to={SUPERADMIN_ROUTES.REGISTER} className="text-cyan-400 font-bold no-underline hover:text-cyan-300">
                    Register here
                </Link>
            </div>
        </div>
    );
};

export default Login;
