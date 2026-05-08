import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import PhoneInput from '../components/PhoneInput';
import { getVisitorSerialDisplay } from '../utils/formatUtils';

const PatientOnboardingPage = () => {
    const { token, entitySerial } = useParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [visitor, setVisitor] = useState(null);
    const [error, setError] = useState(null);

    // Modal-identical states
    const [visitorForm, setVisitorForm] = useState({
        lastName: '',
        firstName: '',
        middleName: '',
        dateOfBirth: '',
        gender: '',
        addressLine: '',
        city: '',
        state: '',
        postalCode: '',
        email: '',
        allergies: '',
        drugReactions: '',
        ongoingHealthConditions: '',
        specialNotes: '',
        emergencyName: '',
        emergencyRelation: '',
        notes: '',
        memo: '',
        highBloodPressure: '',
        heartDisease: '',
        diabetes: '',
        cholesterol: '',
        smoke: ''
    });

    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false, raw: '' });
    const [phoneHData, setPhoneHData] = useState({ fullNumber: '', valid: false, raw: '' });
    const [phoneMData, setPhoneMData] = useState({ fullNumber: '', valid: false, raw: '' });
    const [guardianPhoneData, setGuardianPhoneData] = useState({ fullNumber: '', valid: false, raw: '' });
    
    const [healthCardNumber, setHealthCardNumber] = useState('');
    const [healthCardVersion, setHealthCardVersion] = useState('');
    const [healthCardEffectivityDate, setHealthCardEffectivityDate] = useState('');
    const [healthCardExpiryDate, setHealthCardExpiryDate] = useState('');

    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        const fetchVisitor = async () => {
            try {
                const res = await api.get(`/visitors/onboarding/${entitySerial}/${token}`);
                setVisitor(res.data);
                // Pre-fill if needed
                if (res.data) {
                    setVisitorForm(prev => ({
                        ...prev,
                        firstName: res.data.firstName || '',
                        lastName: res.data.lastName || '',
                        middleName: res.data.middleName || '',
                        dateOfBirth: res.data.dateOfBirth || '',
                        gender: res.data.gender || '',
                        addressLine: res.data.addressLine || '',
                        city: res.data.city || '',
                        state: res.data.state || '',
                        postalCode: res.data.postalCode || '',
                        email: res.data.email || '',
                        highBloodPressure: res.data.highBloodPressure || '',
                        heartDisease: res.data.heartDisease || '',
                        diabetes: res.data.diabetes || '',
                        cholesterol: res.data.cholesterol || '',
                        smoke: res.data.smoke || ''
                    }));
                    if (res.data.phoneM) setPhoneMData({ fullNumber: res.data.phoneM, valid: true, raw: res.data.phoneM });
                    if (res.data.phoneB) setPhoneData({ fullNumber: res.data.phoneB, valid: true, raw: res.data.phoneB });
                    if (res.data.phoneH) setPhoneHData({ fullNumber: res.data.phoneH, valid: true, raw: res.data.phoneH });
                    if (res.data.healthCardNumber) setHealthCardNumber(res.data.healthCardNumber);
                    if (res.data.healthCardVersion) setHealthCardVersion(res.data.healthCardVersion);
                }
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.error || 'Invalid or expired link.');
                setLoading(false);
            }
        };
        fetchVisitor();
    }, [token, entitySerial]);

    const handlePostalChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
        value = value.slice(0, 7);
        setVisitorForm({ ...visitorForm, postalCode: value });
        const postalMask = /^[A-Za-z]\d[A-Za-z]-\d[A-Za-z]\d$/;
        if (!value.trim()) setFieldErrors(prev => ({ ...prev, postalCode: 'Postal code is required' }));
        else if (value.length === 7 && !postalMask.test(value)) setFieldErrors(prev => ({ ...prev, postalCode: 'Must be format A1B-2C3' }));
        else setFieldErrors(prev => { const n = { ...prev }; delete n.postalCode; return n; });
    };

    const handleHealthCardChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4);
        if (value.length > 8) value = value.slice(0, 8) + '-' + value.slice(8);
        setHealthCardNumber(value);
        if (!value.trim()) setFieldErrors(prev => ({ ...prev, healthCard: 'HC is required' }));
        else if (value.replace(/-/g, '').length !== 10) setFieldErrors(prev => ({ ...prev, healthCard: 'Must be 10 digits' }));
        else setFieldErrors(prev => { const n = { ...prev }; delete n.healthCard; return n; });
    };

    const onHealthCardVersionChange = (e) => {
        const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
        setHealthCardVersion(val);
        if (!val.trim()) setFieldErrors(prev => ({ ...prev, healthCardVersion: 'Version is required' }));
        else setFieldErrors(prev => { const n = { ...prev }; delete n.healthCardVersion; return n; });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation check
        const errors = {};
        if (!visitorForm.lastName) errors.lastName = 'Last name is required';
        if (!visitorForm.firstName) errors.firstName = 'First name is required';
        if (!visitorForm.dateOfBirth) errors.dob = 'DOB is required';
        if (!healthCardNumber) errors.healthCard = 'HC is required';
        if (!healthCardVersion) errors.healthCardVersion = 'Version is required';
        if (!visitorForm.gender) errors.gender = 'Sex is required';
        if (!phoneMData.fullNumber) errors.phoneM = 'Phone (M) is required';
        if (!visitorForm.addressLine) errors.street = 'Street is required';
        if (!visitorForm.city) errors.city = 'City is required';
        if (!visitorForm.state) errors.state = 'Province is required';
        if (!visitorForm.postalCode) errors.postalCode = 'Postal code is required';

        // PMH check
        if (!visitorForm.highBloodPressure || !visitorForm.heartDisease || !visitorForm.diabetes || !visitorForm.cholesterol || !visitorForm.smoke) {
            errors.pastMedicalHistory = 'Please complete all PMH indicators';
        }

        // Health card date validation
        if (healthCardEffectivityDate && healthCardExpiryDate) {
            const eff = new Date(healthCardEffectivityDate);
            const exp = new Date(healthCardExpiryDate);
            if (exp < eff) {
                errors.healthCard = 'Expiry date cannot be before issue date';
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const firstError = Object.values(errors)[0];
            showToast(firstError, 'error');
            return;
        }

        setSubmitting(true);
        try {
            const finalData = {
                ...visitorForm,
                healthCardNumber,
                healthCardVersion,
                healthCardEffectivityDate,
                healthCardExpiryDate,
                phoneM: phoneMData.fullNumber,
                phoneB: phoneData.fullNumber,
                phoneH: phoneHData.fullNumber,
                guardianPhone: guardianPhoneData.fullNumber
            };
            await api.post(`/visitors/onboarding/${entitySerial}/${token}/submit`, finalData);
            showToast('Information submitted successfully!', 'success');
            setVisitor(null); 
        } catch (err) {
            showToast(err.response?.data?.error || 'Submission failed.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const PublicTopBar = () => (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-6 flex justify-between items-center bg-slate-900/40 backdrop-blur-md border-b border-white/5">
            <div className="flex flex-col origin-left scale-90 sm:scale-100">
                <div className="text-3xl font-black tracking-tighter text-white leading-none">
                    MEDI<span className="text-cyan-400">NET</span>
                </div>
                <div className="text-[10px] font-bold text-cyan-500 tracking-[0.3em] uppercase mt-1">
                    Onboarding Portal
                </div>
            </div>
        </nav>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050a12] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#050a12] flex flex-col relative overflow-hidden">
                <PublicTopBar />
                <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
                <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.876c1.27 0 2.09-1.383 1.45-2.43L13.732 4c-.64-1.047-2.05-1.047-2.692 0L3.062 16.57c-.64 1.047.18 2.43 1.45 2.43z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Registration Link Error</h1>
                        <p className="text-slate-400 mb-6">{error}</p>
                        <button onClick={() => window.close()} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-slate-700">
                            Close Window
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!visitor) {
        return (
            <div className="min-h-screen bg-[#050a12] flex flex-col relative overflow-hidden">
                <PublicTopBar />
                <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
                <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Submission Complete</h1>
                        <p className="text-slate-400 mb-6">Your information has been securely transmitted. A clinic representative will review your profile shortly.</p>
                        <button onClick={() => window.close()} className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20">
                            Close Window
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050a12] flex flex-col relative overflow-hidden">
            <PublicTopBar />
            
            {/* Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

            <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 relative z-10">
                <div className="max-w-[800px] mx-auto">
                    <header className="mb-10 text-center">
                        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                            Patient <span className="text-cyan-400">Onboarding</span>
                        </h1>
                        <p className="mt-4 text-slate-400 text-lg">
                            Welcome to {visitor.entityName || 'our clinic'}. Please complete your registration below.
                        </p>
                    </header>

                    <div className="bg-white w-full p-6 sm:p-8 rounded-[2.5rem] shadow-2xl shadow-cyan-950/40">
                        {/* Identical Form Header Style */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Registration Form</h2>
                            <div className="flex-1 min-w-0 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-semibold text-blue-900">Temp ID:</span>
                                <span className="text-sm font-semibold text-blue-700 font-sans">
                                    {getVisitorSerialDisplay(visitor)}
                                </span>
                            </div>
                        </div>

                        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Line 1: Names + DOB + Age */}
                            {(() => {
                                const rowHasError = fieldErrors.lastName || fieldErrors.firstName || fieldErrors.dob;
                                return (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.15fr_0.65fr] gap-3">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Last Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                value={visitorForm.lastName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, lastName: val });
                                                    if (!val.trim()) setFieldErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.lastName; return n; });
                                                }}
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            {fieldErrors.lastName && <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">First Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                value={visitorForm.firstName}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setVisitorForm({ ...visitorForm, firstName: val });
                                                    if (!val.trim()) setFieldErrors(prev => ({ ...prev, firstName: 'First name is required' }));
                                                    else setFieldErrors(prev => { const n = { ...prev }; delete n.firstName; return n; });
                                                }}
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            {fieldErrors.firstName && <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Middle Name</label>
                                            <input
                                                type="text"
                                                placeholder="Middle name"
                                                value={visitorForm.middleName}
                                                onChange={(e) => setVisitorForm({ ...visitorForm, middleName: e.target.value })}
                                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Date of Birth <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={visitorForm.dateOfBirth ? (() => {
                                                    const parts = visitorForm.dateOfBirth.split('-');
                                                    if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                                                    return '';
                                                })() : ''}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    const dateValue = e.target.value;
                                                    if (dateValue) {
                                                        const parts = dateValue.split('-');
                                                        const formatted = `${parts[1]}-${parts[2]}-${parts[0]}`;
                                                        setVisitorForm({ ...visitorForm, dateOfBirth: formatted });
                                                        setFieldErrors(prev => { const n = { ...prev }; delete n.dob; return n; });
                                                    } else {
                                                        setVisitorForm({ ...visitorForm, dateOfBirth: '' });
                                                        setFieldErrors(prev => ({ ...prev, dob: 'Date of birth is required' }));
                                                    }
                                                }}
                                                className={`w-full py-2.5 px-3.5 border ${fieldErrors.dob ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                            />
                                            {fieldErrors.dob && <p className="text-red-500 text-xs">{fieldErrors.dob}</p>}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Age</label>
                                            <input
                                                type="text"
                                                value={(() => {
                                                    if (!visitorForm.dateOfBirth) return '';
                                                    const parts = visitorForm.dateOfBirth.split('-');
                                                    if (parts.length !== 3) return '';
                                                    const month = parseInt(parts[0], 10) - 1;
                                                    const day = parseInt(parts[1], 10);
                                                    const year = parseInt(parts[2], 10);
                                                    const dob = new Date(year, month, day);
                                                    const today = new Date();
                                                    let years = today.getFullYear() - dob.getFullYear();
                                                    let months = today.getMonth() - dob.getMonth();
                                                    if (today.getDate() < dob.getDate()) months--;
                                                    if (months < 0) { years--; months += 12; }
                                                    if (isNaN(years) || years < 0) return '';
                                                    if (years === 0) return `${months} mo`;
                                                    return months > 0 ? `${years} yr ${months} mo` : `${years} yr`;
                                                })()}
                                                readOnly
                                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Line 2: HC + Dates + Sex */}
                            <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-3">
                                <div className="w-full md:w-44 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">HC <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="XXXX-XXX-XXX"
                                        value={healthCardNumber}
                                        onChange={handleHealthCardChange}
                                        maxLength={12}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCard ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.healthCard && <p className="text-red-500 text-xs">{fieldErrors.healthCard}</p>}
                                </div>
                                <div className="w-full md:w-20 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Version <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="AB"
                                        value={healthCardVersion}
                                        onChange={onHealthCardVersionChange}
                                        maxLength={2}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCardVersion ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.healthCardVersion && <p className="text-red-500 text-xs">{fieldErrors.healthCardVersion}</p>}
                                </div>
                                <div className="w-full md:w-40 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Issue Date</label>
                                    <input
                                        type="date"
                                        value={healthCardEffectivityDate || ''}
                                        onChange={(e) => setHealthCardEffectivityDate(e.target.value)}
                                        className={`w-full py-2.5 px-3.5 border border-slate-200 bg-slate-50 rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                </div>
                                <div className="w-full md:w-40 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={healthCardExpiryDate || ''}
                                        onChange={(e) => setHealthCardExpiryDate(e.target.value)}
                                        className={`w-full py-2.5 px-3.5 border border-slate-200 bg-slate-50 rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                </div>
                                <div className="w-full md:w-auto flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Sex <span className="text-red-500">*</span></label>
                                    <div className="flex flex-row gap-4 items-center py-1">
                                        {['M', 'F', 'O'].map((opt) => (
                                            <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="sex"
                                                    value={opt}
                                                    checked={visitorForm.gender === opt}
                                                    onChange={() => {
                                                        setVisitorForm({ ...visitorForm, gender: opt });
                                                        setFieldErrors(prev => { const n = { ...prev }; delete n.gender; return n; });
                                                    }}
                                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-bold text-slate-700">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {fieldErrors.gender && <p className="text-red-500 text-xs">{fieldErrors.gender}</p>}
                                </div>
                            </div>

                            {/* Phones & Email */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.5fr] gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (M) <span className="text-red-500">*</span></label>
                                    <PhoneInput value={phoneMData.fullNumber} onChange={setPhoneMData} />
                                    {fieldErrors.phoneM && <p className="text-red-500 text-xs">{fieldErrors.phoneM}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (B)</label>
                                    <PhoneInput value={phoneData.fullNumber} onChange={setPhoneData} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (H)</label>
                                    <PhoneInput value={phoneHData.fullNumber} onChange={setPhoneHData} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={visitorForm.email}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_0.8fr] gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Street <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Street address"
                                        value={visitorForm.addressLine}
                                        onChange={(e) => {
                                            setVisitorForm({ ...visitorForm, addressLine: e.target.value });
                                            setFieldErrors(prev => { const n = { ...prev }; delete n.street; return n; });
                                        }}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.street ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.street && <p className="text-red-500 text-xs">{fieldErrors.street}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">City <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={visitorForm.city}
                                        onChange={(e) => {
                                            setVisitorForm({ ...visitorForm, city: e.target.value });
                                            setFieldErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                                        }}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.city && <p className="text-red-500 text-xs">{fieldErrors.city}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Province <span className="text-red-500">*</span></label>
                                    <select
                                        value={visitorForm.state}
                                        onChange={(e) => {
                                            setVisitorForm({ ...visitorForm, state: e.target.value });
                                            setFieldErrors(prev => { const n = { ...prev }; delete n.state; return n; });
                                        }}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.state ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    >
                                        <option value="">Select province</option>
                                        <option value="Alberta">Alberta</option>
                                        <option value="British Columbia">British Columbia</option>
                                        <option value="Manitoba">Manitoba</option>
                                        <option value="New Brunswick">New Brunswick</option>
                                        <option value="Newfoundland and Labrador">Newfoundland and Labrador</option>
                                        <option value="Northwest Territories">Northwest Territories</option>
                                        <option value="Nova Scotia">Nova Scotia</option>
                                        <option value="Nunavut">Nunavut</option>
                                        <option value="Ontario">Ontario</option>
                                        <option value="Prince Edward Island">Prince Edward Island</option>
                                        <option value="Quebec">Quebec</option>
                                        <option value="Saskatchewan">Saskatchewan</option>
                                        <option value="Yukon">Yukon</option>
                                    </select>
                                    {fieldErrors.state && <p className="text-red-500 text-xs">{fieldErrors.state}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Postal Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="A1B-2C3"
                                        value={visitorForm.postalCode}
                                        onChange={handlePostalChange}
                                        maxLength={7}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.postalCode ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    {fieldErrors.postalCode && <p className="text-red-500 text-xs">{fieldErrors.postalCode}</p>}
                                </div>
                            </div>

                            {/* Clinical Info - Red Highlighter */}
                            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-5 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-red-900">Allergies</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            value={visitorForm.allergies}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, allergies: e.target.value })}
                                            className="w-full py-3 px-4 border border-red-200 bg-white rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-red-900">Type of Reaction</label>
                                        <input
                                            type="text"
                                            placeholder="Optional"
                                            value={visitorForm.drugReactions}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, drugReactions: e.target.value })}
                                            className="w-full py-3 px-4 border border-red-200 bg-white rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-red-900">Special Notes</label>
                                        <textarea
                                            rows="2"
                                            placeholder="Any other critical health information..."
                                            value={visitorForm.specialNotes}
                                            onChange={(e) => setVisitorForm({ ...visitorForm, specialNotes: e.target.value })}
                                            className="w-full py-3 px-4 border border-red-200 bg-white rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* PMH */}
                            <div className="rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6 mt-4">
                                <label className="text-lg font-bold text-slate-900 block mb-4">Past Medical History <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { key: 'highBloodPressure', label: 'High BP' },
                                        { key: 'heartDisease', label: 'Heart disease' },
                                        { key: 'diabetes', label: 'Diabetes' },
                                        { key: 'cholesterol', label: 'Cholesterol' },
                                        { key: 'smoke', label: 'Smoke' }
                                    ].map(({ key, label }) => (
                                        <div key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                                            <span className="text-sm font-bold text-slate-700">{label}</span>
                                            <div className="flex items-center gap-3">
                                                {['yes', 'no'].map(opt => (
                                                    <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name={key}
                                                            value={opt}
                                                            checked={visitorForm[key] === opt}
                                                            onChange={() => {
                                                                setVisitorForm({ ...visitorForm, [key]: opt });
                                                                setFieldErrors(prev => { const n = { ...prev }; delete n.pastMedicalHistory; return n; });
                                                            }}
                                                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 uppercase">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {fieldErrors.pastMedicalHistory && <p className="text-red-500 text-xs mt-3">{fieldErrors.pastMedicalHistory}</p>}
                            </div>

                            {/* Emergency Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1.2fr] gap-3 mt-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Emergency Name</label>
                                    <input
                                        type="text"
                                        placeholder="Contact name"
                                        value={visitorForm.emergencyName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, emergencyName: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Relation</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Spouse"
                                        value={visitorForm.emergencyRelation}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, emergencyRelation: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Emergency Contact (M)</label>
                                    <PhoneInput value={guardianPhoneData.fullNumber} onChange={setGuardianPhoneData} />
                                </div>
                            </div>

                            <div className="pt-10 border-t border-slate-100 mt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <p className="text-slate-400 text-sm italic">
                                    * Marked fields are mandatory for clinical registration.
                                </p>
                                <button 
                                    type="submit" 
                                    disabled={submitting} 
                                    className={`w-full sm:w-auto px-16 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-cyan-200 hover:shadow-2xl hover:shadow-cyan-300 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? 'Processing...' : 'Complete Onboarding'}
                                    {!submitting && (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <footer className="py-12 px-6 border-t border-white/5 text-center relative z-10">
                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                    Enterprise Health Portal © 2026 MedInteract Solutions
                </p>
            </footer>
        </div>
    );
};

export default PatientOnboardingPage;
