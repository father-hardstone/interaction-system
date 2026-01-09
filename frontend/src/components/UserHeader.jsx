const UserHeader = ({ activeTab }) => (
    <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
            <p className="text-slate-500 mt-1">
                {activeTab === 'reception' ? 'Reception view' : 'Officer view'}
            </p>
        </div>
    </div>
);

export default UserHeader;
