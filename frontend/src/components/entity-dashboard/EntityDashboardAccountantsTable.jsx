import { formatPhoneDisplay } from '../../utils/formatUtils';

export default function EntityDashboardAccountantsTable({
  accountants = [],
  onAddAccountant,
  onDeleteAccountant,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Accountants</h2>
          <p className="text-sm text-slate-500 mt-1">Billing and patients access only</p>
        </div>
        <button
          type="button"
          onClick={onAddAccountant}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors"
        >
          Add an accountant
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accountants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No accountants found. Click &quot;Add an accountant&quot; to get started.
                </td>
              </tr>
            ) : (
              accountants.map((acct) => (
                <tr
                  key={acct.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{acct.serial}</td>
                  <td className="px-6 py-4 text-slate-700">{acct.name}</td>
                  <td className="px-6 py-4 text-slate-700">
                    {formatPhoneDisplay(acct.phone) || '—'}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{acct.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        acct.active === 'true' && acct.approved === 'true'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {acct.active === 'true' && acct.approved === 'true' ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          window.confirm(
                            'Are you sure you want to delete this accountant?'
                          )
                        ) {
                          await onDeleteAccountant(acct.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
