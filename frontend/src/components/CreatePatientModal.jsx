import PhoneInput from './PhoneInput';
import { getVisitorSerialDisplay } from '../utils/formatUtils';

const CreatePatientModal = ({
    open,
    onClose,
    visitors = [],
    editingVisitorId,
    nextVisitorSerial = '',
    visitorForm,
    setVisitorForm,
    phoneData,
    setPhoneData,
    phoneHData,
    setPhoneHData,
    phoneMData,
    setPhoneMData,
    guardianPhoneData,
    setGuardianPhoneData,
    healthCardNumber,
    setHealthCardNumber,
    healthCardVersion,
    setHealthCardVersion,
    healthCardEffectivityDate,
    setHealthCardEffectivityDate,
    healthCardExpiryDate,
    setHealthCardExpiryDate,
    handleCreateVisitor,
    handleHealthCardChange,
    onHealthCardVersionChange,
    error,
    setError,
    isCreatingVisitor,
    fieldErrors = {},
    setFieldErrors = () => {},
    unconfirmed = false
}) => {
    const validateDates = (effectivity, expiry) => {
        if (effectivity && expiry) {
            const effDate = new Date(effectivity);
            const expDate = new Date(expiry);
            if (expDate < effDate) {
                return 'Expiry date cannot be before issue date';
            }
        }
        return '';
    };

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

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[1000]">
            <div className="bg-white w-full max-w-[720px] max-h-[95vh] overflow-y-auto p-4 sm:p-5 lg:p-6 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]">
                {/* Header: Title | ID + Buttons div */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 shrink-0">
                        {editingVisitorId 
                            ? (unconfirmed ? 'Edit Unconfirmed Patient' : 'Edit Patient') 
                            : 'Add New Patient'}
                    </h2>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl ml-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-semibold text-blue-900">Patient ID:</span>
                            <span className="text-sm font-semibold text-blue-700 font-sans">
                                {editingVisitorId ? (
                                    (() => {
                                        const v = visitors.find(v => v.id === editingVisitorId);
                                        return v ? getVisitorSerialDisplay(v) : 'Loading...';
                                    })()
                                ) : (nextVisitorSerial ? String(nextVisitorSerial).padStart(6, '0') : '-')}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="visitor-form"
                                disabled={isCreatingVisitor}
                                className="px-4 py-2 bg-primary text-white border-none rounded-xl font-semibold text-sm cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {isCreatingVisitor ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {editingVisitorId ? 'Saving...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingVisitorId ? 'Save Changes' : 'Create Patient'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                {error && <p className="bg-red-50 border border-red-200 text-red-600 py-2 px-4 rounded-xl text-sm mb-4">{error}</p>}

                <form id="visitor-form" noValidate onSubmit={handleCreateVisitor} className="flex flex-col gap-3">
                    {/* Line 1: Names + DOB + Age (compact on large screens) */}
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
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.lastName && <p className="text-red-500 text-xs">{fieldErrors.lastName}</p>}</div>
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
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.firstName && <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>}</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Middle Name</label>
                                    <input
                                        type="text"
                                        placeholder="Middle name"
                                        value={visitorForm.middleName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, middleName: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    {rowHasError && <div className="min-h-[2.5rem]" />}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Date of Birth <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={visitorForm.dateOfBirth ? (() => {
                                            const parts = visitorForm.dateOfBirth.split('-');
                                            if (parts.length === 3) {
                                                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                                            }
                                            return '';
                                        })() : ''}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            const dateValue = e.target.value;
                                            if (dateValue) {
                                                const parts = dateValue.split('-');
                                                const formatted = `${parts[1]}-${parts[2]}-${parts[0]}`;

                                                const selectedDate = new Date(dateValue);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                if (selectedDate > today) {
                                                    setFieldErrors(prev => ({ ...prev, dob: 'Date of birth cannot be in the future' }));
                                                } else {
                                                    setFieldErrors(prev => { const n = { ...prev }; delete n.dob; return n; });
                                                }

                                                setVisitorForm({ ...visitorForm, dateOfBirth: formatted });
                                            } else {
                                                setVisitorForm({ ...visitorForm, dateOfBirth: '' });
                                                setFieldErrors(prev => ({ ...prev, dob: 'Date of birth is required' }));
                                            }
                                        }}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.dob ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.dob && <p className="text-red-500 text-xs">{fieldErrors.dob}</p>}</div>
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
                                    {rowHasError && <div className="min-h-[2.5rem]" />}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Line 2: HC + Dates (tight spacing) */}
                    {(() => {
                        const rowHasError = fieldErrors.healthCard || fieldErrors.healthCardVersion || fieldErrors.healthCardEffectivity || fieldErrors.healthCardExpiry || fieldErrors.healthCardDate;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const exp = healthCardExpiryDate ? new Date(healthCardExpiryDate) : null;
                        const expiryPast = !!(exp && !isNaN(exp.getTime()) && exp < today);
                        const expiryWarn = expiryPast && !fieldErrors.healthCardExpiry && !fieldErrors.healthCardDate;
                        return (
                            <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-2">
                                <div className="w-full md:w-36 md:min-w-[9rem] flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">HC <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="XXXX-XXX-XXX"
                                        value={healthCardNumber}
                                        onChange={handleHealthCardChange}
                                        maxLength={12}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCard ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.healthCard && <p className="text-red-500 text-xs">{fieldErrors.healthCard}</p>}</div>
                                </div>
                                <div className="w-full md:w-[calc(4rem)] flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Version <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="AB"
                                        value={healthCardVersion}
                                        onChange={onHealthCardVersionChange}
                                        maxLength={2}
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.healthCardVersion ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.healthCardVersion && <p className="text-red-500 text-xs">{fieldErrors.healthCardVersion}</p>}</div>
                                </div>
                                <div className="w-full md:w-36 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Issue Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={healthCardEffectivityDate || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setHealthCardEffectivityDate(val);
                                            setFieldErrors(prev => {
                                                const n = { ...prev }; delete n.healthCardEffectivity; delete n.healthCardDate;
                                                if (val && healthCardExpiryDate) {
                                                    const msg = validateDates(val, healthCardExpiryDate);
                                                    if (msg) n.healthCardDate = msg;
                                                }
                                                return n;
                                            });
                                        }}
                                        className={`w-full py-2.5 px-3.5 border ${(fieldErrors.healthCardEffectivity || fieldErrors.healthCardDate) ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{(fieldErrors.healthCardEffectivity || fieldErrors.healthCardDate) && <p className="text-red-500 text-xs">{fieldErrors.healthCardEffectivity || fieldErrors.healthCardDate}</p>}</div>
                                </div>
                                <div className="w-full md:w-36 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Expiry Date <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={healthCardExpiryDate || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setHealthCardExpiryDate(val);
                                            setFieldErrors(prev => {
                                                const n = { ...prev }; delete n.healthCardExpiry; delete n.healthCardDate;
                                                if (healthCardEffectivityDate && val) {
                                                    const msg = validateDates(healthCardEffectivityDate, val);
                                                    if (msg) n.healthCardDate = msg;
                                                }
                                                return n;
                                            });
                                        }}
                                        className={`w-full py-2.5 px-3.5 border ${(fieldErrors.healthCardExpiry || fieldErrors.healthCardDate || expiryWarn) ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>
                                        {(fieldErrors.healthCardExpiry || fieldErrors.healthCardDate) && (
                                            <p className="text-red-500 text-xs w-full">{fieldErrors.healthCardExpiry || fieldErrors.healthCardDate}</p>
                                        )}
                                    </div>
                                </div>
                                {/* Sex: same row as HC — letter above each radio */}
                                <div className="w-full md:w-auto flex flex-col gap-2 md:min-w-0">
                                    <label className="text-sm font-semibold text-slate-900">Sex <span className="text-red-500">*</span></label>
                                    <div className="flex flex-row gap-3 items-center">
                                        {['M', 'F', 'O'].map((opt) => (
                                            <label key={opt} className="inline-flex flex-col items-center gap-1 cursor-pointer">
                                                <span className="text-sm font-medium text-slate-800">{opt}</span>
                                                <input
                                                    type="radio"
                                                    name="sex"
                                                    value={opt}
                                                    checked={visitorForm.gender === opt}
                                                    onChange={() => {
                                                        setVisitorForm({ ...visitorForm, gender: opt });
                                                        setFieldErrors(prev => { const n = { ...prev }; delete n.gender; return n; });
                                                    }}
                                                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                    <div className={(fieldErrors.healthCard || fieldErrors.gender) ? 'min-h-[2.5rem]' : ''}>{fieldErrors.gender && <p className="text-red-500 text-xs">{fieldErrors.gender}</p>}</div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Phone (M), Phone (B), Phone (H) */}
                    {(() => {
                        const rowHasError = fieldErrors.phoneM;
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[0.85fr_0.85fr_0.85fr_1.45fr] gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (M) <span className="text-red-500">*</span></label>
                                    <PhoneInput
                                        value={phoneMData.fullNumber}
                                        onChange={setPhoneMData}
                                        required
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.phoneM && <p className="text-red-500 text-xs">{fieldErrors.phoneM}</p>}</div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (B)</label>
                                    <PhoneInput
                                        value={phoneData.fullNumber}
                                        onChange={setPhoneData}
                                    />
                                    {rowHasError && <div className="min-h-[2.5rem]" />}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Phone (H)</label>
                                    <PhoneInput
                                        value={phoneHData.fullNumber}
                                        onChange={setPhoneHData}
                                    />
                                    {rowHasError && <div className="min-h-[2.5rem]" />}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={visitorForm.email ?? ''}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                                        className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                    {rowHasError && <div className="min-h-[2.5rem]" />}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Street, City, Province, Postal Code */}
                    {(() => {
                        const rowHasError = fieldErrors.street || fieldErrors.city || fieldErrors.state || fieldErrors.postalCode;
                        return (
                            <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-2">
                                <div className="w-full md:min-w-[10rem] md:w-48 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Street <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Street address"
                                        value={visitorForm.addressLine}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVisitorForm({ ...visitorForm, addressLine: val });
                                            if (!val.trim()) setFieldErrors(prev => ({ ...prev, street: 'Street is required' }));
                                            else setFieldErrors(prev => { const n = { ...prev }; delete n.street; return n; });
                                        }}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.street ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.street && <p className="text-red-500 text-xs">{fieldErrors.street}</p>}</div>
                                </div>
                                <div className="w-full md:w-36 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">City <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={visitorForm.city}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVisitorForm({ ...visitorForm, city: val });
                                            if (!val.trim()) setFieldErrors(prev => ({ ...prev, city: 'City is required' }));
                                            else setFieldErrors(prev => { const n = { ...prev }; delete n.city; return n; });
                                        }}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.city && <p className="text-red-500 text-xs">{fieldErrors.city}</p>}</div>
                                </div>
                                <div className="w-full md:w-32 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Province <span className="text-red-500">*</span></label>
                                    <select
                                        value={visitorForm.state}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setVisitorForm({ ...visitorForm, state: val });
                                            if (!val) setFieldErrors(prev => ({ ...prev, state: 'Province is required' }));
                                            else setFieldErrors(prev => { const n = { ...prev }; delete n.state; return n; });
                                        }}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.state ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
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
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.state && <p className="text-red-500 text-xs">{fieldErrors.state}</p>}</div>
                                </div>
                                <div className="w-full md:w-32 flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Postal Code <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="A1B-2C3"
                                        value={visitorForm.postalCode}
                                        onChange={handlePostalChange}
                                        maxLength={7}
                                        required
                                        className={`w-full py-2.5 px-3.5 border ${fieldErrors.postalCode ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'} rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
                                    />
                                    <div className={rowHasError ? 'min-h-[2.5rem]' : ''}>{fieldErrors.postalCode && <p className="text-red-500 text-xs">{fieldErrors.postalCode}</p>}</div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Allergies, Type of Reaction, Special Notes - red highlighter */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-red-900">Allergies</label>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    value={visitorForm.allergies ?? ''}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, allergies: e.target.value })}
                                    className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-red-900">Type of Reaction</label>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    value={visitorForm.drugReactions ?? ''}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, drugReactions: e.target.value })}
                                    className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-red-900">Special Notes</label>
                                <input
                                    type="text"
                                    placeholder="Optional"
                                    value={visitorForm.specialNotes ?? ''}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, specialNotes: e.target.value })}
                                    className="w-full py-2.5 px-3.5 border border-red-200 bg-white rounded-xl font-inherit text-sm transition-all text-slate-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Past medical history */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                        <label className="text-sm font-semibold text-slate-900 block mb-3">Past medical history <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                { key: 'highBloodPressure', label: 'High BP' },
                                { key: 'heartDisease', label: 'Heart disease' },
                                { key: 'diabetes', label: 'Diabetes' },
                                { key: 'cholesterol', label: 'Cholesterol' },
                                { key: 'smoke', label: 'Smoke' }
                            ].map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 border border-slate-200 px-3 py-2">
                                    <span className="text-sm text-slate-700 min-w-0 truncate">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <label className="inline-flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={key}
                                                value="yes"
                                                checked={visitorForm[key] === 'yes'}
                                                onChange={() => {
                                                    setVisitorForm({ ...visitorForm, [key]: 'yes' });
                                                    setFieldErrors(prev => { const n = { ...prev }; delete n.pastMedicalHistory; return n; });
                                                }}
                                                className="w-3.5 h-3.5 text-primary border-slate-300"
                                            />
                                            <span className="text-xs font-medium text-slate-700">Yes</span>
                                        </label>
                                        <label className="inline-flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={key}
                                                value="no"
                                                checked={visitorForm[key] === 'no'}
                                                onChange={() => {
                                                    setVisitorForm({ ...visitorForm, [key]: 'no' });
                                                    setFieldErrors(prev => { const n = { ...prev }; delete n.pastMedicalHistory; return n; });
                                                }}
                                                className="w-3.5 h-3.5 text-primary border-slate-300"
                                            />
                                            <span className="text-xs font-medium text-slate-700">No</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {fieldErrors.pastMedicalHistory && (
                            <p className="text-red-500 text-xs mt-2">{fieldErrors.pastMedicalHistory}</p>
                        )}
                    </div>

                    {/* Emergency contact (optional) */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-2 w-full sm:min-w-[12rem] sm:w-56 flex-1">
                            <label className="text-sm font-semibold text-slate-900">Emergency Name</label>
                            <input
                                type="text"
                                placeholder="Enter emergency contact name"
                                value={visitorForm.emergencyName ?? ''}
                                onChange={(e) => setVisitorForm({ ...visitorForm, emergencyName: e.target.value })}
                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm transition-all bg-slate-50 text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:min-w-[10rem] sm:w-40">
                            <label className="text-sm font-semibold text-slate-900">Relation</label>
                            <input
                                type="text"
                                placeholder="e.g. Mother, Spouse"
                                value={visitorForm.emergencyRelation ?? ''}
                                onChange={(e) => setVisitorForm({ ...visitorForm, emergencyRelation: e.target.value })}
                                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm transition-all bg-slate-50 text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                        <div className="flex flex-col gap-2 w-full sm:min-w-[9rem] sm:w-40">
                            <label className="text-sm font-semibold text-slate-900">Emergency Contact (M)</label>
                            <PhoneInput
                                value={guardianPhoneData.fullNumber}
                                onChange={setGuardianPhoneData}
                            />
                        </div>
                    </div>

                    {/* Notes and Memo */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex flex-col gap-2 flex-1 min-w-[12rem] sm:min-w-[14rem]">
                            <label className="text-sm font-semibold text-slate-900">
                                Notes <span className="text-xs text-slate-400 font-normal">({visitorForm.notes?.length || 0}/100)</span>
                            </label>
                            <textarea
                                value={visitorForm.notes}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= 100) {
                                        setVisitorForm({ ...visitorForm, notes: val });
                                    }
                                }}
                                maxLength={300}
                                className="w-full min-h-[56px] max-h-[100px] py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100 resize-y"
                            />
                        </div>
                        <div className="flex flex-col gap-2 flex-1 min-w-[12rem] sm:min-w-[14rem]">
                            <label className="text-sm font-semibold text-slate-900">
                                Memo <span className="text-xs text-slate-400 font-normal">({visitorForm.memo?.length || 0}/100)</span>
                            </label>
                            <textarea
                                value={visitorForm.memo}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= 100) {
                                        setVisitorForm({ ...visitorForm, memo: val });
                                    }
                                }}
                                maxLength={300}
                                className="w-full min-h-[56px] max-h-[100px] py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100 resize-y"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePatientModal;
