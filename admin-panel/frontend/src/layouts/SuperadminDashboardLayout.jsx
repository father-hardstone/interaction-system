import { Outlet } from 'react-router-dom';
import SuperadminNavBar from '../components/SuperadminNavBar';

const SuperadminDashboardLayout = () => (
    <div className="min-h-screen flex flex-col bg-slate-50">
        <SuperadminNavBar />
        <main className="flex-1 pt-16">
            <Outlet />
        </main>
    </div>
);

export default SuperadminDashboardLayout;
