const UserHeader = ({ activeTab, sidebarOpen, setSidebarOpen }) => (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            {/* Burger Menu Button */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">User Dashboard</h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">
                    {activeTab === 'reception' ? 'Reception view' : 'Doctor view'}
                </p>
            </div>
        </div>
    </div>
);

export default UserHeader;
