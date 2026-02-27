import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { officerService } from '../services/officerService';
import { useToast } from '../contexts/ToastContext';

const UserSettings = () => {
    const { serial } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const fileInputRef = useRef(null);

    const dashboardPath = useMemo(() => (serial ? `/${serial}/user/dashboard` : '#'), [serial]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [touched, setTouched] = useState({
        firstName: false,
        middleName: false,
        lastName: false,
        email: false,
        billingNumber: false,
        cpsoNumber: false
    });

    const [initial, setInitial] = useState(null);

    const splitNameParts = (raw) => {
        const s = String(raw || '').trim();
        if (!s) return { firstName: '', middleName: '', lastName: '' };

        // Support "Last, First Middle" format if present
        if (s.includes(',')) {
            const [lastPart, restPart] = s.split(',');
            const lastName = (lastPart || '').trim();
            const restTokens = (restPart || '').trim().split(/\s+/).filter(Boolean);
            const firstName = restTokens[0] || '';
            const middleName = restTokens.slice(1).join(' ');
            return { firstName, middleName, lastName };
        }

        const tokens = s.split(/\s+/).filter(Boolean);
        if (tokens.length === 1) return { firstName: tokens[0], middleName: '', lastName: '' };
        if (tokens.length === 2) return { firstName: tokens[0], middleName: '', lastName: tokens[1] };

        return {
            firstName: tokens[0],
            middleName: tokens.slice(1, -1).join(' '),
            lastName: tokens[tokens.length - 1]
        };
    };

    const buildFullName = ({ firstName, middleName, lastName }) =>
        [firstName, middleName, lastName].map((p) => String(p || '').trim()).filter(Boolean).join(' ');

    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [billingNumber, setBillingNumber] = useState('');
    const [cpsoNumber, setCpsoNumber] = useState('');
    const [profilePicture, setProfilePicture] = useState('');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await officerService.getMe();
                const user = data?.user || {};
                if (cancelled) return;
                const parts = splitNameParts(user.name || '');
                setFirstName(parts.firstName);
                setMiddleName(parts.middleName);
                setLastName(parts.lastName);
                setEmail(user.email || '');
                setBillingNumber(user.billingNumber || '');
                setCpsoNumber(user.cpsoNumber || '');
                setProfilePicture(user.profilePicture || '');
                setInitial({
                    firstName: parts.firstName,
                    middleName: parts.middleName,
                    lastName: parts.lastName,
                    email: user.email || '',
                    billingNumber: user.billingNumber || '',
                    cpsoNumber: user.cpsoNumber || '',
                    profilePicture: user.profilePicture || ''
                });
            } catch (e) {
                if (!cancelled) {
                    toast?.showToast?.('Failed to load profile settings', 'error');
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [toast]);

    const trim = (v) => String(v || '').trim();
    const isEmpty = (v) => trim(v) === '';

    const validation = useMemo(() => {
        const errors = {};
        if (isEmpty(firstName)) errors.firstName = 'Required';
        if (isEmpty(lastName)) errors.lastName = 'Required';
        if (isEmpty(email)) errors.email = 'Required';

        if (isEmpty(billingNumber)) errors.billingNumber = 'Required';
        else if (String(billingNumber).length !== 6) errors.billingNumber = 'Must be 6 digits';

        if (isEmpty(cpsoNumber)) errors.cpsoNumber = 'Required';
        else if (String(cpsoNumber).length !== 5) errors.cpsoNumber = 'Must be 5 digits';

        return errors;
    }, [firstName, middleName, lastName, email, billingNumber, cpsoNumber]);

    const showError = (key) => (hasSubmitted || touched[key]) && !!validation[key];

    const isDirty = !!initial && (
        firstName !== initial.firstName ||
        middleName !== initial.middleName ||
        lastName !== initial.lastName ||
        billingNumber !== initial.billingNumber ||
        cpsoNumber !== initial.cpsoNumber ||
        profilePicture !== initial.profilePicture
    );

    const onCancel = () => {
        if (initial) {
            setFirstName(initial.firstName);
            setMiddleName(initial.middleName);
            setLastName(initial.lastName);
            setEmail(initial.email);
            setBillingNumber(initial.billingNumber);
            setCpsoNumber(initial.cpsoNumber);
            setProfilePicture(initial.profilePicture);
        }
        if (serial) navigate(dashboardPath);
        else navigate(-1);
    };

    const onPickImage = () => fileInputRef.current?.click();
    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast?.showToast?.('Please select an image file', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const v = reader.result;
            if (typeof v === 'string') setProfilePicture(v);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const onSave = async () => {
        setHasSubmitted(true);
        if (Object.keys(validation).length > 0) {
            toast?.showToast?.('Please fill all required fields', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const name = buildFullName({ firstName, middleName, lastName });
            const data = await officerService.updateMe({
                name,
                billingNumber,
                cpsoNumber,
                profilePicture
            });
            if (data?.token) {
                localStorage.setItem('token', data.token);
            }
            const user = data?.user;
            if (user) {
                const parts = splitNameParts(user.name || '');
                setFirstName(parts.firstName);
                setMiddleName(parts.middleName);
                setLastName(parts.lastName);
                setEmail(user.email || '');
                setBillingNumber(user.billingNumber || '');
                setCpsoNumber(user.cpsoNumber || '');
                setProfilePicture(user.profilePicture || '');
                setInitial({
                    firstName: parts.firstName,
                    middleName: parts.middleName,
                    lastName: parts.lastName,
                    email: user.email || '',
                    billingNumber: user.billingNumber || '',
                    cpsoNumber: user.cpsoNumber || '',
                    profilePicture: user.profilePicture || ''
                });
            }
            toast?.showToast?.('Profile settings updated', 'success');
        } catch (e) {
            toast?.showToast?.('Failed to update profile settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] relative overflow-x-hidden">
            <main className="flex-1 flex flex-col min-h-0 overflow-x-hidden overflow-y-auto bg-slate-50">
                <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 lg:p-10">
                    <div className="w-full flex justify-start mb-4">
                        <button
                            type="button"
                            onClick={() => (serial ? navigate(dashboardPath) : navigate(-1))}
                            disabled={isSaving}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border text-sm font-semibold transition-colors ${
                                isSaving
                                    ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                            aria-label="Back to dashboard"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    </div>

                    <div className="w-full max-w-3xl mx-auto">
                        <h1 className="text-2xl font-semibold text-slate-900">Profile settings</h1>
                        <p className="text-slate-600 mt-1 mb-6">
                            Update your profile details used for billing and identification.
                        </p>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative">
                                    <div className="w-28 h-28 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                        {profilePicture ? (
                                            <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onPickImage}
                                        disabled={isLoading || isSaving}
                                        className="absolute -left-1 top-[56%] -translate-y-1/2 w-9 h-9 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                                        aria-label="Edit profile image"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={onFileChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="py-10 flex flex-col items-center justify-center gap-3">
                                    <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <p className="text-sm font-semibold text-slate-500">Loading profile settings…</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Row 1: Last | First | Middle */}
                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-500 tracking-wide mb-1">
                                            Last name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                                showError('lastName') ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'
                                            }`}
                                            placeholder="Last name"
                                            autoComplete="family-name"
                                        />
                                        {showError('lastName') && <p className="text-xs text-red-600 mt-1">{validation.lastName}</p>}
                                    </div>

                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-500 tracking-wide mb-1">
                                            First name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                                showError('firstName') ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'
                                            }`}
                                            placeholder="First name"
                                            autoComplete="given-name"
                                        />
                                        {showError('firstName') && <p className="text-xs text-red-600 mt-1">{validation.firstName}</p>}
                                    </div>

                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-500 tracking-wide mb-1">
                                            Middle name <span className="text-slate-400">(optional)</span>
                                        </label>
                                        <input
                                            value={middleName}
                                            onChange={(e) => setMiddleName(e.target.value)}
                                            onBlur={() => setTouched((t) => ({ ...t, middleName: true }))}
                                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                                'border-slate-200'
                                            }`}
                                            placeholder="Middle name"
                                            autoComplete="additional-name"
                                        />
                                    </div>

                                    {/* Row 2: Email | Billing | CPSO */}
                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-500 tracking-wide mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={email}
                                            disabled
                                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                                            className={`w-full px-4 py-3 rounded-xl border text-slate-500 cursor-not-allowed ${
                                                showError('email') ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                                            }`}
                                            placeholder="Email"
                                            autoComplete="email"
                                        />
                                        {showError('email') && <p className="text-xs text-red-600 mt-1">{validation.email}</p>}
                                    </div>

                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-500 tracking-wide mb-1">
                                            Billing number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={billingNumber}
                                            onChange={(e) => {
                                                const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 6);
                                                setBillingNumber(digits);
                                            }}
                                            onBlur={() => setTouched((t) => ({ ...t, billingNumber: true }))}
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={6}
                                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                                showError('billingNumber') ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'
                                            }`}
                                            placeholder="000000"
                                        />
                                        {showError('billingNumber') && <p className="text-xs text-red-600 mt-1">{validation.billingNumber}</p>}
                                    </div>

                                    <div className="min-w-0">
                                        <label className="block text-xs font-semibold text-slate-500 tracking-wide mb-1">
                                            CPSO number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={cpsoNumber}
                                            onChange={(e) => {
                                                const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 5);
                                                setCpsoNumber(digits);
                                            }}
                                            onBlur={() => setTouched((t) => ({ ...t, cpsoNumber: true }))}
                                            inputMode="numeric"
                                            pattern="\d*"
                                            maxLength={5}
                                            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                                showError('cpsoNumber') ? 'border-red-300 focus:ring-red-200' : 'border-slate-200'
                                            }`}
                                            placeholder="00000"
                                        />
                                        {showError('cpsoNumber') && <p className="text-xs text-red-600 mt-1">{validation.cpsoNumber}</p>}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    disabled={isSaving}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={isLoading || isSaving || !isDirty}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 ${
                                        (isLoading || isSaving || !isDirty)
                                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isSaving ? (
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving…
                                        </span>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserSettings;
