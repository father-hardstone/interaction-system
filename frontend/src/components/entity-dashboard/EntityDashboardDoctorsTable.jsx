/** Officers table for Entity Dashboard – shown in Doctors tab. */

import { useState } from 'react';
import FeatureComingSoonModal from './FeatureComingSoonModal';

export default function EntityDashboardDoctorsTable({
  officers = [],
  onAddOfficer,
  onDeleteOfficer,
}) {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Doctors</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your officers (doctors)</p>
        </div>
        <button
          type="button"
          onClick={onAddOfficer}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold text-sm hover:bg-blue-600 transition-colors"
        >
          Add a doctor
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
            {officers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No doctors found. Click &quot;Add a doctor&quot; to get started.
                </td>
              </tr>
            ) : (
              officers.map((officer) => (
                <tr
                  key={officer.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{officer.serial}</td>
                  <td className="px-6 py-4 text-slate-700">{officer.name}</td>
                  <td className="px-6 py-4 text-slate-700">{officer.phone}</td>
                  <td className="px-6 py-4 text-slate-700">{officer.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        officer.active === 'true' && officer.approved === 'true'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {officer.active === 'true' && officer.approved === 'true'
                        ? 'Active'
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEditModal(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            window.confirm('Are you sure you want to delete this officer?')
                          ) {
                            await onDeleteOfficer(officer.id);
                          }
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
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
      <FeatureComingSoonModal open={showEditModal} onClose={() => setShowEditModal(false)} />
    </div>
  );
}
