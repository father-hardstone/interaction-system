import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { officerService } from '../services/officerService';
import { receptionistService } from '../services/receptionistService';
import PhoneInput from '../components/PhoneInput';
import { validateEmail } from '../utils/crypto';

const EntityDashboard = () => {
    const navigate = useNavigate();
    const { serial } = useParams();
    const [entityData, setEntityData] = useState(null);
    const [officers, setOfficers] = useState([]);
    const [receptionists, setReceptionists] = useState([]);
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [showReceptionistModal, setShowReceptionistModal] = useState(false);
    const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '' });
    const [newReceptionist, setNewReceptionist] = useState({ name: '', email: '', password: '' });
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [receptionPhoneData, setReceptionPhoneData] = useState({ fullNumber: '', valid: false });
    const [error, setError] = useState('');
    const [receptionError, setReceptionError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setEntityData(decoded);
                // Load officers and receptionists when entity data is available
                if (decoded.id) {
                    // Load both lists independently
                    loadOfficers(decoded.id);
                    loadReceptionists(decoded.id);
                }
            } catch (e) {
                console.error('Failed to decode token:', e);
            }
        }
    }, []);

    const loadOfficers = async (entityId) => {
        try {
            console.log('Loading officers for entityId:', entityId);
            const data = await officerService.getByEntity(entityId);
            console.log('Loaded officers:', data);
            setOfficers(data || []);
        } catch (e) {
            console.error('Failed to load officers:', e);
            setOfficers([]);
        }
    };

    const loadReceptionists = async (entityId) => {
        try {
            console.log('Loading receptionists for entityId:', entityId);
            const data = await receptionistService.getByEntity(entityId);
            console.log('Loaded receptionists:', data);
            setReceptionists(data || []);
        } catch (e) {
            console.error('Failed to load receptionists:', e);
            setReceptionists([]);
        }
    };

    const handleCreateOfficer = async (e) => {
        e.preventDefault();
        setError('');

        if (!newOfficer.name || !newOfficer.email || !newOfficer.password) {
            setError('Please fill in all fields');
            return;
        }

        if (!phoneData.valid) {
            setError('Please enter a valid phone number');
            return;
        }

        const emailValidation = validateEmail(newOfficer.email);
        if (!emailValidation.valid) {
            setError(emailValidation.error);
            return;
        }

        try {
            await officerService.create({
                entityId: entityData.id,
                entitySerial: entityData.serial,
                name: newOfficer.name,
                phone: phoneData.fullNumber,
                email: newOfficer.email,
                password: newOfficer.password
            });
            
            // Reset form and close modal
            setNewOfficer({ name: '', email: '', password: '' });
            setPhoneData({ fullNumber: '', valid: false });
            setShowOfficerModal(false);
            setError('');
            
            // Reload officers (receptionists don't need to reload when officer is created)
            await loadOfficers(entityData.id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create officer');
        }
    };

    const handleCreateReceptionist = async (e) => {
        e.preventDefault();
        setReceptionError('');

        if (!newReceptionist.name || !newReceptionist.email || !newReceptionist.password) {
            setReceptionError('Please fill in all fields');
            return;
        }

        if (!receptionPhoneData.valid) {
            setReceptionError('Please enter a valid phone number');
            return;
        }

        const emailValidation = validateEmail(newReceptionist.email);
        if (!emailValidation.valid) {
            setReceptionError(emailValidation.error);
            return;
        }

        try {
            console.log('Creating receptionist with entityData:', {
                entityId: entityData.id,
                entitySerial: entityData.serial,
                entityName: entityData.name,
                entityRole: entityData.role
            });
            
            await receptionistService.create({
                entityId: entityData.id,
                entitySerial: entityData.serial,
                name: newReceptionist.name,
                phone: receptionPhoneData.fullNumber,
                email: newReceptionist.email,
                password: newReceptionist.password
            });

            setNewReceptionist({ name: '', email: '', password: '' });
            setReceptionPhoneData({ fullNumber: '', valid: false });
            setShowReceptionistModal(false);
            setReceptionError('');

            // Reload receptionists (officers don't need to reload when receptionist is created)
            await loadReceptionists(entityData.id);
        } catch (err) {
            setReceptionError(err.response?.data?.error || 'Failed to create receptionist');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/entity/login');
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                {/* Entity Name at Top */}
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-1">
                        {entityData?.name || 'Entity'}
                    </h2>
                    <p className="text-sm text-slate-500 uppercase">{serial}</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <Link
                        to={`/entity/${serial}/settings`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors mb-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                    </Link>
                </nav>

                {/* Logout Button at Bottom */}
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

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                {/* Top Bar */}
                <div className="bg-white border-b border-slate-200 px-8 py-6">
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {entityData?.name || 'Entity'}</p>
                </div>

                {/* Content Area */}
                <div className="p-8 space-y-6">
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
                        {entityData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Entity ID</label>
                                    <p className="text-base text-slate-900 mt-1 font-medium">{entityData.serial}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Name</label>
                                    <p className="text-base text-slate-900 mt-1">{entityData.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Phone</label>
                                    <p className="text-base text-slate-900 mt-1">{entityData.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Email</label>
                                    <p className="text-base text-slate-900 mt-1">{entityData.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-500">Status</label>
                                    <div className="mt-1">
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400">Loading...</p>
                        )}
                    </div>

                    {/* Officers Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Officers</h2>
                                <p className="text-sm text-slate-500 mt-1">Manage your officers</p>
                            </div>
                            <button 
                                onClick={() => setShowOfficerModal(true)}
                                className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                            >
                                Add an officer
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {officers.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                                No officers found. Click "Add an officer" to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        officers.map((officer) => (
                                            <tr key={officer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{officer.serial}</td>
                                                <td className="px-6 py-4 text-slate-700">{officer.name}</td>
                                                <td className="px-6 py-4 text-slate-700">{officer.phone}</td>
                                                <td className="px-6 py-4 text-slate-700">{officer.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        officer.active === 'true' && officer.approved === 'true'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {officer.active === 'true' && officer.approved === 'true' ? 'Active' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Are you sure you want to delete this officer?')) {
                                                                try {
                                                                    await officerService.delete(officer.id);
                                                                    await loadOfficers(entityData.id);
                                                                } catch (e) {
                                                                    alert('Failed to delete officer');
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Reception Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Reception</h2>
                                <p className="text-sm text-slate-500 mt-1">Manage your receptionists</p>
                            </div>
                            <button
                                onClick={() => setShowReceptionistModal(true)}
                                className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                            >
                                Add a receptionist
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receptionists.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                                No receptionists found. Click "Add a receptionist" to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        receptionists.map((rec) => (
                                            <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{rec.serial}</td>
                                                <td className="px-6 py-4 text-slate-700">{rec.name}</td>
                                                <td className="px-6 py-4 text-slate-700">{rec.phone}</td>
                                                <td className="px-6 py-4 text-slate-700">{rec.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                        rec.active === 'true' && rec.approved === 'true'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {rec.active === 'true' && rec.approved === 'true' ? 'Active' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm('Are you sure you want to delete this receptionist?')) {
                                                                try {
                                                                    await receptionistService.delete(rec.id);
                                                                    await loadReceptionists(entityData.id);
                                                                } catch (e) {
                                                                    alert('Failed to delete receptionist');
                                                                }
                                                            }
                                                        }}
                                                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add Officer Modal */}
            {showOfficerModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowOfficerModal(false)}>
                    <div className="bg-white w-full max-w-[500px] p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Officer</h2>
                        {error && <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">{error}</p>}
                        <form onSubmit={handleCreateOfficer} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter officer's full name"
                                    value={newOfficer.name}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone Number <span className="text-red-500">*</span></label>
                                <PhoneInput
                                    onChange={setPhoneData}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    placeholder="Enter officer's email address"
                                    value={newOfficer.email}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    placeholder="Create a password for the officer"
                                    value={newOfficer.password}
                                    onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowOfficerModal(false);
                                        setNewOfficer({ name: '', email: '', password: '' });
                                        setPhoneData({ fullNumber: '', valid: false });
                                        setError('');
                                    }}
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40"
                                >
                                    Create Officer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Receptionist Modal */}
            {showReceptionistModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowReceptionistModal(false)}>
                    <div className="bg-white w-full max-w-[500px] p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Receptionist</h2>
                        {receptionError && <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">{receptionError}</p>}
                        <form onSubmit={handleCreateReceptionist} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Full Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter receptionist's full name"
                                    value={newReceptionist.name}
                                    onChange={(e) => setNewReceptionist({ ...newReceptionist, name: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone Number <span className="text-red-500">*</span></label>
                                <PhoneInput
                                    onChange={setReceptionPhoneData}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email Address <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    placeholder="Enter receptionist's email address"
                                    value={newReceptionist.email}
                                    onChange={(e) => setNewReceptionist({ ...newReceptionist, email: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    placeholder="Create a password for the receptionist"
                                    value={newReceptionist.password}
                                    onChange={(e) => setNewReceptionist({ ...newReceptionist, password: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReceptionistModal(false);
                                        setNewReceptionist({ name: '', email: '', password: '' });
                                        setReceptionPhoneData({ fullNumber: '', valid: false });
                                        setReceptionError('');
                                    }}
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40"
                                >
                                    Create Receptionist
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntityDashboard;

