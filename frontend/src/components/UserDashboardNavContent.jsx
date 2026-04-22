import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const UserDashboardNavContent = ({ navState, entityIconUrl, userInfo }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [tabDropdownOpen, setTabDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const tabDropdownRef = useRef(null);
    const location = useLocation();

    const { activeTab, setActiveTab, userData, serial, onLogout } = navState || {};

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
            if (tabDropdownRef.current && !tabDropdownRef.current.contains(e.target)) {
                setTabDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = userData?.name
        ? userData.name
              .split(/\s+/)
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'U';

    const displayPictureUrl = userData?.avatar || userData?.profilePicture || userData?.picture;
    const settingsPath = serial ? `/${serial}/user/dashboard/settings` : '#';
    const isSettingsPage = location.pathname === settingsPath;
    const isLabRequisitionPage = location.pathname.includes('/user/dashboard/lab-requisition/');
    const isStandaloneFormPage = location.pathname.includes('/user/dashboard/forms/');

    return (
        <nav className="fixed top-0 left-0 right-0 flex justify-between items-center h-16 px-6 bg-white/80 backdrop-blur-lg z-[100] border-b border-slate-200 w-full font-inherit">
            {/* Left: Entity logo */}
            <div className="w-1/3 flex justify-start min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                <Link to="/" className="flex items-center group min-w-0">
                    {entityIconUrl ? (
                        <img
                            src={entityIconUrl}
                            alt={userInfo?.displayName}
                            className="h-12 w-auto object-contain max-w-[180px]"
                        />
                    ) : (
                        <span className="font-semibold text-lg normal-case tracking-tighter text-slate-900 group-hover:text-primary transition-colors truncate">
                            {userInfo?.displayName || "Medical Interaction System"}
                        </span>
                    )}
                </Link>
                </div>
            </div>

            {/* Center: Operations | Physician tabs */}
            <div className="w-1/3 flex justify-center shrink-0">
                {isSettingsPage || isLabRequisitionPage || isStandaloneFormPage ? null : (
                    <>
                        {/* Mobile: dropdown */}
                        <div className="md:hidden relative" ref={tabDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setTabDropdownOpen((o) => !o)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                {activeTab === 'reception' ? 'Operations' : 'Physician'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {tabDropdownOpen && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-[200]">
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab?.('reception'); setTabDropdownOpen(false); }}
                                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'reception' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                        Operations
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveTab?.('officer'); setTabDropdownOpen(false); }}
                                        className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'officer' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Physician
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Desktop: two buttons */}
                        <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab?.('reception')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'reception' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Operations
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab?.('officer')}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === 'officer' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Physician
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Profile with dropdown */}
            <div className="w-1/3 flex justify-end relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 overflow-hidden"
                    aria-label="Open user menu"
                >
                    {displayPictureUrl ? (
                        <img src={displayPictureUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        initials
                    )}
                </button>

                {dropdownOpen && (
                    <div className="absolute right-6 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-[200] animate-[slideUp_0.2s_ease-out]">
                        <div className="px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                                    {displayPictureUrl ? (
                                        <img src={displayPictureUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900 truncate">{userData?.name || 'Internal User'}</p>
                                    <p className="text-sm text-slate-500 normal-case truncate">{userData?.email || '—'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="py-1">
                            <Link
                                to={settingsPath}
                                onClick={() => setDropdownOpen(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors no-underline"
                            >
                                <svg className="w-5 h-5 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Profile settings
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    setDropdownOpen(false);
                                    onLogout?.();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Log out
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default UserDashboardNavContent;
