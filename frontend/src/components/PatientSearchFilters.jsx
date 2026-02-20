import { formatPhoneDisplay, parsePhoneToDigits, formatHealthCardDisplay, parseHealthCardToDigits } from '../utils/formatUtils';

const PatientSearchFilters = ({
    searchLastName,
    setSearchLastName,
    searchFirstName,
    setSearchFirstName,
    searchDob,
    setSearchDob,
    searchHealthCard,
    setSearchHealthCard,
    searchSerial,
    setSearchSerial,
    searchContact,
    setSearchContact,
    dobSearchFocused,
    setDobSearchFocused
}) => {
    // Normalize with same rule as formatUtils: leading 1 stripped only when 11 digits (country code)
    const contactDigits = parsePhoneToDigits(searchContact ?? '');
    const contactDisplay = formatPhoneDisplay(contactDigits) || '';

    const handleContactChange = (e) => {
        if (typeof setSearchContact !== 'function') return;
        const raw = e.target.value;
        const digits = parsePhoneToDigits(raw);
        setSearchContact(digits);
    };

    return (
        <div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 border-b border-slate-200 bg-slate-50">
            <input
                type="text"
                placeholder="Search by last name"
                value={searchLastName}
                onChange={(e) => setSearchLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
            />
            <input
                type="text"
                placeholder="Search by first name"
                value={searchFirstName}
                onChange={(e) => setSearchFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
            />
            <div className="relative flex items-center">
                <input
                    type={dobSearchFocused || searchDob ? 'date' : 'text'}
                    placeholder={!dobSearchFocused && !searchDob ? 'Search by DOB' : ''}
                    value={searchDob}
                    onFocus={() => setDobSearchFocused(true)}
                    onBlur={() => setDobSearchFocused(false)}
                    onChange={(e) => setSearchDob(e.target.value)}
                    className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 placeholder-slate-400"
                />
                {searchDob && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSearchDob('');
                        }}
                        className="absolute right-9 text-slate-400 hover:text-slate-600 transition-colors bg-white px-1"
                        title="Clear date"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <input
                type="text"
                placeholder="Search by health card (XXXX-XXX-XXX)"
                value={searchHealthCard}
                onChange={(e) => setSearchHealthCard(formatHealthCardDisplay(parseHealthCardToDigits(e.target.value)))}
                maxLength={12}
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
            />
            <input
                type="text"
                placeholder="Search by ID"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value.replace(/\D/g, '').substring(0, 6))}
                maxLength={6}
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
            />
            <input
                type="text"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="Search by phone."
                value={contactDisplay}
                onChange={handleContactChange}
                maxLength={14}
                className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 font-sans tabular-nums"
            />
        </div>
    );
};

export default PatientSearchFilters;
