import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toaster toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    return ctx;
}

function Toaster({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ id, message, type, onDismiss }) {
    const isSuccess = type === 'success';
    const isError = type === 'error';
    const bg = isSuccess
        ? 'bg-emerald-800/95 border-emerald-400/50'
        : isError
          ? 'bg-red-800/95 border-red-400/50'
          : 'bg-slate-800/95 border-slate-400/50';
    const iconBg = isSuccess ? 'bg-emerald-500/30' : isError ? 'bg-red-500/30' : 'bg-slate-500/30';

    return (
        <div
            className={`${bg} text-white px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md flex items-start gap-3 animate-[slideUp_0.3s_ease-out] pointer-events-auto`}
            role="alert"
        >
            <div className={`${iconBg} p-1.5 rounded-lg shrink-0 mt-0.5`}>
                {isSuccess ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : isError ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </div>
            <p className="text-sm font-medium tracking-tight flex-1 pt-0.5">{message}</p>
            <button
                type="button"
                onClick={() => onDismiss(id)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
                aria-label="Dismiss"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
