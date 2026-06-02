import { useState, useEffect, useCallback } from 'react';
import { entityService } from '../services/entityService';
import PasswordInput from '../components/PasswordInput';
import LoadingButton from '../components/LoadingButton';

const AdminDashboard = () => {
    const [entities, setEntities] = useState([]);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntity, setEditingEntity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [actionError, setActionError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newEntity, setNewEntity] = useState({ name: '', email: '', password: '' });
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', password: '' });

    const loadEntities = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const data = await entityService.getAll();
            setEntities(data);
        } catch (e) {
            setLoadError(e.response?.data?.error || 'Failed to load entities. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEntities();
    }, [loadEntities]);

    const handleApprove = async (id) => {
        setActionError('');
        try {
            await entityService.approve(id);
            await loadEntities();
        } catch (e) {
            setActionError(e.response?.data?.error || 'Failed to approve entity.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entity?')) return;
        setActionError('');
        try {
            await entityService.delete(id);
            await loadEntities();
        } catch (e) {
            setActionError(e.response?.data?.error || 'Failed to delete entity.');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setActionError('');
        try {
            setIsSubmitting(true);
            const payload = {
                ...newEntity,
                password: newEntity.password,
            };
            await entityService.create(payload);
            setShowCreateModal(false);
            setNewEntity({ name: '', email: '', password: '' });
            await loadEntities();
        } catch (e) {
            setActionError(e.response?.data?.error || 'Error creating entity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeCreateModal = () => {
        if (isSubmitting) return;
        setShowCreateModal(false);
        setNewEntity({ name: '', email: '', password: '' });
    };

    const closeEditModal = () => {
        if (isSubmitting) return;
        setShowEditModal(false);
        setEditingEntity(null);
        setEditForm({ name: '', email: '', phone: '', password: '' });
    };

    const handleEditClick = (entity) => {
        setEditingEntity(entity);
        setEditForm({
            name: entity.name || '',
            email: entity.email || '',
            phone: entity.phone || '',
            password: '',
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingEntity || isSubmitting) return;
        setActionError('');
        try {
            setIsSubmitting(true);
            const payload = {
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone,
            };
            if (editForm.password && editForm.password.trim().length > 0) {
                payload.password = editForm.password;
            }
            await entityService.update(editingEntity.id, payload);
            setShowEditModal(false);
            setEditingEntity(null);
            setEditForm({ name: '', email: '', phone: '', password: '' });
            await loadEntities();
        } catch (e) {
            setActionError(e.response?.data?.error || 'Error updating entity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredEntities = entities.filter((e) => {
        const term = search.toLowerCase();
        return (
            e.name.toLowerCase().includes(term) ||
            (e.phone && e.phone.includes(term)) ||
            (e.serial && e.serial.toLowerCase().includes(term))
        );
    });

    const inputClass =
        'w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-white transition-all text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100';

    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 w-full">
            <header className="mb-8 flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-semibold mb-1 text-slate-900">Manage Entities</h1>
                    <p className="text-slate-500">Create, approve, and update platform entities</p>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <input
                        type="text"
                        placeholder="Search by name, serial, or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 lg:w-80 py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-white transition-all text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-3 bg-primary text-white rounded-xl font-semibold text-base cursor-pointer transition-all shadow-md hover:bg-primary-dark whitespace-nowrap"
                    >
                        + New Entity
                    </button>
                </div>
            </header>

            {actionError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 py-3 px-4 rounded-xl text-sm">
                    {actionError}
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
                        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading entities...
                    </div>
                ) : loadError ? (
                    <div className="text-center py-16 px-6">
                        <p className="text-red-600 mb-4">{loadError}</p>
                        <button
                            type="button"
                            onClick={loadEntities}
                            className="px-4 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left border-b border-slate-200 text-slate-500 text-sm">
                                    <th className="p-4 font-semibold">ID</th>
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Phone</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntities.map((entity) => (
                                    <tr key={entity.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-medium text-slate-700">{entity.serial}</td>
                                        <td className="p-4 text-slate-900">{entity.name}</td>
                                        <td className="p-4 text-slate-600">{entity.phone || '—'}</td>
                                        <td className="p-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    entity.approved === 'true'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {entity.approved === 'true' ? 'Active' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditClick(entity)}
                                                    className="bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                {entity.approved !== 'true' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(entity.id)}
                                                        className="bg-green-600 text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-green-700 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredEntities.length === 0 && (
                            <p className="text-center py-12 text-slate-400">No entities found.</p>
                        )}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div
                    className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4"
                    onClick={() => !isSubmitting && closeCreateModal()}
                >
                    <div
                        className="bg-white w-full max-w-[440px] p-8 sm:p-10 rounded-2xl shadow-xl animate-[slideUp_0.4s_ease-out] border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="m-0 mb-6 text-2xl font-semibold text-center text-slate-900 tracking-tight">Create Entity</h2>
                        <form onSubmit={handleCreate} className="flex flex-col gap-5">
                            <fieldset disabled={isSubmitting} className="flex flex-col gap-5 border-0 p-0 m-0 min-w-0">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Name</label>
                                <input
                                    value={newEntity.name}
                                    onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email</label>
                                <input
                                    type="email"
                                    value={newEntity.email}
                                    onChange={(e) => setNewEntity({ ...newEntity, email: e.target.value })}
                                    placeholder="Entity login email"
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Password</label>
                                <PasswordInput
                                    value={newEntity.password}
                                    onChange={(e) => setNewEntity({ ...newEntity, password: e.target.value })}
                                    required
                                />
                            </div>
                            </fieldset>
                            <div className="flex gap-4 mt-2">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <LoadingButton
                                    loading={isSubmitting}
                                    loadingLabel="Creating…"
                                    className="flex-1 py-3 px-4 bg-primary text-white border-none rounded-xl font-semibold cursor-pointer hover:bg-primary-dark transition-colors"
                                >
                                    Create
                                </LoadingButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editingEntity && (
                <div
                    className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] p-4"
                    onClick={() => !isSubmitting && closeEditModal()}
                >
                    <div
                        className="bg-white w-full max-w-[440px] p-8 sm:p-10 rounded-2xl shadow-xl animate-[slideUp_0.4s_ease-out] border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="m-0 mb-6 text-2xl font-semibold text-center text-slate-900 tracking-tight">Edit Entity</h2>
                        <form onSubmit={handleUpdate} className="flex flex-col gap-5">
                            <fieldset disabled={isSubmitting} className="flex flex-col gap-5 border-0 p-0 m-0 min-w-0">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Name</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">New Password (optional)</label>
                                <PasswordInput
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="Leave blank to keep current password"
                                />
                            </div>
                            </fieldset>
                            <div className="flex gap-4 mt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-800 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <LoadingButton
                                    loading={isSubmitting}
                                    loadingLabel="Saving…"
                                    className="flex-1 py-3 px-4 bg-primary text-white border-none rounded-xl font-semibold cursor-pointer hover:bg-primary-dark transition-colors"
                                >
                                    Save
                                </LoadingButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
