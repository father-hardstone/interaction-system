import { Link, Outlet } from 'react-router-dom';
import { SUPERADMIN_ROUTES } from '../constants/routes';

const SuperadminAuthShell = () => (
    <div className="flex-1 flex items-center justify-center p-6 w-full min-h-screen bg-[#050a12] relative overflow-hidden">
        <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse" />
        <div className="fixed bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none animate-pulse" />

        <nav className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-4 flex justify-between items-center bg-slate-900/40 backdrop-blur-md border-b border-white/5 h-16">
            <Link to={SUPERADMIN_ROUTES.LOGIN} className="flex flex-col scale-90 sm:scale-100 origin-left min-w-0">
                <span className="text-2xl sm:text-3xl font-black tracking-tighter text-white leading-none">
                    MEDI<span className="text-cyan-400">NET</span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-cyan-500/90 tracking-[0.25em] uppercase mt-1">
                    Superadmin Portal
                </span>
            </Link>
        </nav>

        <div className="relative z-10 w-full max-w-[480px] bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl animate-[slideUp_0.4s_ease-out] mx-auto mt-16 overflow-hidden">
            <Outlet />
        </div>
    </div>
);

export default SuperadminAuthShell;
