/**
 * Generates a simple lab requisition form image (canvas) from structured fields.
 * Returns a data URL for the image (image/png).
 *
 * This is intentionally lightweight (no external deps). We can refine template later.
 */
export async function generateLabRequisitionImage(options) {
  const {
    clinicName = '',
    clinicianName = '',
    clinicianPhone = '',
    clinicianFax = '',
    patientFirstName = '',
    patientLastName = '',
    patientDob = '',
    patientHealthCard = '',
    patientPhone = '',
    patientAddress = '',
    tests = {},
    notes = '',
    date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  } = options || {};

  const scale = 2;
  const width = Math.round(612 * scale);
  const height = Math.round(792 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const fontSans = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
  const px = Math.round(40 * scale);
  const maxW = width - 2 * px;
  let y = Math.round(36 * scale);

  const drawLine = () => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(width - px, y);
    ctx.stroke();
    y += Math.round(18 * scale);
  };

  const drawLabelValue = (label, value, opts = {}) => {
    const { labelW = Math.round(140 * scale), lineH = Math.round(22 * scale) } = opts;
    ctx.font = `600 ${Math.round(12 * scale)}px ${fontSans}`;
    ctx.fillStyle = '#334155';
    ctx.textBaseline = 'top';
    ctx.fillText(label, px, y);

    ctx.font = `${Math.round(13 * scale)}px ${fontSans}`;
    ctx.fillStyle = '#0f172a';
    const v = value && String(value).trim() ? String(value).trim() : '—';
    ctx.fillText(v, px + labelW, y);
    y += lineH;
  };

  const wrapText = (text, x, startY, maxWidth, lineHeight) => {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    let line = '';
    let y0 = startY;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      const m = ctx.measureText(test).width;
      if (m > maxWidth && line) {
        ctx.fillText(line, x, y0);
        y0 += lineHeight;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, x, y0);
      y0 += lineHeight;
    }
    return y0;
  };

  // Header
  ctx.font = `700 ${Math.round(20 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('LABORATORY REQUISITION', px, y);
  y += Math.round(26 * scale);

  ctx.font = `${Math.round(12 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(`Date: ${date}`, px, y);
  y += Math.round(18 * scale);
  drawLine();

  // Clinic / clinician
  ctx.font = `700 ${Math.round(13 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Clinician / Clinic', px, y);
  y += Math.round(20 * scale);

  drawLabelValue('Clinic:', clinicName);
  drawLabelValue('Clinician:', clinicianName);
  drawLabelValue('Phone:', clinicianPhone);
  drawLabelValue('Fax:', clinicianFax);
  y += Math.round(8 * scale);
  drawLine();

  // Patient
  ctx.font = `700 ${Math.round(13 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Patient information', px, y);
  y += Math.round(20 * scale);

  const patientName = [patientFirstName, patientLastName].filter(Boolean).join(' ').trim();
  drawLabelValue('Name:', patientName);
  drawLabelValue('DOB:', patientDob);
  drawLabelValue('Health card:', patientHealthCard);
  drawLabelValue('Phone:', patientPhone);
  drawLabelValue('Address:', patientAddress, { labelW: Math.round(140 * scale), lineH: Math.round(38 * scale) });
  y += Math.round(8 * scale);
  drawLine();

  // Tests
  ctx.font = `700 ${Math.round(13 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Requested tests', px, y);
  y += Math.round(18 * scale);

  const selected = [];
  const pushIf = (key, label) => {
    if (tests && tests[key]) selected.push(label);
  };
  pushIf('glucose', 'Glucose');
  pushIf('hba1c', 'HbA1c');
  pushIf('creatinine', 'Creatinine / eGFR');
  pushIf('lipids', 'Lipid profile');
  pushIf('cbc', 'CBC');
  pushIf('inr', 'PT / INR');
  pushIf('pregnancy', 'Pregnancy test (urine)');
  pushIf('hepatitisB', 'Hepatitis B panel');
  pushIf('hepatitisC', 'Hepatitis C panel');
  pushIf('hiv', 'HIV screening');
  if (tests && tests.otherTest && String(tests.otherTest).trim()) {
    selected.push(`Other: ${String(tests.otherTest).trim()}`);
  }
  const testsText = selected.length ? selected.join(' • ') : '—';

  ctx.font = `${Math.round(12.5 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  y = wrapText(testsText, px, y, maxW, Math.round(18 * scale));
  y += Math.round(12 * scale);
  drawLine();

  // Notes
  ctx.font = `700 ${Math.round(13 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Clinical information / notes', px, y);
  y += Math.round(18 * scale);

  ctx.font = `${Math.round(12.5 * scale)}px ${fontSans}`;
  ctx.fillStyle = '#0f172a';
  const notesText = notes && String(notes).trim() ? String(notes).trim() : '—';
  wrapText(notesText, px, y, maxW, Math.round(18 * scale));

  return canvas.toDataURL('image/png');
}

