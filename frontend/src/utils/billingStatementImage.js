const fontSans = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

const formatDateLabel = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
};

/**
 * Generate a billing statement image similar to the provided claim listing.
 * @param {{ doctorName?: string, statementFrom?: string, statementTo?: string, rows: Array<{
 *  patientId: string, patientName: string, accountingNumber: string,
 *  serviceDate: string, serviceCode: string, diagnosticCode: string,
 *  lineNumber: number, totalFee: number, feeTypeLabel: string, refDoctor: string
 * }> }} options
 * @returns {Promise<string>} data URL (image/png)
 */
export async function generateBillingStatementImage(options) {
    const {
        doctorName = '',
        statementFrom = '',
        statementTo = '',
        rows = []
    } = options || {};

    // A4 at 300 DPI: 2480 x 3508, keep exact aspect ratio
    const width = 2480;
    const height = 3508;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const marginX = 160;
    const px = marginX;
    let y = 140;

    // Header - clinic + title (centered)
    ctx.font = `bold 64px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('Vellore Medical Walk-in & Cosmetic Clinic', width / 2, y);
    y += 70;

    ctx.font = `48px ${fontSans}`;
    ctx.fillText('Detail Claim Listing by Service Date', width / 2, y);
    y += 60;

    // Doctor name (centered)
    const drLabel = doctorName ? `Dr. ${doctorName}` : 'Dr. __________________';
    ctx.font = `42px ${fontSans}`;
    ctx.fillText(drLabel, width / 2, y);
    y += 50;

    // From / To (centered)
    const fromLabel = statementFrom || (rows[0]?.serviceDate && formatDateLabel(rows[0].serviceDate)) || '';
    const toLabel = statementTo || (rows[rows.length - 1]?.serviceDate && formatDateLabel(rows[rows.length - 1].serviceDate)) || fromLabel;

    ctx.font = `bold 34px ${fontSans}`;
    const rangeText = `From: ${fromLabel || '________'}    To: ${toLabel || '________'}`;
    ctx.fillText(rangeText, width / 2, y);
    y += 55;

    // Statement date (left-aligned, below header block)
    ctx.textAlign = 'left';
    ctx.font = `32px ${fontSans}`;
    ctx.fillText(`Statement Date: ${toLabel || '________'}`, px, y);
    y += 50;

    // Column headers
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(width - px, y);
    ctx.stroke();
    y += 24;

    ctx.font = `32px ${fontSans}`;
    const colX = {
        serviceDate: px,
        patientId: px + 270,
        patientName: px + 500,
        accounting: px + 950,
        service: px + 1220,   // extra gap after accounting
        diag: px + 1400,
        count: px + 1550,
        totalFee: px + 1660,
        type: px + 1840,
        ref: px + 1980
    };

    ctx.fillText('Service Date', colX.serviceDate, y);
    ctx.fillText('Patient ID', colX.patientId, y);
    ctx.fillText('Patient Name', colX.patientName, y);
    ctx.fillText('Accounting #', colX.accounting, y);
    ctx.fillText('Service', colX.service, y);
    ctx.fillText('Diag.', colX.diag, y);
    ctx.fillText('#', colX.count, y);
    ctx.fillText('Total Fee', colX.totalFee, y);
    ctx.fillText('Type', colX.type, y);
    ctx.fillText('RefDocNo', colX.ref, y);
    y += 34;

    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(width - px, y);
    ctx.stroke();
    y += 18;

    // Rows
    const rowHeight = 34;
    let currentDateLabel = '';
    let currentPatientKey = '';
    ctx.font = `30px ${fontSans}`;
    for (const row of rows) {
        if (y + rowHeight > height - 120) break; // simple overflow guard

        const dateLabel = formatDateLabel(row.serviceDate);
        const showDate = dateLabel && dateLabel !== currentDateLabel;
        if (showDate) currentDateLabel = dateLabel;

        const patientKey = `${row.patientId || ''}|${row.accountingNumber || ''}`;
        const isSamePatientBlock = patientKey === currentPatientKey;
        if (!isSamePatientBlock) {
            currentPatientKey = patientKey;
        }

        ctx.fillText(showDate ? dateLabel : '', colX.serviceDate, y);
        ctx.fillText(!isSamePatientBlock ? String(row.patientId || '') : '', colX.patientId, y);
        ctx.fillText(!isSamePatientBlock ? String(row.patientName || '') : '', colX.patientName, y);
        ctx.fillText(String(row.accountingNumber || ''), colX.accounting, y);
        const svc = String(row.serviceCode || '').trim();
        const svcSuffix = svc ? svc.charAt(0).toUpperCase() : '';
        const svcDisplay = svcSuffix ? `${svc}  ${svcSuffix}` : svc;
        ctx.fillText(svcDisplay, colX.service, y);
        ctx.fillText(String(row.diagnosticCode || ''), colX.diag, y);
        ctx.fillText(String(row.lineNumber || ''), colX.count, y);
        ctx.fillText(row.totalFee != null ? row.totalFee.toFixed(2) : '', colX.totalFee, y);
        ctx.fillText(String(row.feeTypeLabel || ''), colX.type, y);
        ctx.fillText(String(row.refDoctor || ''), colX.ref, y);

        y += rowHeight;
    }

    return canvas.toDataURL('image/png');
}

