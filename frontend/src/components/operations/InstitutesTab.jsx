import { useEffect, useMemo, useState } from 'react';
import { instituteService } from '../../services/instituteService';

const TYPES = [
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'lab', label: 'Lab' },
    { id: 'other', label: 'Other' }
];

const emptyForm = {
    name: '',
    type: 'other',
    email: '',
    fax: '',
    phone: '',
    address: ''
};

const InstitutesTab = ({ entityId }) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState('');
    const isEditing = !!editingId;

    const load = async () => {
        if (!entityId) return;
        setIsLoading(true);
        setError('');
        try {
            const list = await instituteService.getByEntity(entityId);
            setItems(list || []);
        } catch (e) {
            setError(e?.response?.data?.error || 'Failed to load institutes');
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    const canSubmit = useMemo(() => !!form.name.trim(), [form.name]);

    const reset = () => {
        setForm(emptyForm);
        setEditingId('');
        setSuccess('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        setSuccess('');
        try {
            if (isEditing) {
                await instituteService.update(editingId, form);
                setSuccess('Institute updated');
            } else {
                await instituteService.create(form);
                setSuccess('Institute created');
            }
            reset();
            await load();
        } catch (err) {
            setError(err?.response?.data?.error || 'Save failed (you may not have permission)');
        }
    };

    const startEdit = (inst) => {
        setEditingId(inst.id);
        setForm({
            name: inst.name || '',
            type: inst.type || 'other',
            email: inst.email || '',
            fax: inst.fax || '',
            phone: inst.phone || '',
            address: inst.address || ''
        });
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this institute?')) return;
        setError('');
        setSuccess('');
        try {
            await instituteService.delete(id);
            setSuccess('Institute deleted');
            await load();
        } catch (err) {
            setError(err?.response?.data?.error || 'Delete failed (you may not have permission)');
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Institutes</h3>
                        <p className="text-sm text-slate-500 mt-1">Pharmacies, labs, and other destinations for outgoing items.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { reset(); load(); }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {(error || success) && (
                    <div className="px-5 pt-4 space-y-2">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                                {success}
                            </div>
                        )}
                    </div>
                )}

                <div className="p-5">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500">Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                placeholder="e.g. Downtown Pharmacy"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                            >
                                {TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500">Phone</label>
                            <input
                                value={form.phone}
                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500">Email</label>
                            <input
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500">Fax</label>
                            <input
                                value={form.fax}
                                onChange={(e) => setForm((p) => ({ ...p, fax: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-500">Address</label>
                            <input
                                value={form.address}
                                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
                                >
                                    Cancel edit
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:bg-slate-200 disabled:text-slate-400"
                            >
                                {isEditing ? 'Update institute' : 'Add institute'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-700">Saved institutes</div>
                    <div className="text-xs text-slate-500 font-semibold">{items.length}</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[260px]">Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[110px]">Type</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider">Fax</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[140px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 font-semibold">Loading…</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 font-semibold">No institutes yet.</td></tr>
                            ) : (
                                items.map((it) => (
                                    <tr key={it.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{it.name}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{it.type || 'other'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{it.email || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-700">{it.fax || '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(it)}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(it.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 border border-red-100"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstitutesTab;

