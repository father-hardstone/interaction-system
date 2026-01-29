import { useState, useEffect } from 'react';
import { entityService } from '../services/entityService';
import PhoneInput from '../components/PhoneInput';

const AdminDashboard = () => {
    const [entities, setEntities] = useState([]);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);

    // Create Form State
    const [newEntity, setNewEntity] = useState({ name: '', email: '', password: '' });
    const [phoneData, setPhoneData] = useState({ fullNumber: '', valid: false });
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });

    useEffect(() => {
        loadEntities();
    }, []);

    const loadEntities = async () => {
        try {
            const data = await entityService.getAll();
            setEntities(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleApprove = async (id) => {
        await entityService.approve(id);
        loadEntities();
    }

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this entity?")) {
            await entityService.delete(id);
            loadEntities();
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newEntity,
                phone: phoneData.fullNumber,
                password: newEntity.password
            };
            await entityService.create(payload);
            setShowCreateModal(false);
            setNewEntity({ name: '', email: '', password: '' });
            loadEntities();
        } catch (e) {
            alert(e.response?.data?.error || "Error creating entity");
        }
    }

    const handleEditClick = (entity) => {
        setEditingEntity(entity);
        setEditForm({
            name: entity.name || '',
            email: entity.email || '',
            phone: entity.phone || '',
            password: ''
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingEntity) return;
        try {
            const payload = {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone
            };
            if (editForm.password && editForm.password.trim().length > 0) {
                payload.password = editForm.password;
            }
            await entityService.update(editingEntity.id, payload);
            setShowEditModal(false);
            setEditingEntity(null);
            setEditForm({ name: '', email: '', phone: '', password: '' });
            loadEntities();
        } catch (e) {
            alert(e.response?.data?.error || "Error updating entity");
        }
    };

    const filteredEntities = entities.filter(e => {
        const term = search.toLowerCase();
        return (
            e.name.toLowerCase().includes(term) ||
            e.phone.includes(term) ||
            (e.serial && e.serial.toLowerCase().includes(term))
        );
    });

    return (
        <div className="max-w-[1200px] mx-auto my-8 px-8 w-full">
            <header className="mb-8 flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Manage Entities</h1>
                    <p className="text-slate-500">Create, approve, and update entities</p>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <input
                        type="text"
                        placeholder="Search by Name, Serial (E1), or Phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 lg:w-80 py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button onClick={() => setShowCreateModal(true)} className="px-4 py-3 bg-primary text-white rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 whitespace-nowrap">
                        + New Entity
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-xl p-4 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left border-b border-slate-200 text-slate-500">
                            <th className="p-4">ID</th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntities.map(entity => (
                            <tr key={entity.id} className="border-b border-slate-100">
                                <td className="p-4 font-medium">{entity.serial}</td>
                                <td className="p-4">{entity.name}</td>
                                <td className="p-4">{entity.phone}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-sm ${entity.approved === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {entity.approved === 'true' ? 'Active' : 'Pending'}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(entity)}
                                        className="bg-blue-500 text-white border-none rounded-md px-3 py-2 cursor-pointer hover:bg-blue-600 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    {entity.approved !== 'true' && (
                                        <button
                                            onClick={() => handleApprove(entity.id)}
                                            className="bg-green-500 text-white border-none rounded-md px-3 py-2 cursor-pointer hover:bg-green-600 transition-colors"
                                        >
                                            Approve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredEntities.length === 0 && <p className="text-center py-8 text-slate-400">No entities found.</p>}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
                    <div className="bg-white w-full max-w-[440px] p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4">
                        <h2 className="m-0 mb-8 text-3xl font-bold text-center text-slate-900 tracking-tight">Create Entity</h2>
                        <form onSubmit={handleCreate} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Name</label>
                                <input 
                                    value={newEntity.name} 
                                    onChange={e => setNewEntity({ ...newEntity, name: e.target.value })} 
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone</label>
                                <PhoneInput onChange={setPhoneData} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    value={newEntity.email} 
                                    onChange={e => setNewEntity({ ...newEntity, email: e.target.value })} 
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Password</label>
                                <input 
                                    type="password" 
                                    value={newEntity.password} 
                                    onChange={e => setNewEntity({ ...newEntity, password: e.target.value })} 
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowCreateModal(false)} 
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingEntity && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
                    <div className="bg-white w-full max-w-[440px] p-12 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4">
                        <h2 className="m-0 mb-8 text-3xl font-bold text-center text-slate-900 tracking-tight">Edit Entity</h2>
                        <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Name</label>
                                <input 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email (Optional)</label>
                                <input 
                                    type="email" 
                                    value={editForm.email} 
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">New Password (optional)</label>
                                <input 
                                    type="password" 
                                    value={editForm.password} 
                                    onChange={e => setEditForm({ ...editForm, password: e.target.value })} 
                                    placeholder="Leave blank to keep current password"
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => { setShowEditModal(false); setEditingEntity(null); }}
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
