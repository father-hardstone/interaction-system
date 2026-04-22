import { useEffect, useMemo, useState } from 'react';
import { outgoingLogService } from '../../services/outgoingLogService';
import OutgoingLogPreviewModal from './OutgoingLogPreviewModal';
import { visitorService } from '../../services/visitorService';
import { getVisitorSerialDisplay } from '../../utils/formatUtils';

function formatWhen(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd}-${yyyy} ${hh}:${min}`;
}

function summarizeRecipients(item) {
    const p = item?.recipients?.patient || {};
    const inst = item?.recipients?.institute || {};
    const parts = [];
    if (p.email || p.fax) parts.push(`Patient${p.email ? ` (email: ${p.email})` : ''}${p.fax ? ` (fax: ${p.fax})` : ''}`);
    if (inst.nameSnapshot || inst.email || inst.fax) {
        const name = inst.nameSnapshot || 'Institute';
        parts.push(`${name}${inst.email ? ` (email: ${inst.email})` : ''}${inst.fax ? ` (fax: ${inst.fax})` : ''}`);
    }
    return parts.length ? parts.join(' • ') : '—';
}

const OutgoingLogTab = ({ entityId }) => {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [limit] = useState(200);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [previewItem, setPreviewItem] = useState(null);
    const [patientSerialById, setPatientSerialById] = useState({});

    const load = async () => {
        if (!entityId) return;
        setIsLoading(true);
        setError('');
        try {
            const [res, visitors] = await Promise.all([
                outgoingLogService.listByEntity(entityId, { limit, offset: 0 }),
                visitorService.getByEntity(entityId).catch(() => [])
            ]);
            const newItems = Array.isArray(res?.items) ? res.items : [];
            setTotal(res?.total ?? 0);
            setItems(newItems);

            const list = Array.isArray(visitors) ? visitors : [];
            const map = {};
            for (const v of list) {
                if (!v?.id) continue;
                map[v.id] = getVisitorSerialDisplay(v);
            }
            setPatientSerialById(map);
        } catch (e) {
            setError(e?.response?.data?.error || 'Failed to load outgoing log');
            setItems([]);
            setTotal(0);
            setPatientSerialById({});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Outgoing Log</h3>
                    <p className="text-sm text-slate-500 mt-1">History of prescriptions sent out (print/email/fax).</p>
                </div>
            </div>

            {error && (
                <div className="px-5 pt-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                        {error}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[90px]">ID</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[160px]">Time</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[140px]">Document</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[90px]">Mode</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[220px]">Patient</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 normal-case tracking-wider">Sent to</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 font-semibold">
                                    Loading…
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500 font-semibold">
                                    No outgoing log entries yet.
                                </td>
                            </tr>
                        ) : (
                            items.map((it) => (
                                <tr
                                    key={it.id}
                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 cursor-pointer"
                                    onClick={() => setPreviewItem(it)}
                                    title="Click to preview and send again"
                                >
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 tabular-nums">{it.serial || '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{formatWhen(it.createdAt)}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 capitalize">{it.documentType || '—'}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 uppercase">{it.mode || '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-semibold text-slate-900">{it.patientNameSnapshot || '—'}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">ID: {patientSerialById[it.patientId] || '—'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700">{summarizeRecipients(it)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-semibold">
                    Showing {items.length} of {total}
                </div>
                <div />
            </div>

            <OutgoingLogPreviewModal
                open={!!previewItem}
                onClose={(shouldRefresh) => {
                    setPreviewItem(null);
                    if (shouldRefresh) load();
                }}
                entityId={entityId}
                item={previewItem}
            />
        </div>
    );
};

export default OutgoingLogTab;

