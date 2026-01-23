import { useState, useEffect } from 'react';

const COUNTRIES = [
    { code: 'US', name: 'United States', dialCode: '+1', length: 10, format: '(###) ###-####', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', dialCode: '+1', length: 10, format: '(###) ###-####', flag: '🇨🇦' },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', length: 10, format: '(###) #######', flag: '🇵🇰' },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', length: 9, format: '(5#) ###-####', flag: '🇸🇦' },
];

const PhoneInput = ({ value, onChange, required }) => {
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [phoneNumber, setPhoneNumber] = useState('');

    // Extract initial values if provided
    useEffect(() => {
        // If value is passed (e.g. edit mode), we might need to parse it. 
        // For now, simple state management is fine.
    }, []);

    const formatNumber = (digits, format) => {
        // If no digits, return empty string (no formatting shown)
        if (!digits || digits.length === 0) {
            return '';
        }

        // Build formatted display as digits are entered
        // Show formatting characters (brackets, spaces, dashes) progressively as digits are typed
        let display = '';
        let digitIdx = 0;

        for (let i = 0; i < format.length; i++) {
            if (format[i] === '#') {
                if (digitIdx < digits.length) {
                    display += digits[digitIdx];
                    digitIdx++;
                } else {
                    // No more digits, stop here (don't show trailing formatting)
                    break;
                }
            } else {
                // Formatting character - show it if we've already placed a digit before it
                // and there are more digits to place after it
                if (digitIdx > 0 && digitIdx < digits.length) {
                    // Check if there's a digit placeholder coming up
                    let hasUpcomingDigit = false;
                    for (let j = i + 1; j < format.length; j++) {
                        if (format[j] === '#') {
                            hasUpcomingDigit = true;
                            break;
                        }
                    }
                    if (hasUpcomingDigit) {
                        display += format[i];
                    }
                }
            }
        }
        return display;
    };

    const handleCountryChange = (e) => {
        const country = COUNTRIES.find(c => c.code === e.target.value);
        setSelectedCountry(country);
        setPhoneNumber(''); // Reset number on country change to avoid format conflicts
        onChange({ fullNumber: '', valid: false });
    };

    const handleNumberChange = (e) => {
        const input = e.target.value;
        // Extract only digits
        const digits = input.replace(/\D/g, '');

        // Limit to max length
        if (digits.length > selectedCountry.length) return;

        setPhoneNumber(digits);

        const valid = digits.length === selectedCountry.length;
        const fullNumber = `${selectedCountry.dialCode}${digits}`;

        onChange({ fullNumber, valid, raw: digits });
    };

    return (
        <div className="flex gap-3 w-full">
            <select
                value={selectedCountry.code}
                onChange={handleCountryChange}
                className="w-[30%] min-w-[80px] max-w-[120px] bg-[url('data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e')] bg-[right_0.5rem_center] bg-no-repeat bg-[length:1.5em_1.5em] pr-10 appearance-none py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
                {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>
                        {c.flag} {c.dialCode}
                    </option>
                ))}
            </select>
            <input
                type="text"
                placeholder=""
                value={formatNumber(phoneNumber, selectedCountry.format)}
                onChange={handleNumberChange}
                className="flex-1 py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                required={required}
                maxLength={selectedCountry.format.length}
            />
        </div>
    );
};

export default PhoneInput;
