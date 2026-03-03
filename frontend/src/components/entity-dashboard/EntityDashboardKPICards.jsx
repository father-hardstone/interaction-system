import Spinner from './Spinner';

const PERIOD_LABELS = { week: 'week', month: 'month', year: 'year' };

export default function EntityDashboardKPICards({ patientCount, patientCountLoading, revenue, revenueLoading, period = 'week' }) {
  const periodLabel = PERIOD_LABELS[period] || 'week';
  const cards = [
    {
      label: 'Total Patients',
      value: patientCount != null ? String(patientCount) : '—',
      loading: patientCountLoading,
      subtitle: 'All time',
    },
    {
      label: 'Revenue',
      value: revenue != null ? `$${Number(revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
      loading: revenueLoading,
      subtitle: `This ${periodLabel}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-sm font-medium text-slate-500 mb-2">{card.label}</p>
          <div className="flex items-center gap-2 min-h-[2.25rem]">
            {card.loading ? (
              <Spinner size="md" />
            ) : (
              <p className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</p>
            )}
          </div>
          {!card.loading && card.subtitle && (
            <p className="text-sm font-medium mt-2 text-slate-500">
              {card.subtitle}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
