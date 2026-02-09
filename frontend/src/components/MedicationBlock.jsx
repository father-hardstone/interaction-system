import React from 'react';
import PatientHealthWarningTooltip from './PatientHealthWarningTooltip';

const DOSAGE_UNITS = ['', 'mg', 'g', 'mcg', 'ml', 'L', 'IU', 'units', 'puffs', 'drops', 'patch', 'suppository'];

const MedicationBlock = ({ visitor, medications, addMedication, updateMedication, removeMedication }) => {
    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                    <div className="text-lg font-bold text-slate-900 normal-case">Medications</div>
                    <PatientHealthWarningTooltip visitor={visitor} />
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

            <div className="space-y-4">
                {medications.map((med, index) => (
                        <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group/med shadow-sm transition-all hover:border-blue-200">
                            <button
                                type="button"
                                onClick={() => removeMedication(index)}
                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/med:opacity-100 p-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
                                <div className="lg:col-span-3">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Medication Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-semibold placeholder:text-slate-300"
                                        placeholder="e.g. Amoxicillin..."
                                        value={med.name}
                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Amount</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium tabular-nums"
                                        placeholder="500"
                                        value={med.dosageAmount ?? ''}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/[^0-9.]/g, '');
                                            updateMedication(index, 'dosageAmount', v);
                                        }}
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Unit</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-semibold"
                                        value={med.dosageUnit ?? ''}
                                        onChange={(e) => updateMedication(index, 'dosageUnit', e.target.value)}
                                    >
                                        {DOSAGE_UNITS.map(u => (
                                            <option key={u} value={u}>{u || '—'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Form</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-semibold"
                                        value={med.suspension}
                                        onChange={(e) => updateMedication(index, 'suspension', e.target.value)}
                                    >
                                        <option value="tablet">Tablet</option>
                                        <option value="capsule">Capsule</option>
                                        <option value="liquid">Liquid</option>
                                        <option value="injection">Injection</option>
                                        <option value="topical">Topical</option>
                                        <option value="inhaler">Inhaler</option>
                                        <option value="drops">Drops</option>
                                    </select>
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Frequency</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium"
                                        placeholder="BID..."
                                        value={med.frequency}
                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Refills</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-semibold"
                                        value={med.refills}
                                        onChange={(e) => updateMedication(index, 'refills', e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-sm font-bold text-slate-700 normal-case mb-1.5 block px-1">Duration</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium"
                                        placeholder="7 days..."
                                        value={med.duration}
                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                {medications.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 font-medium italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        No medications listed.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicationBlock;
