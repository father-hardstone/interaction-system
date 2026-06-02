import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { SUPERADMIN_ROUTES } from '../constants/routes';

const AdminProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const getAdminInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return {};
    try {
      const decoded = jwtDecode(token);
      const initials = (decoded.name || decoded.email || decoded.phone || 'S')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      return {
        initials,
        name: decoded.name || 'Superadmin',
        email: decoded.email || '',
        phone: decoded.phone || '',
        avatar:
          decoded.avatar ||
          'https://ui-avatars.com/api/?background=0891b2&color=fff&name=SA',
      };
    } catch {
      return {};
    }
  };

  const adminInfo = getAdminInfo();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate(SUPERADMIN_ROUTES.LOGIN);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={adminInfo.email || adminInfo.phone || 'Superadmin'}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-semibold flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity overflow-hidden"
      >
        {adminInfo.avatar ? (
          <img
            src={adminInfo.avatar}
            alt="Superadmin avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          adminInfo.initials || 'SA'
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{adminInfo.name || 'Superadmin'}</p>
            <p className="text-xs text-slate-500 truncate">
              {adminInfo.email || adminInfo.phone || 'No contact info'}
            </p>
          </div>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              navigate(SUPERADMIN_ROUTES.DASHBOARD);
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProfileMenu;
