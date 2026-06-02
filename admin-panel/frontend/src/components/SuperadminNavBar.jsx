import { Link, useLocation } from 'react-router-dom';
import { SUPERADMIN_ROUTES } from '../constants/routes';
import AdminProfileMenu from './AdminProfileMenu';

const SuperadminNavBar = () => {
    const location = useLocation();
    const onDashboard = location.pathname.startsWith(SUPERADMIN_ROUTES.DASHBOARD);

    return (
        <nav className="fixed top-0 left-0 right-0 flex justify-between items-center h-16 px-6 bg-white/80 backdrop-blur-lg z-[100] border-b border-slate-200 w-full">
            <Link to={SUPERADMIN_ROUTES.DASHBOARD} className="flex items-center gap-3 min-w-0 group">
                <span className="font-semibold text-lg normal-case tracking-tighter text-slate-900 group-hover:text-primary transition-colors truncate">
                    MEDI<span className="text-cyan-500">NET</span>
                </span>
                {onDashboard && (
                    <>
                        <span className="text-xl font-normal text-slate-300 hidden sm:inline">|</span>
                        <span className="text-xs font-semibold text-slate-400 normal-case tracking-[0.2em] hidden sm:inline">
                            Superadmin
                        </span>
                    </>
                )}
            </Link>
            <AdminProfileMenu />
        </nav>
    );
};

export default SuperadminNavBar;
