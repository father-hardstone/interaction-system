import { useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Login from './Login';
import InternalLogin from './InternalLogin';

const TABS = {
    admin: {
        label: 'Admin login',
        path: '/entity/login', // Entity portal login
    },
    staff: {
        label: 'Staff login',
        path: '/user/login', // Internal staff login
    }
};

function getActiveTabFromPath(pathname) {
    if (pathname.startsWith('/user/login')) return 'staff';
    if (pathname.startsWith('/entity/login')) return 'admin';
    return 'admin';
}

const PortalLogin = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const activeTab = useMemo(() => getActiveTabFromPath(location.pathname), [location.pathname]);

    const handleTabClick = (tabKey) => {
        const next = TABS[tabKey]?.path || TABS.admin.path;
        if (location.pathname !== next) navigate(next);
    };

    return (
        <div className="flex-1 flex items-center justify-center p-6 w-full min-h-screen bg-[#050a12] relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse"></div>
            <div className="fixed bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse delay-700"></div>

            <div className="relative z-10 w-full max-w-[560px] bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl animate-[slideUp_0.4s_ease-out] mx-auto overflow-hidden">
                <div className="px-8 pt-10 pb-2">
                    <h2 className="m-0 text-3xl font-bold text-center text-white tracking-tight">
                        MedInteract <span className="text-cyan-400">Portal</span>
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-400">
                        Secure medical access gateway.
                    </p>
                </div>

                <div className="px-8 pt-6">
                    <div className="grid grid-cols-2 gap-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-1.5">
                        {Object.entries(TABS).map(([key, tab]) => {
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTabClick(key)}
                                    className={[
                                        'py-3 rounded-xl text-sm font-bold transition-all',
                                        isActive
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                            : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                    ].join(' ')}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-8 pt-6">
                    {activeTab === 'admin' ? (
                        <Login type="entity" embedded />
                    ) : (
                        <InternalLogin embedded />
                    )}
                </div>

                <div className="px-8 pb-8 text-center">
                    <Link to="/" className="text-xs text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-widest font-bold">
                        &larr; Back to Landing Page
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PortalLogin;

