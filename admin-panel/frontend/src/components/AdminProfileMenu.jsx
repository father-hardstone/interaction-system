import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AdminProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const getAdminInfo = () => {
    const token = localStorage.getItem('token');
    if (!token) return {};
    try {
      const decoded = jwtDecode(token);
      const initials = (decoded.name || decoded.email || decoded.phone || 'A')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      return {
        initials,
        name: decoded.name || 'Admin',
        email: decoded.email || '',
        phone: decoded.phone || '',
        avatar:
          decoded.avatar ||
          'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=Admin',
      };
    } catch (e) {
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
    navigate('/admin/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={adminInfo.email || adminInfo.phone || 'Admin'}
        className="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors overflow-hidden"
      >
        {adminInfo.avatar ? (
          <img
            src={adminInfo.avatar}
            alt="Admin avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          adminInfo.initials || 'A'
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{adminInfo.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">
              {adminInfo.email || adminInfo.phone || 'No contact info'}
            </p>
          </div>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              // placeholder for settings navigation
              navigate('/admin/dashboard');
            }}
          >
            Settings
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

