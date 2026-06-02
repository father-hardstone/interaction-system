import { useState } from 'react';

const PasswordInput = ({
    value,
    onChange,
    placeholder = 'Enter your password',
    required = false,
    className = '',
    variant = 'light',
    name,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const isDark = variant === 'dark';
    const baseClassName = isDark
        ? 'w-full py-3.5 px-4 pr-12 border border-slate-700 rounded-xl font-inherit text-base bg-slate-800/50 transition-all text-white focus:outline-none focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10'
        : 'w-full py-3.5 px-4 pr-12 border border-slate-200 rounded-xl font-inherit text-base bg-white transition-all text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100';
    const combinedClassName = `${baseClassName} ${className}`.trim();
    const toggleClassName = isDark
        ? 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors'
        : 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors';

    return (
        <div className="relative">
            <input
                type={showPassword ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                name={name}
                className={combinedClassName}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={toggleClassName}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
                {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default PasswordInput;
