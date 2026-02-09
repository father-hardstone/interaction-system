import { useState } from 'react';
import { authService } from '../services/authService';
import { entityService } from '../services/entityService';
import supabaseStorageService from '../services/supabaseService';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import OtpInput from '../components/OtpInput';
import PasswordInput from '../components/PasswordInput';
import { hashPassword } from '../utils/crypto';
import { validateEmail } from '../utils/crypto';
import { jwtDecode } from 'jwt-decode';

const Login = ({ type = 'admin' }) => {
    const isEntity = type === 'entity';
    const [step, setStep] = useState(1);
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const getService = () => isEntity ? entityService : authService;


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

        // For admin, phone is always required
        if (!isEntity) {
            if (!phoneData.valid) {
                setError('Please enter a valid phone number');
                return;
            }
        } else {
            // For entity, email is required
            if (!email || email.trim().length === 0) {
                setError('Please enter your email address');
                return;
            }
            const emailValidation = validateEmail(email);
            if (!emailValidation.valid) {
                setEmailError(emailValidation.error);
                return;
            }
        }

        // Password is always required
        if (!password || password.trim().length === 0) {
            setError('Password is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const loginData = { password: password };
            if (isEntity) {
                loginData.email = email.trim();
            } else {
                loginData.phone = phoneData.fullNumber;
            }

            await getService().login(loginData);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);
            if (otp.length < 6) {
                setError('Please enter complete OTP');
                return;
            }

            const verifyData = { otp };
            if (isEntity) {
                verifyData.email = email.trim();
            } else {
                verifyData.phone = phoneData.fullNumber;
            }

            const res = await getService().verifyOtp(verifyData);
            localStorage.setItem('token', res.token);

            if (isEntity) {
                // Decode token to get serial for URL
                const decoded = jwtDecode(res.token);
                const entityId = decoded.id || '';
                // Store relevant data in localStorage
                localStorage.setItem('entityName', decoded.name || decoded.entityName || '');
                localStorage.setItem('userRole', 'entity');
                localStorage.setItem('userName', decoded.name || '');
                localStorage.setItem('entityId', entityId);
                localStorage.setItem('entitySerial', decoded.serial || '');

                // Fetch and cache entity icon immediately after login
                if (entityId) {
                    try {
                        const entityData = await entityService.getSettings();
                        if (entityData.icon && !entityData.icon.startsWith('data:image') && !entityData.icon.startsWith('http')) {
                            const url = await supabaseStorageService.getFileUrl('CRM testing', entityData.icon);
                            if (url) {
                                const cacheKey = `entityIcon_${entityId}`;
                                localStorage.setItem(cacheKey, url);
                                localStorage.setItem('cachedEntityId', entityId);
                            }
                        } else if (entityData.icon && (entityData.icon.startsWith('http') || entityData.icon.startsWith('data:image'))) {
                            const cacheKey = `entityIcon_${entityId}`;
                            localStorage.setItem(cacheKey, entityData.icon);
                            localStorage.setItem('cachedEntityId', entityId);
                        }
                    } catch (err) {
                        // Silently fail - icon will be fetched by NavBar if needed
                        console.error('Failed to preload entity icon:', err);
                    }
                }

                navigate(`/entity/${decoded.serial.toLowerCase()}/dashboard`);
            } else {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'OTP Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex-1 flex items-center justify-center p-8 w-full">
            <div className={`bg-white w-full ${isEntity ? 'max-w-[520px]' : 'max-w-[440px]'} p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-auto`}>
                <h2 className="m-0 mb-8 text-3xl font-semibold text-center text-slate-900 tracking-tight">
                    {isEntity ? 'Entity Portal' : 'Admin Portal'}
                </h2>
                {error && <p className="bg-red-50 border border-red-200 text-error py-3 px-4 rounded-xl text-sm text-center mb-4">{error}</p>}

                {step === 1 ? (
                    <>
                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            {isEntity && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Email Address <span className="text-error">*</span></label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={handleEmailChange}
                                        required
                                        className={`w-full py-3.5 px-4 border rounded-xl font-inherit text-base transition-all text-slate-900 ${emailError ? 'border-error bg-red-50 focus:border-error focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100' : 'border-slate-200 bg-slate-50 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100'}`}
                                    />
                                    {emailError && <span className="text-error text-sm">{emailError}</span>}
                                </div>
                            )}

                            {!isEntity && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone Number <span className="text-error">*</span></label>
                                    <PhoneInput
                                        onChange={setPhoneData}
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Password <span className="text-error">*</span></label>
                                <PasswordInput
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
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

                        {!isEntity && (
                            <div className="mt-6 text-center text-sm">
                                <span className="text-slate-500">Don't have an account? </span>
                                <Link to="/register" className="text-primary font-semibold no-underline">
                                    Register here
                                </Link>
                            </div>
                        )}
                        {/* 
                           Note: Entities usually register themselves via a different flow or also use /register? 
                           The current /register page creates Admins. 
                           The prompt implies a general register link. 
                           If Entity registration is needed publicly, we might need a separate page or toggle.
                           For now, the prompt asked to add the link. Since /register creates Admins, I'll only show it for Admin login or clarify it.
                           Actually, the user said "create a admin login and register flow" initially. 
                           Later "create another login and sign in route for entity... controls for creating... entities on admin dashboard".
                           But also "if an entity is created by themselves, i.e. registered".
                           So Entity Registration page is needed?
                           Let's assume /register is for Admins for now as built previously. 
                           If the user is on Entity login, maybe they shouldn't see Admin register? 
                           I'll hide it for Entity for now unless requested to separate Entity Registration page.
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

                {isEntity && (
                    <div className="mt-6 text-center text-sm">
                        <Link to="/" className="text-primary font-semibold no-underline">
                            Back to main portal
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
