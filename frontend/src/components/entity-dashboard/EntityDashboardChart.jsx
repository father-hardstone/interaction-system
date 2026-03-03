import { Fragment, useState } from 'react';
import Spinner from './Spinner';

/**
 * Bar chart: daily/monthly registered interactions vs completed interactions.
 * data = [{ date?, dateLabel?, dayShort?, registered, completed }, ...]
 * period: 'week' | 'month' | 'year' - for year, aggregates to monthly and shows months on axis.
 */
const CHART_HEIGHT = 200;
const BAR_WIDTH = 20;
const BAR_SCALE_HEADROOM = 20; /* space for hover scale (1.08) so bars aren't clipped */
const Y_AXIS_WIDTH = 36;

function getYAxisTicks(max) {
  if (max <= 0) return [0];
  const steps = 4;
  const step = Math.max(1, Math.ceil(max / steps));
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return [...new Set(ticks)].sort((a, b) => a - b);
}

function getDayShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function getMonthShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function getDateOfMonth(dateStr) {
  if (!dateStr) return '';
  const day = parseInt(dateStr.slice(8, 10), 10);
  return isNaN(day) ? '' : String(day);
}

function getXAxisLabel(dateStr, period) {
  if (period === 'year') return getMonthShort(dateStr);
  if (period === 'month') return getDateOfMonth(dateStr);
  return getDayShort(dateStr);
}

function normalizeChartRows(data, period) {
  const raw = (data || []).map((row) => {
    const date = row.date || row.dateLabel;
    return {
      date,
      dateLabel: row.dateLabel || date,
      dayShort: getXAxisLabel(date, period),
      monthShort: getMonthShort(date),
      registered: row.registered ?? 0,
      completed: row.completed ?? 0,
    };
  });

  if (period === 'year') {
    const byMonth = {};
    raw.forEach((row) => {
      if (!row.date) return;
      const monthKey = row.date.slice(0, 7);
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { date: monthKey + '-01', registered: 0, completed: 0 };
      }
      byMonth[monthKey].registered += row.registered;
      byMonth[monthKey].completed += row.completed;
    });
    const now = new Date();
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = byMonth[monthKey] || { date: monthKey + '-01', registered: 0, completed: 0 };
      last12Months.push({
        ...bucket,
        dateLabel: monthKey,
        dayShort: getMonthShort(bucket.date),
      });
    }
    return last12Months;
  }

  return raw;
}

