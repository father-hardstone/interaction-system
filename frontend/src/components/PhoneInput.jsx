import { useState, useEffect } from 'react';
import { formatPhoneDisplay, parsePhoneToDigits } from '../utils/formatUtils';

const PHONE_LENGTH = 10;

const PhoneInput = ({ value, onChange, required, disabled }) => {
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        setPhoneNumber(parsePhoneToDigits(value || ''));
    }, [value]);

    const handleNumberChange = (e) => {
        const input = e.target.value;
        const digits = parsePhoneToDigits(input);

        setPhoneNumber(digits);
        const valid = digits.length === PHONE_LENGTH;
        onChange({ fullNumber: digits, valid, raw: digits });
    };

    const displayValue = formatPhoneDisplay(phoneNumber);

    return (
        <input
            type="text"
            placeholder="(555) 123-4567"
            value={displayValue}
            onChange={handleNumberChange}
            disabled={disabled}
            className={`w-full py-2.5 px-3.5 border border-slate-200 rounded-xl font-sans text-sm ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50 text-slate-900'} transition-all focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100`}
            required={required}
            maxLength={14}
        />
    );
};

export default PhoneInput;
