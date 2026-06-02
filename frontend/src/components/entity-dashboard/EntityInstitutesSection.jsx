import { useEffect, useMemo, useState } from 'react';
import { instituteService } from '../../services/instituteService';
import { IconBuilding, IconPlus } from './icons';
import LoadingButton from './LoadingButton';

const TYPES = [
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'lab', label: 'Lab' },
  { id: 'other', label: 'Other' },
];

const emptyForm = {
  name: '',
  type: 'other',
  email: '',
  fax: '',
  phone: '',
  address: '',
};

function Modal({ open, title, children, onClose, disableClose = false }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disableClose) onClose?.();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => !disableClose && onClose?.()}
            disabled={disableClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function EntityInstitutesSection({ entityId, entityName }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const openCreate = () => {
    setEditingId('');
    setForm(emptyForm);
    setSuccess('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (inst) => {
    setEditingId(inst.id);
    setForm({
      name: inst.name || '',
      type: inst.type || 'other',
      email: inst.email || '',
      fax: inst.fax || '',
      phone: inst.phone || '',
      address: inst.address || '',
    });
    setSuccess('');
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalOpen(false);
    setEditingId('');
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;
    setError('');
    setSuccess('');
    try {
      setIsSubmitting(true);
      if (isEditing) await instituteService.update(editingId, form);
      else await instituteService.create(form);
      setSuccess(isEditing ? 'Institute updated' : 'Institute created');
      setModalOpen(false);
      setEditingId('');
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
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
      setError(err?.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <IconBuilding />
          <h1 className="text-xl font-semibold text-slate-900">{entityName || 'Clinic'}</h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
        >
          <IconPlus />
          Create institute
        </button>
      </div>

      {(error || success) && (
        <div className="mb-4 space-y-2">
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">Institutes</div>
          <div className="text-xs text-slate-500 font-semibold">{items.length}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[260px]">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[120px]">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider">Fax</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 font-semibold">Loading…</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500 font-semibold">No institutes yet.</td>
                </tr>
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
                          onClick={() => openEdit(it)}
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

      <Modal
        open={modalOpen}
        title={isEditing ? 'Edit institute' : 'Create institute'}
        onClose={closeModal}
        disableClose={isSubmitting}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <fieldset disabled={isSubmitting} className="contents border-0 p-0 m-0 min-w-0">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. Downtown Pharmacy"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Fax</label>
            <input
              value={form.fax}
              onChange={(e) => setForm((p) => ({ ...p, fax: e.target.value }))}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Optional"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-500">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Optional"
            />
          </div>
          </fieldset>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <LoadingButton
              loading={isSubmitting}
              loadingLabel={isEditing ? 'Saving…' : 'Creating…'}
              disabled={!canSubmit}
              className="px-5 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isEditing ? 'Save changes' : 'Create'}
            </LoadingButton>
          </div>
        </form>
      </Modal>
    </>
  );
}

