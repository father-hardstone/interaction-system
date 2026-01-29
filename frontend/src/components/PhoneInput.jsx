import { useState, useEffect } from 'react';

// Always use +1 (US/Canada) format - simple format: ###-###-####
const COUNTRY = { dialCode: '+1', length: 10 };

const PhoneInput = ({ value, onChange, required, disabled }) => {
    const [phoneNumber, setPhoneNumber] = useState('');

    // Extract initial values if provided
    useEffect(() => {
        if (value && value.startsWith('+')) {
            // Extract digits after +1
            const digits = value.replace(/^\+1/, '').replace(/\D/g, '');
            setPhoneNumber(digits);
        } else if (!value) {
            setPhoneNumber('');
        }
    }, [value]);

    const formatNumber = (digits) => {
        if (!digits || digits.length === 0) {
            return '';
        }
        
        // Simple format: ###-###-####
        if (digits.length <= 3) {
            return digits;
        } else if (digits.length <= 6) {
            return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        } else {
            return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }
    };

    const handleNumberChange = (e) => {
        const input = e.target.value;
        // Remove +1 prefix if user types it, then extract only digits
        let digits = input.replace(/^\+1\s*/, '').replace(/\D/g, '');

        // Limit to max length
        if (digits.length > COUNTRY.length) {
            digits = digits.slice(0, COUNTRY.length);
        }

        setPhoneNumber(digits);

        const valid = digits.length === COUNTRY.length;
        const fullNumber = `${COUNTRY.dialCode}${digits}`;

        onChange({ fullNumber, valid, raw: digits });
    };

    const displayValue = phoneNumber ? `+1 ${formatNumber(phoneNumber)}` : '';

    return (
        <input
            type="text"
            placeholder="+1 416-880-0766"
            value={displayValue}
            onChange={handleNumberChange}
            disabled={disabled}
            className={`w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-inherit text-sm ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50 text-slate-900'} transition-all focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
            required={required}
            maxLength={15} // +1 ###-###-#### = 15 chars
        />
    );
};

export default PhoneInput;
