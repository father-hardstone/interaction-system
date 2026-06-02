import { useRef, useState, useEffect } from 'react';

const OtpInput = ({ length = 6, onChange, variant = 'light' }) => {
    const isDark = variant === 'dark';
    const cellClass = isDark
        ? "w-12 h-14 text-center text-2xl font-bold p-0 border border-slate-700 rounded-xl bg-slate-800/50 text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
        : "w-12 h-14 text-center text-2xl font-bold p-0 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100";
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index, e) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        // Allow only one char
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Call onChange with joined string
        const combinedOtp = newOtp.join("");
        onChange(combinedOtp);

        // Move to next input if value is entered
        if (value && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleClick = (index) => {
        inputRefs.current[index].setSelectionRange(1, 1);
        // Optional: move focus to previous empty input?
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            // Move back on backspace if empty
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center my-4 flex-wrap">
            {otp.map((value, index) => (
                <input
                    key={index}
                    type="text"
                    ref={(input) => (inputRefs.current[index] = input)}
                    value={value}
                    onChange={(e) => handleChange(index, e)}
                    onClick={() => handleClick(index)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={cellClass}
                />
            ))}
        </div>
    );
};

export default OtpInput;
