import { useEffect, useMemo, useState } from 'react';

const SECTION_LABEL_CLASS =
  'text-xs font-semibold text-slate-500 tracking-[0.18em] uppercase mb-2 block';

const FIELD_LABEL_CLASS = 'text-xs font-medium text-slate-500 mb-1 block';

export default function LabRequisitionForm({ prefill, onDraftChange, onGenerate }) {
  const [form, setForm] = useState({
    clinicianName: '',
    clinicName: '',
    clinicianPhone: '',
    clinicianFax: '',
    patientLastName: '',
    patientFirstName: '',
    patientDob: '',
    patientHealthCard: '',
    patientPhone: '',
    patientAddress: '',
    notes: '',
  });

  useEffect(() => {
    if (!prefill) return;
    setForm((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(prefill)) {
        if (!(k in next)) continue;
        const cur = next[k];
        const curEmpty = cur == null || String(cur).trim() === '';
        const incomingEmpty = v == null || String(v).trim() === '';
        if (curEmpty && !incomingEmpty) next[k] = v;
      }
      return next;
    });
  }, [prefill]);

  const [selectedTests, setSelectedTests] = useState({
    // Biochemistry
    glucose: false,
    hba1c: false,
    creatinine: false,
    lipids: false,
    // Hematology
    cbc: false,
    inr: false,
    pregnancy: false,
    // Immunology / serology
    hepatitisB: false,
    hepatitisC: false,
    hiv: false,
    // Other
    otherTest: '',
  });

  const payload = useMemo(() => ({ ...form, tests: selectedTests }), [form, selectedTests]);

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => {
      const next = { ...prev, [field]: e.target.value };
      onDraftChange?.({ ...next, tests: selectedTests });
      return next;
    });
  };

  const handleTestToggle = (field) => (e) => {
    setSelectedTests((prev) => {
      const next = { ...prev, [field]: e.target.checked };
      onDraftChange?.({ ...form, tests: next });
      return next;
    });
  };

  const handleOtherTestChange = (e) => {
    const value = e.target.value;
    setSelectedTests((prev) => {
      const next = { ...prev, otherTest: value };
      onDraftChange?.({ ...form, tests: next });
      return next;
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Laboratory Requisition
        </h1>
        <p className="text-xs text-slate-500">
          Please complete all relevant sections. This form is not yet submitted to any
          laboratory system.
        </p>
      </div>

      {/* Clinician / Clinic section */}
      <section className="space-y-3">
        <span className={SECTION_LABEL_CLASS}>Clinician / clinic</span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className={FIELD_LABEL_CLASS}>Clinician / practitioner name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.clinicianName}
              onChange={handleFieldChange('clinicianName')}
            />
          </div>
          <div className="md:col-span-2">
            <label className={FIELD_LABEL_CLASS}>Clinic name / address</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.clinicName}
              onChange={handleFieldChange('clinicName')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASS}>Phone</label>
            <input
              type="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.clinicianPhone}
              onChange={handleFieldChange('clinicianPhone')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASS}>Fax</label>
            <input
              type="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.clinicianFax}
              onChange={handleFieldChange('clinicianFax')}
            />
          </div>
        </div>
      </section>

      {/* Patient section */}
      <section className="space-y-3">
        <span className={SECTION_LABEL_CLASS}>Patient information</span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={FIELD_LABEL_CLASS}>Last name</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.patientLastName}
              onChange={handleFieldChange('patientLastName')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASS}>First &amp; middle names</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.patientFirstName}
              onChange={handleFieldChange('patientFirstName')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASS}>Date of birth</label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.patientDob}
              onChange={handleFieldChange('patientDob')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASS}>Health card number</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.patientHealthCard}
              onChange={handleFieldChange('patientHealthCard')}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASS}>Patient phone</label>
            <input
              type="tel"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.patientPhone}
              onChange={handleFieldChange('patientPhone')}
            />
          </div>
          <div className="md:col-span-3">
            <label className={FIELD_LABEL_CLASS}>Patient address</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              value={form.patientAddress}
              onChange={handleFieldChange('patientAddress')}
            />
          </div>
        </div>
      </section>

      {/* Tests section */}
      <section className="space-y-3">
        <span className={SECTION_LABEL_CLASS}>Requested tests</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Biochemistry
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.glucose}
                onChange={handleTestToggle('glucose')}
              />
              Glucose
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.hba1c}
                onChange={handleTestToggle('hba1c')}
              />
              HbA1c
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.creatinine}
                onChange={handleTestToggle('creatinine')}
              />
              Creatinine / eGFR
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.lipids}
                onChange={handleTestToggle('lipids')}
              />
              Lipid profile
            </label>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Hematology
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.cbc}
                onChange={handleTestToggle('cbc')}
              />
              CBC
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.inr}
                onChange={handleTestToggle('inr')}
              />
              PT / INR
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.pregnancy}
                onChange={handleTestToggle('pregnancy')}
              />
              Pregnancy test (urine)
            </label>
          </div>

          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60">
            <div className="text-xs font-semibold text-slate-600 mb-2">
              Immunology / serology
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.hepatitisB}
                onChange={handleTestToggle('hepatitisB')}
              />
              Hepatitis B panel
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.hepatitisC}
                onChange={handleTestToggle('hepatitisC')}
              />
              Hepatitis C panel
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 mb-1.5">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-blue-500"
                checked={selectedTests.hiv}
                onChange={handleTestToggle('hiv')}
              />
              HIV screening
            </label>
            <div className="mt-2">
              <label className={FIELD_LABEL_CLASS}>Other tests (specify)</label>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                value={selectedTests.otherTest}
                onChange={handleOtherTestChange}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Clinical notes */}
      <section className="space-y-2">
        <span className={SECTION_LABEL_CLASS}>Clinical information / notes</span>
        <textarea
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          value={form.notes}
          onChange={handleFieldChange('notes')}
          placeholder="Relevant diagnosis, clinical information, special handling or timing requirements…"
        />
      </section>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
        <button
          type="button"
          onClick={() => onGenerate?.(payload)}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
        >
          Generate referral
        </button>
      </div>
    </div>
  );
}

