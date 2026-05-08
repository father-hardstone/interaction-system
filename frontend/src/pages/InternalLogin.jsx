import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import { officerService } from '../services/officerService';
import { entityService } from '../services/entityService';
import supabaseStorageService from '../services/supabaseService';
import { validateEmail } from '../utils/crypto';
import { jwtDecode } from 'jwt-decode';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key';

const encryptPassword = (password) => {
    if (!password) return password;
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

const DEFAULT_ENTITY_KEY = 'E2';

const InternalLogin = ({ embedded = false }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [entityKey, setEntityKey] = useState(DEFAULT_ENTITY_KEY);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Load entity key from localStorage on mount, default to E2
    useEffect(() => {
        const savedEntityKey = localStorage.getItem('entityKey');
        setEntityKey(savedEntityKey || DEFAULT_ENTITY_KEY);
    }, []);

    const isEmailValid = () => {
        if (!email || email.trim().length === 0) return false;
        const validation = validateEmail(email);
        return validation.valid;
    };

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

    const handleSubmit = async (e) => {
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

        if (!entityKey || entityKey.trim().length === 0) {
            setError('Entity key is required');
            return;
        }

        try {
            setIsSubmitting(true);
            // Encrypt password before sending
            const encryptedPassword = encryptPassword(password);

            const payload = {
                password: encryptedPassword,
                entityKey: entityKey.trim(),
                email: email.trim()
            };

            const res = await officerService.login(payload);
            localStorage.setItem('token', res.token);

            // Save entity key to localStorage for future logins
            localStorage.setItem('entityKey', entityKey.trim());

            const decoded = jwtDecode(res.token);

            // Store relevant data in localStorage
            localStorage.setItem('entityName', decoded.entityName || '');
            localStorage.setItem('userRole', decoded.role || '');
            localStorage.setItem('userName', decoded.name || '');
            const entityId = decoded.entityId || '';
            localStorage.setItem('entityId', entityId);
            localStorage.setItem('entitySerial', decoded.entitySerial || '');

            // Fetch and cache entity icon immediately after login
            if (entityId) {
                try {
                    const entityData = await entityService.getById(entityId);
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

            const entitySerial = decoded.entitySerial || decoded.serial;
            navigate(`/${entitySerial.toLowerCase()}/user/dashboard`);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const content = (
        <>
            {error && <p className="bg-red-500/10 border border-red-500/20 text-red-400 py-3 px-4 rounded-xl text-sm text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-3 flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-300">
                            Email Address <span className="text-error">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            className={`w-full py-3.5 px-4 border rounded-xl font-inherit text-base transition-all text-white ${emailError ? 'border-red-500/50 bg-red-500/5 focus:border-red-500 focus:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-red-500/10' : 'border-slate-700 bg-slate-800/50 focus:outline-none focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10'}`}
                        />
                        {emailError && <span className="text-red-400 text-sm">{emailError}</span>}
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-300">
                            Entity Key <span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., E1"
                            value={entityKey}
                            onChange={(e) => setEntityKey(e.target.value)}
                            required
                            className="w-full py-3.5 px-4 border border-slate-700 rounded-xl font-inherit text-base bg-slate-800/50 transition-all text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-300">Password <span className="text-error">*</span></label>
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
                    className="mt-4 py-4 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-none rounded-xl font-bold text-base cursor-pointer transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
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
        </>
    );

    if (embedded) return content;

    return (
        <div className="flex-1 flex items-center justify-center p-8 w-full">
            <div className="bg-white w-full max-w-[520px] p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-auto">
                <h2 className="m-0 mb-8 text-3xl font-semibold text-center text-slate-900 tracking-tight">
                    User Portal
                </h2>

                {content}

                <div className="mt-6 text-center text-sm">
                    <Link to="/" className="text-slate-500 font-bold no-underline hover:text-cyan-400 transition-colors">
                        Back to main portal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default InternalLogin;

