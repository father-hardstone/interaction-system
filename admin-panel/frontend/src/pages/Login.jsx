import { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import OtpInput from '../components/OtpInput';
import { hashPassword } from '../utils/crypto';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [step, setStep] = useState(1);
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if phone is valid
    const isPhoneValid = () => phoneData.valid;

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (isSubmitting) return;

        // Admin: phone required
        if (!phoneData.valid) {
            setError('Please enter a valid phone number');
            return;
        }

        // Password is always required
        if (!password || password.trim().length === 0) {
            setError('Password is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const loginData = { password: password };
            loginData.phone = phoneData.fullNumber;

            await authService.login(loginData);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            if (otp.length < 6) {
                setError('Please enter complete OTP');
                return;
            }

            const verifyData = { otp };
            verifyData.phone = phoneData.fullNumber;

            const res = await authService.verifyOtp(verifyData);
            localStorage.setItem('token', res.token);

            // Decode token to validate role (and route)
            const decoded = jwtDecode(res.token);
            if (decoded.role !== 'admin') {
                localStorage.removeItem('token');
                setError('This portal is for admins only.');
                setStep(1);
                return;
            }
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'OTP Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center p-8 w-full">
            <div className="bg-white w-full max-w-[440px] p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-auto">
                <h2 className="m-0 mb-8 text-3xl font-bold text-center text-slate-900 tracking-tight">
                    Admin Portal
                </h2>
                {error && <p className="bg-red-50 border border-red-200 text-error py-3 px-4 rounded-xl text-sm text-center mb-4">{error}</p>}

                {step === 1 ? (
                    <>
                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">
                                    Phone Number <span className="text-error">*</span>
                                </label>
                                <PhoneInput
                                    onChange={setPhoneData}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Password <span className="text-error">*</span></label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mt-4 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-500">Don't have an account? </span>
                            <Link to="/register" className="text-primary font-semibold no-underline">
                                Register here
                            </Link>
                        </div>
                        {/* 
                           Admin panel is intentionally admin-only.
                        */}
                    </>
                ) : (
                    <form onSubmit={handleVerify} className="flex flex-col gap-5">
                        <p className="text-center text-slate-500 text-sm leading-relaxed">Enter the 6-digit code sent to your device.</p>
                        <div className="flex flex-col gap-2">
                            <OtpInput onChange={setOtp} />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-4 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                'Verify Access'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
