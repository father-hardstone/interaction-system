import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
        <div className="flex-1 flex items-center justify-center p-8 w-full">
            <div className="bg-white w-full max-w-[560px] rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-auto overflow-hidden">
                <div className="px-6 pt-8 pb-0">
                    <h2 className="m-0 text-3xl font-semibold text-center text-slate-900 tracking-tight">
                        Login Portal
                    </h2>
                    <p className="mt-2 text-center text-sm text-slate-500">
                        Sign in to continue.
                    </p>
                </div>

                <div className="px-6 pt-6">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
                        {Object.entries(TABS).map(([key, tab]) => {
                            const isActive = activeTab === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTabClick(key)}
                                    className={[
                                        'py-2.5 rounded-xl text-sm font-semibold transition-all',
                                        isActive
                                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                            : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/70'
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
            </div>
        </div>
    );
};

export default PortalLogin;