export default function EntityDashboardChart({ data = [], isLoading, period = 'week' }) {
  const rows = normalizeChartRows(data, period);
  const isMonthly = period === 'year';
  const heading = isMonthly ? 'Monthly Statistics' : 'Daily Statistics';
  const maxVal = Math.max(
    1,
    ...rows.flatMap((row) => [row.registered, row.completed])
  );

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">{isMonthly ? 'Monthly Statistics' : 'Daily Statistics'}</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Registered
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-3 h-3 rounded-full bg-slate-400" /> Completed
          </span>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ height: CHART_HEIGHT }}
          aria-busy="true"
        >
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">{heading}</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Registered
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-3 h-3 rounded-full bg-slate-400" /> Completed
          </span>
        </div>
        <div
          className="flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200"
          style={{ height: CHART_HEIGHT }}
        >
          <span className="text-slate-500 text-sm">
            {isMonthly ? 'No data for this year' : 'No data for the selected period'}
          </span>
        </div>
      </div>
    );
  }

  const yearSections = isMonthly
    ? (() => {
        const sections = [];
        let currentYear = null;
        let currentRows = [];
        rows.forEach((row) => {
          const year = row.dateLabel ? parseInt(row.dateLabel.slice(0, 4), 10) : null;
          if (year !== currentYear) {
            if (currentRows.length > 0) sections.push({ year: currentYear, rows: currentRows });
            currentYear = year;
            currentRows = [];
          }
          currentRows.push(row);
        });
        if (currentRows.length > 0) sections.push({ year: currentYear, rows: currentRows });
        return sections;
      })()
    : null;

  const [hoveredBar, setHoveredBar] = useState(null);
  const [pressedBar, setPressedBar] = useState(null);

  const BarSegment = ({ barId, color, height, minH, title }) => {
    const isHovered = hoveredBar === barId;
    const isPressed = pressedBar === barId;
    const scale = isPressed ? 0.97 : isHovered ? 1.08 : 1;
    const shadow = isHovered || isPressed
      ? '0 4px 12px rgba(0,0,0,0.15)'
      : 'none';
    return (
      <div
        role="button"
        tabIndex={0}
        className="rounded-t flex-shrink-0 cursor-pointer"
        style={{
          width: BAR_WIDTH,
          height: Math.max(0, height),
          minHeight: minH,
          backgroundColor: color,
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
          boxShadow: shadow,
          transition: 'transform 0.35s ease-in-out, box-shadow 0.35s ease-in-out',
        }}
        title={title}
        onMouseEnter={() => setHoveredBar(barId)}
        onMouseLeave={() => { setHoveredBar(null); setPressedBar(null); }}
        onMouseDown={() => setPressedBar(barId)}
        onMouseUp={() => setPressedBar(null)}
        onMouseOut={() => setPressedBar(null)}
      />
    );
  };

  const renderBar = (row) => {
    const regH = maxVal > 0 ? (row.registered / maxVal) * CHART_HEIGHT : 0;
    const compH = maxVal > 0 ? (row.completed / maxVal) * CHART_HEIGHT : 0;
    const regId = `${row.dateLabel}-reg`;
    const compId = `${row.dateLabel}-comp`;
    return (
      <div
        key={row.dateLabel}
        className={`flex flex-col items-center gap-1 shrink-0 ${isMonthView ? '' : 'flex-1 min-w-0'}`}
        style={isMonthView ? { minWidth: 28 } : undefined}
      >
        <div
          className="w-full flex justify-center items-end gap-0.5 overflow-visible"
          style={{
            height: barAreaHeight,
            paddingTop: BAR_SCALE_HEADROOM,
          }}
        >
          <BarSegment
            barId={regId}
            color="#3b82f6"
            height={regH}
            minH={row.registered > 0 ? 4 : 0}
            title={`Registered: ${row.registered}`}
          />
          <BarSegment
            barId={compId}
            color="#94a3b8"
            height={compH}
            minH={row.completed > 0 ? 4 : 0}
            title={`Completed: ${row.completed}`}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 truncate w-full text-center">
          {row.dayShort}
        </span>
      </div>
    );
  };

  const yTicks = getYAxisTicks(maxVal);
  const isMonthView = period === 'month';
  const chartMinWidth = isMonthView ? Math.max(rows.length * 28 + (rows.length - 1) * 8, 400) : undefined;

  const barAreaHeight = CHART_HEIGHT + BAR_SCALE_HEADROOM;
  const chartContentHeight = barAreaHeight + 28;
  const YAxis = () => (
    <div
      className="flex flex-col justify-between text-left shrink-0 pr-3"
      style={{ width: Y_AXIS_WIDTH, height: barAreaHeight }}
    >
      {[...yTicks].reverse().map((t) => (
        <span key={t} className="text-xs font-medium text-slate-500">
          {t}
        </span>
      ))}
    </div>
  );

  const chartContent = isMonthly && yearSections && yearSections.length > 0 ? (
    <div className="flex w-full overflow-visible items-start">
      <YAxis />
      <div
        className="flex-1 min-w-0 overflow-x-hidden overflow-y-hidden"
        style={{ height: chartContentHeight }}
      >
        <div className="flex flex-1 min-w-0 items-start gap-0 shrink-0" style={{ minWidth: chartMinWidth, height: chartContentHeight }}>
        {yearSections.map((section, sectionIndex) => (
          <Fragment key={section.year}>
            {sectionIndex > 0 && (
              <div
                key={`sep-${section.year}`}
                className="flex-shrink-0 flex flex-col items-center"
                style={{ width: 24 }}
              >
                <div
                  className="w-px flex-1 bg-slate-300"
                  style={{ minHeight: CHART_HEIGHT + 20 }}
                />
              </div>
            )}
            <div
              className="flex min-w-0 relative"
              style={{
                flex: `${section.rows.length} 1 0`,
                minWidth: 72,
              }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-bold text-slate-300/40"
                style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)' }}
              >
                {section.year}
              </span>
              <div className="flex flex-1 gap-2 justify-between w-full relative z-10">
                {section.rows.map((row) => renderBar(row))}
              </div>
            </div>
          </Fragment>
        ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex w-full overflow-visible items-start">
      <YAxis />
      <div
        className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden"
        style={{ height: chartContentHeight }}
      >
        <div
          className="flex flex-1 items-start gap-2 justify-between shrink-0"
          style={{ height: chartContentHeight, minWidth: chartMinWidth }}
          role="img"
          aria-label={`Bar chart. Registered and completed interactions. Max value ${maxVal}.`}
        >
          {rows.map((row) => renderBar(row))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-slate-900 mb-4">{heading}</h2>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-2 text-sm text-slate-600">
          <span className="w-3 h-3 rounded-full bg-blue-500" /> Registered
        </span>
        <span className="flex items-center gap-2 text-sm text-slate-600">
          <span className="w-3 h-3 rounded-full bg-slate-400" /> Completed
        </span>
      </div>
      <div
        className="flex items-start flex-1"
        style={{ minHeight: chartContentHeight }}
      >
        {chartContent}
      </div>
    </div>
  );
}
