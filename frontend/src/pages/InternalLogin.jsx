import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from '../components/PhoneInput';
import { officerService } from '../services/officerService';
import { validateEmail } from '../utils/crypto';
import { jwtDecode } from 'jwt-decode';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key';

const encryptPassword = (password) => {
    if (!password) return password;
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

const InternalLogin = () => {
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [entityKey, setEntityKey] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Load entity key from localStorage on mount
    useEffect(() => {
        const savedEntityKey = localStorage.getItem('entityKey');
        if (savedEntityKey) {
            setEntityKey(savedEntityKey);
        }
    }, []);

    const isEmailValid = () => {
        if (!email || email.trim().length === 0) return false;
        const validation = validateEmail(email);
        return validation.valid;
    };

    const isPhoneValid = () => phoneData.valid;

    const hasValidIdentifier = () => isEmailValid() || isPhoneValid();

    const isEmailRequired = () => !isPhoneValid();
    const isPhoneRequired = () => !isEmailValid();

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

        if (!hasValidIdentifier()) {
            setError('Please enter either a valid email address or phone number');
            return;
        }

        if (email.trim().length > 0) {
            const emailValidation = validateEmail(email);
            if (!emailValidation.valid) {
                setEmailError(emailValidation.error);
                return;
            }
        }

        if (phoneData.fullNumber && !phoneData.valid) {
            setError('Please enter a valid phone number');
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
            // Encrypt password before sending
            const encryptedPassword = encryptPassword(password);
            
            const payload = {
                password: encryptedPassword,
                entityKey: entityKey.trim()
            };

            if (isEmailValid()) {
                payload.email = email.trim();
            } else if (isPhoneValid()) {
                payload.phone = phoneData.fullNumber;
            }

            const res = await officerService.login(payload);
            localStorage.setItem('token', res.token);
            
            // Save entity key to localStorage for future logins
            localStorage.setItem('entityKey', entityKey.trim());

            const decoded = jwtDecode(res.token);
            const entitySerial = decoded.entitySerial || decoded.serial;
            navigate(`/${entitySerial.toLowerCase()}/user/dashboard`);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-8 w-full">
            <div className="bg-white w-full max-w-[520px] p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-auto">
                <h2 className="m-0 mb-8 text-3xl font-bold text-center text-slate-900 tracking-tight">
                    User Portal
                </h2>
                {error && <p className="bg-red-50 border border-red-200 text-error py-3 px-4 rounded-xl text-sm text-center mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-900">
                            Email Address {isEmailRequired() && <span className="text-error">*</span>}
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            value={email}
                            onChange={handleEmailChange}
                            required={isEmailRequired()}
                            className={`w-full py-3.5 px-4 border rounded-xl font-inherit text-base transition-all text-slate-900 ${emailError ? 'border-error bg-red-50 focus:border-error focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100' : 'border-slate-200 bg-slate-50 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100'}`}
                        />
                        {emailError && <span className="text-error text-sm">{emailError}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-900">
                            Phone Number {isPhoneRequired() && <span className="text-error">*</span>}
                            {!isPhoneRequired() && <span className="text-slate-500 text-sm font-normal"> (Optional if email is provided)</span>}
                        </label>
                        <PhoneInput
                            onChange={setPhoneData}
                            required={isPhoneRequired()}
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

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-slate-900">Entity Key <span className="text-error">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter your entity key (e.g., E1)"
                            value={entityKey}
                            onChange={(e) => setEntityKey(e.target.value)}
                            required
                            className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <button type="submit" className="mt-4 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40">
                        Login
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <Link to="/" className="text-primary font-semibold no-underline">
                        Back to main portal
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default InternalLogin;

