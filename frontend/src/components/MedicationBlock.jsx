import React from 'react';

const MedicationBlock = ({ visitor, medications, addMedication, updateMedication, removeMedication }) => {
    const hasRedZone =
        (visitor?.allergies && visitor.allergies !== 'N/A') ||
        (visitor?.drugReactions && visitor.drugReactions !== 'N/A') ||
        (visitor?.specialNotes && visitor.specialNotes !== '-');
    const pastMedicalKeys = [
        { key: 'highBloodPressure', label: 'High blood pressure' },
        { key: 'heartDisease', label: 'Heart disease' },
        { key: 'diabetes', label: 'Diabetes' },
        { key: 'cholesterol', label: 'Cholesterol' },
        { key: 'smoke', label: 'Smoke' }
    ];

    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                    <div className="text-lg font-bold text-slate-900 normal-case">Medications</div>
                </div>
                <button
                    type="button"
                    onClick={addMedication}
                    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-100 normal-case shrink-0"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Prescription
                </button>
            </div>

            {/* Red zone + Past medical conditions — side by side on larger screens */}
            {visitor && (hasRedZone || pastMedicalKeys.some(({ key }) => visitor[key])) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {hasRedZone && (
                        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl min-w-0">
                            <div className="text-xs font-semibold text-red-800 normal-case tracking-wide mb-2">Allergies & reactions</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                <div>
                                    <span className="text-xs font-semibold text-red-900 normal-case block">Allergies</span>
                                    <span className="font-medium text-slate-700">{visitor.allergies || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-red-900 normal-case block">Type of reaction</span>
                                    <span className="font-medium text-slate-700">{visitor.drugReactions || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-red-900 normal-case block">Special notes</span>
                                    <span className="font-medium text-slate-700">{visitor.specialNotes || '-'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {pastMedicalKeys.some(({ key }) => visitor[key]) && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl min-w-0">
                            <div className="text-xs font-semibold text-slate-700 normal-case tracking-wide mb-2">Past medical history</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-1.5 text-sm">
                                {pastMedicalKeys.map(({ key, label }) => {
                                    const val = visitor[key];
                                    const display = (val === 'yes' || val === 'no') ? (val === 'yes' ? 'Yes' : 'No') : '—';
                                    return (
                                        <div key={key}>
                                            <span className="text-xs font-semibold text-slate-600 normal-case block">{label}</span>
                                            <span className="font-medium text-slate-700">{display}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Medications table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 w-full">
                <table className="w-full border-collapse min-w-[520px]">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-10">#</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider min-w-[140px]">Name</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[100px]">Strength</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[100px]">Frequency</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[90px]">Duration</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-[72px]">Repeat</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 normal-case tracking-wider w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medications.map((med, index) => (
                            <tr key={index} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors group/row">
                                <td className="px-3 py-2 align-middle">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <div className="relative w-full min-w-[120px]">
                                        <input
                                            type="text"
                                            className={`w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 ${med.addedLater ? 'pr-24' : ''}`}
                                            placeholder="e.g. Amoxicillin"
                                            value={med.name ?? ''}
                                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                        />
                                        {med.addedLater && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 whitespace-nowrap">Added later</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                        placeholder="e.g. 500mg"
                                        value={med.strength ?? ''}
                                        onChange={(e) => updateMedication(index, 'strength', e.target.value)}
                                    />
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                        placeholder="e.g. BID"
                                        value={med.frequency ?? ''}
                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    />
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <input
                                        type="text"
                                        className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300"
                                        placeholder="e.g. 7 days"
                                        value={med.duration ?? ''}
                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    />
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 tabular-nums"
                                        value={med.repeat ?? 0}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            updateMedication(index, 'repeat', v === '' ? 0 : Math.max(0, parseInt(v, 10) || 0));
                                        }}
                                    />
                                </td>
                                <td className="px-3 py-2 align-middle">
                                    <button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded"
                                        title="Remove row"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {medications.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-medium italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No medications listed. Click &quot;Add Prescription&quot; to add one.
                </div>
            )}
        </div>
    );
};

export default MedicationBlock;
