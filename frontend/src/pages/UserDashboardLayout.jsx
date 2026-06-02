import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useUserDashboardNav } from '../contexts/UserDashboardNavContext';
import { getDefaultMainTab } from '../utils/userPermissions';

const UserDashboardLayout = () => {
    const navigate = useNavigate();
    const { serial } = useParams();
    const { register, unregister } = useUserDashboardNav();
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('reception');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
                setActiveTab(getDefaultMainTab(decoded.role));
            } catch (e) {
                console.error('Failed to decode token');
            }
        }
    }, []);

    const handleLogout = useCallback(() => {
        setShowLogoutModal(true);
    }, []);

    useEffect(() => {
        if (userData && serial) {
            register({
                activeTab,
                setActiveTab,
                userData,
                serial,
                onLogout: handleLogout
            });
        }
        return () => unregister();
    }, [userData, serial, activeTab, register, unregister, handleLogout]);

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('entityName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('entityId');
        localStorage.removeItem('entitySerial');
        setShowLogoutModal(false);
        navigate('/user/login');
    };

    if (!userData || !serial) {
        return null;
    }

    return (
        <div className="pt-16">
            <Outlet />
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center px-4 pb-4 pt-0 !mt-0 z-[2000]" onClick={() => setShowLogoutModal(false)}>
                    <div className="bg-white w-full max-w-[400px] p-6 sm:p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Logout</h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    Are you sure you want to log out of the interaction system?
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 py-3 px-4 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboardLayout;
