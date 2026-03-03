/**
 * Pie chart: interaction status breakdown (Total, Cancelled, Closed, Billed).
 * data = { total, cancelled, closed, billed, active }
 */
import { useState } from 'react';
import Spinner from './Spinner';

const SEGMENTS = [
  { key: 'active', label: 'Active', color: '#3b82f6' },
  { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  { key: 'closed', label: 'Closed', color: '#22c55e' },
  { key: 'billed', label: 'Billed', color: '#8b5cf6' },
];

const SIZE = 200;
const STROKE = 28;

export default function EntityDashboardPieChart({ data, isLoading }) {
  const safeData = data ?? {};
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Interaction Status</h2>
        <div className="flex items-center justify-center" style={{ minHeight: SIZE + 120 }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const total = safeData.total ?? 0;
  const active = safeData.active ?? 0;
  const cancelled = safeData.cancelled ?? 0;
  const closed = safeData.closed ?? 0;
  const billed = safeData.billed ?? 0;
  const sum = active + cancelled + closed + billed;

  if (sum === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Interaction Status</h2>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm">
          <p>No interactions yet</p>
        </div>
      </div>
    );
  }

  const r = (SIZE - STROKE) / 2;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  let offset = 0;
  const parts = [
    { key: 'active', value: active, color: '#3b82f6' },
    { key: 'cancelled', value: cancelled, color: '#ef4444' },
    { key: 'closed', value: closed, color: '#22c55e' },
    { key: 'billed', value: billed, color: '#8b5cf6' },
  ].filter((p) => p.value > 0);

  const arcs = parts.map((p) => {
    const fraction = p.value / sum;
    const angle = fraction * 360;
    const startAngle = offset;
    offset += angle;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, startAngle + angle);
    const largeArc = angle > 180 ? 1 : 0;
    const d = [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', r, r, 0, largeArc, 1, end.x, end.y,
      'Z',
    ].join(' ');
    return { ...p, d };
  });

  function polarToCartesian(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const [hovered, setHovered] = useState(null);
  const [pressed, setPressed] = useState(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Interaction Status</h2>
      <div className="flex flex-col items-center gap-5">
        <div className="flex-shrink-0">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="overflow-visible">
            {arcs.map((arc) => {
              const isHovered = hovered === arc.key;
              const isPressed = pressed === arc.key;
              const scale = isPressed ? 0.96 : isHovered ? 1.08 : 1;
              return (
                <g
                  key={arc.key}
                  onMouseEnter={() => setHovered(arc.key)}
                  onMouseLeave={() => { setHovered(null); setPressed(null); }}
                  onMouseDown={() => setPressed(arc.key)}
                  onMouseUp={() => setPressed(null)}
                  onMouseOut={() => setPressed(null)}
                  style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: `scale(${scale})`,
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer',
                  }}
                >
                  <path
                    d={arc.d}
                    fill={arc.color}
                    stroke="white"
                    strokeWidth={2}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-700">Total</span>
            <span className="text-sm font-bold text-slate-900">{total}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {SEGMENTS.map((s) => {
              const val = safeData[s.key] ?? 0;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
