const UserSidebar = ({ userData, serial, activeTab, setActiveTab, handleLogout }) => {
    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                    {userData?.name || 'Internal User'}
                </h2>
                <p className="text-sm text-slate-500 uppercase">{serial}</p>
                <p className="text-xs text-slate-400 mt-1 capitalize">{userData?.role || ''}</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                <button
                    type="button"
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'reception' ? 'bg-blue-50 text-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                    onClick={() => setActiveTab('reception')}
                >
                    Reception
                </button>
                <button
                    type="button"
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'officer' ? 'bg-blue-50 text-primary' : 'text-slate-700 hover:bg-slate-100'}`}
                    onClick={() => setActiveTab('officer')}
                >
                    Officer
                </button>
            </nav>

            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default UserSidebar;
