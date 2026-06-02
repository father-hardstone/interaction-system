import React from 'react';

const UnauthorizedView = ({ title = 'Access restricted', message = "You don't have permission to view this section." }) => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-8 bg-slate-50/80 rounded-2xl border border-slate-200">
        <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
            </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">{message}</p>
    </div>
);

export default UnauthorizedView;
