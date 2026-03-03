import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from './icons';

export default function EntityDashboardCalendar() {
  const [calendarMonth, setCalendarMonth] = useState({ year: 2024, month: 0 });
  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate();
  const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const highlightDay = calendarMonth.year === 2024 && calendarMonth.month === 0 ? 23 : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">{monthLabel}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() =>
              setCalendarMonth((m) => ({ ...m, month: Math.max(0, m.month - 1) }))
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <IconChevronLeft />
          </button>
          <button
            type="button"
            onClick={() =>
              setCalendarMonth((m) => ({ ...m, month: Math.min(11, m.month + 1) }))
            }
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <IconChevronRight />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {calendarDays.map((d, i) => (
          <div
            key={i}
            className="aspect-square flex items-center justify-center rounded-full text-sm text-slate-700 hover:bg-slate-100"
          >
            {d != null ? (
              d === highlightDay ? (
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold">
                  {d}
                </span>
              ) : (
                d
              )
            ) : (
              ''
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
