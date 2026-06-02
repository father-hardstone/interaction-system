import { IconExport, IconBuilding } from './icons';
import EntityDashboardKPICards from './EntityDashboardKPICards';
import EntityDashboardChart from './EntityDashboardChart';
import EntityDashboardPieChart from './EntityDashboardPieChart';
import EntityDashboardDoctorsTable from './EntityDashboardDoctorsTable';
import EntityDashboardEmployeesTable from './EntityDashboardEmployeesTable';
import EntityDashboardAccountantsTable from './EntityDashboardAccountantsTable';
import EntityPatientsSection from './EntityPatientsSection';
import EntityInteractionsSection from './EntityInteractionsSection';
import EntityDashboardTodayInteractions from './EntityDashboardTodayInteractions';
import EntityInstitutesSection from './EntityInstitutesSection';

function DashboardHome({
  entityId,
  chartData,
  chartLoading,
  patientCount,
  patientCountLoading,
  statusCounts,
  statusCountsLoading,
  revenue,
  revenueLoading,
  period,
  onPeriodChange,
  onExportCsv,
}) {
  return (
    <>
      {/* Top row: filter and export on the right */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <button
          type="button"
          onClick={() => onExportCsv?.()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-sm"
        >
          <IconExport />
          Export CSV
        </button>
      </div>

      <div className="mb-8">
        <EntityDashboardKPICards
          patientCount={patientCount}
          patientCountLoading={patientCountLoading}
          revenue={revenue}
          revenueLoading={revenueLoading}
          period={period}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <EntityDashboardChart data={chartData} isLoading={chartLoading} period={period} />
        <EntityDashboardPieChart data={statusCounts} isLoading={statusCountsLoading} />
      </div>
      <EntityDashboardTodayInteractions entityId={entityId} />
    </>
  );
}

function PlaceholderSection({ title }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-500">This section is coming soon.</p>
    </div>
  );
}

const SECTION_TITLES = {
  patients: 'Patients',
  interactions: 'Interactions',
  institutes: 'Institutes',
  payments: 'Payments',
  messages: 'Messages',
  help: 'Help Center',
};

export default function EntityDashboardContent({
  activeSection,
  entityId,
  entitySerial,
  entityName,
  officers,
  receptionists,
  accountants = [],
  chartData = [],
  chartLoading = false,
  patientCount = null,
  patientCountLoading = false,
  statusCounts = null,
  statusCountsLoading = false,
  revenue = null,
  revenueLoading = false,
  period = 'week',
  onPeriodChange = () => {},
  onExportCsv,
  onAddOfficer,
  onAddReceptionist,
  onAddAccountant,
  onDeleteOfficer,
  onDeleteReceptionist,
  onDeleteAccountant,
}) {
  if (activeSection === 'dashboard') {
    return (
      <DashboardHome
        entityId={entityId}
        chartData={chartData}
        chartLoading={chartLoading}
        patientCount={patientCount}
        patientCountLoading={patientCountLoading}
        statusCounts={statusCounts}
        statusCountsLoading={statusCountsLoading}
        revenue={revenue}
        revenueLoading={revenueLoading}
        period={period}
        onPeriodChange={onPeriodChange}
        onExportCsv={onExportCsv}
      />
    );
  }

  if (activeSection === 'doctors') {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <IconBuilding />
            <h1 className="text-xl font-semibold text-slate-900">{entityName}</h1>
          </div>
        </div>
        <EntityDashboardDoctorsTable
          officers={officers}
          onAddOfficer={onAddOfficer}
          onDeleteOfficer={onDeleteOfficer}
        />
      </>
    );
  }

  if (activeSection === 'employees') {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <IconBuilding />
            <h1 className="text-xl font-semibold text-slate-900">{entityName}</h1>
          </div>
        </div>
        <EntityDashboardEmployeesTable
          receptionists={receptionists}
          onAddReceptionist={onAddReceptionist}
          onDeleteReceptionist={onDeleteReceptionist}
        />
        <EntityDashboardAccountantsTable
          accountants={accountants}
          onAddAccountant={onAddAccountant}
          onDeleteAccountant={onDeleteAccountant}
        />
      </>
    );
  }

  if (activeSection === 'patients') {
    return (
      <EntityPatientsSection
        entityId={entityId}
        entitySerial={entitySerial}
        entityName={entityName}
      />
    );
  }

  if (activeSection === 'interactions') {
    return (
      <EntityInteractionsSection
        entityId={entityId}
      />
    );
  }

  if (activeSection === 'institutes') {
    return (
      <EntityInstitutesSection
        entityId={entityId}
        entityName={entityName}
      />
    );
  }

  const title = SECTION_TITLES[activeSection] || 'Section';
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <IconBuilding />
          <h1 className="text-xl font-semibold text-slate-900">{entityName}</h1>
        </div>
      </div>
      <PlaceholderSection title={title} />
    </>
  );
}
