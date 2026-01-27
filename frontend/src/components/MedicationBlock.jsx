import React from 'react';

const MedicationBlock = ({ medications, addMedication, updateMedication, removeMedication }) => {
    return (
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">Clinical Prescription</label>
                        <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">Medications / Rx</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={addMedication}
                        className="text-[10px] px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-black hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-100 uppercase"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 mb-3">
                                <div className="lg:col-span-3">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Medication Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-bold placeholder:text-slate-300"
                                        placeholder="e.g. Amoxicillin..."
                                        value={med.name}
                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Dosage</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium"
                                        placeholder="500mg..."
                                        value={med.dosage}
                                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Form</label>
                                    <select
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-bold"
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
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Frequency</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium"
                                        placeholder="BID..."
                                        value={med.frequency}
                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Refills</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-bold"
                                        value={med.refills}
                                        onChange={(e) => updateMedication(index, 'refills', e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Duration</label>
                                    <input
                                        type="text"
                                        className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium"
                                        placeholder="7 days..."
                                        value={med.duration}
                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 block px-1">Instructions / Note</label>
                                <input
                                    type="text"
                                    className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:border-blue-500 transition-all font-medium"
                                    placeholder="e.g. Take with food..."
                                    value={med.instructions}
                                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                />
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
        </div>
    );
};

export default MedicationBlock;
