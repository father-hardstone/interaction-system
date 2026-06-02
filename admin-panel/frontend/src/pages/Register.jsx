import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import LoadingButton from '../components/LoadingButton';
import { validateEmail } from '../utils/crypto';
import { SUPERADMIN_ROUTES } from '../constants/routes';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [emailError, setEmailError] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'email' && value.trim().length > 0) {
            const validation = validateEmail(value);
            setEmailError(validation.error || '');
        } else if (name === 'email') {
            setEmailError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.valid) {
            setEmailError(emailValidation.error);
            return;
        }

        try {
            setIsSubmitting(true);
            await authService.register({
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });
            navigate(SUPERADMIN_ROUTES.LOGIN, {
                state: { message: 'Registration successful. Please sign in.' },
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
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
                    Create <span className="text-cyan-400">Superadmin</span>
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                    Register a new platform administrator account.
                </p>
            </div>

            {error && (
                <p className="bg-red-500/10 border border-red-500/20 text-red-400 py-3 px-4 rounded-xl text-sm text-center mb-4">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <fieldset disabled={isSubmitting} className="flex flex-col gap-5 border-0 p-0 m-0 min-w-0">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-300">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Ex. John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-300">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                        className={`${inputClass} ${emailError ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                    />
                    {emailError && <span className="text-red-400 text-sm">{emailError}</span>}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-300">Password</label>
                    <PasswordInput
                        name="password"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        variant="dark"
                        autoComplete="new-password"
                    />
                </div>
                </fieldset>

                <LoadingButton
                    loading={isSubmitting}
                    loadingLabel="Creating account…"
                    className="mt-4 py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-none rounded-xl font-bold text-base cursor-pointer transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
                >
                    Create Account
                </LoadingButton>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-slate-500 font-medium">Already have an account? </span>
                <Link to={SUPERADMIN_ROUTES.LOGIN} className="text-cyan-400 font-bold no-underline hover:text-cyan-300">
                    Sign in here
                </Link>
            </div>
        </div>
    );
};

export default Register;
