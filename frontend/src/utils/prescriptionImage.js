/** Load an image from URL; resolves with the Image when loaded, rejects on error. */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Generates an HD prescription pad image (canvas) matching the clinic template.
 * Returns a data URL for the image; open in new tab with window.open(url).
 * Uses 2.5x resolution, larger fonts, and the RX icon from /icons/RX-icon.png.
 *
 * @param {{ doctorName: string, doctorBillingNumber?: string, patientName: string, patientDob?: string, patientHealthCard?: string, medications: Array<{ name?: string, strength?: string, frequency?: string, duration?: string, repeat?: number }>, date?: string }} options
 * @returns {Promise<string>} data URL (image/png)
 */
export async function generatePrescriptionImage(options) {
    const {
        doctorName = '',
        doctorBillingNumber = '',
        patientName = '',
        patientDob = '',
        patientHealthCard = '',
        medications = [],
        date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
    } = options;

    // HD: 2.5x letter size for sharp rendering and bigger text
    const scale = 2.5;
    const width = Math.round(612 * scale);   // 1530
    const height = Math.round(792 * scale);  // 1980
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Crisp text
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    const px = Math.round(48 * scale);   // 120
    const maxW = width - 2 * px;
    let y = Math.round(44 * scale);      // 110

    // Font stack for clarity (system fonts that render well)
    const fontSans = "'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
    const fontSerif = "Georgia, 'Times New Roman', serif";

    // ----- Header -----
    ctx.font = `bold ${Math.round(28 * scale)}px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('MEDICAL WALK-IN CLINIC', width / 2, y);
    y += Math.round(32 * scale);
    ctx.font = `${Math.round(18 * scale)}px ${fontSans}`;
    ctx.fillText('Family Physicians', width / 2, y);
    y += Math.round(36 * scale);

    // Doctor & Billing Number
    ctx.textAlign = 'left';
    const drText = (doctorName && String(doctorName).trim())
        ? `DR. ${String(doctorName).trim().toUpperCase()}`
        : 'DR. ';
    ctx.font = `bold ${Math.round(20 * scale)}px ${fontSans}`;
    ctx.fillText(drText, px, y);

    if (doctorBillingNumber) {
        ctx.textAlign = 'right';
        ctx.font = `${Math.round(18 * scale)}px ${fontSans}`;
        ctx.fillText(`Billing #: ${doctorBillingNumber}`, width - px, y);
    }
    y += Math.round(32 * scale);

    // Address and contact
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(16 * scale)}px ${fontSans}`;
    ctx.fillText('3737 MAJOR MACKENZIE DR., SUITE 104, WOODBRIDGE, ON L4H 0A2', width / 2, y);
    y += Math.round(22 * scale);
    ctx.font = `${Math.round(14 * scale)}px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('TEL: (905) 417-7771', px, y);
    ctx.textAlign = 'right';
    ctx.fillText('FAX: (905) 417-1377', width - px, y);
    ctx.textAlign = 'left';
    y += Math.round(28 * scale);

    // Horizontal line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(width - px, y);
    ctx.stroke();
    y += Math.round(32 * scale);

    // Date and patient details
    ctx.font = `${Math.round(18 * scale)}px ${fontSans}`;
    ctx.fillText(`Date: ${date}`, px, y);
    y += Math.round(28 * scale);

    let pNameLine = `Patient Name: ${patientName || '.................................................'}`;
    if (patientDob) pNameLine += `  (DOB: ${patientDob})`;

    ctx.font = `bold ${Math.round(18 * scale)}px ${fontSans}`;
    ctx.fillText(pNameLine, px, y);
    y += Math.round(28 * scale);

    if (patientHealthCard) {
        ctx.font = `${Math.round(16 * scale)}px ${fontSans}`;
        ctx.fillText(`Health Card #: ${patientHealthCard}`, px, y);
        y += Math.round(32 * scale);
    }


    // Rx icon – slightly smaller; meds will start at px + rxIconSize (to the right of icon)
    const rxIconSize = Math.round(56 * scale);
    try {
        const base = typeof window !== 'undefined' && window.location ? window.location.origin : '';
        const rxImg = await loadImage(`${base}/icons/RX-icon.png`);
        ctx.drawImage(rxImg, px, y, rxIconSize, rxIconSize);
        y += rxIconSize + Math.round(8 * scale);
    } catch {
        ctx.font = `${Math.round(30 * scale)}px ${fontSerif}`;
        ctx.fillText('℞', px, y);
        y += Math.round(40 * scale);
    }
    const medLeft = px + rxIconSize;

    // Medication lines – indented to the right of Rx (same padding as icon width)
    const medFontSize = Math.round(18 * scale);
    const medLineHeight = Math.round(28 * scale);
    ctx.font = `${medFontSize}px ${fontSans}`;
    const medLines = medications
        .filter(m => m && String(m.name || '').trim())
        .map(m => {
            const name = String(m.name || '').trim();
            const strength = String(m.strength || '').trim();
            const frequency = String(m.frequency || '').trim();
            const duration = String(m.duration || '').trim();
            const repeat = m.repeat != null && m.repeat > 0 ? Number(m.repeat) : null;
            const parts = [name];
            if (strength) parts.push(strength);
            if (frequency) parts.push(frequency);
            if (duration) parts.push(duration);
            let line = parts.join(', ');
            if (repeat != null && repeat > 0) line += ` Refill: ${repeat}`;
            return line;
        });
    for (const line of medLines) {
        ctx.fillText(line, medLeft, y);
        y += medLineHeight;
    }
    if (medLines.length === 0) {
        y += medLineHeight;
    }

    // ----- End section: push allergies and signature to the bottom -----
    const bottomSectionTop = height - Math.round(160 * scale);
    if (y < bottomSectionTop) {
        y = bottomSectionTop;
    }
    y += Math.round(24 * scale);

    // Allergies line – at the end, bigger font
    ctx.font = `${Math.round(18 * scale)}px ${fontSans}`;
    ctx.fillText('• Please Check Drug I/A & Allergies—Call if Concerns', px, y);
    y += Math.round(40 * scale);

    // Signature line – full width between paddings: "Signature" + underline + ", M.D."
    const sigFontSize = Math.round(20 * scale);
    ctx.font = `${sigFontSize}px ${fontSans}`;
    const sigLabel = 'Signature';
    const sigSuffix = ', M.D.';
    const gap = Math.round(8 * scale);
    const sigLabelW = ctx.measureText(sigLabel).width;
    const suffixW = ctx.measureText(sigSuffix).width;
    ctx.fillText(sigLabel, px, y);
    ctx.fillText(sigSuffix, width - px - suffixW, y);
    // Underline at bottom of the text line (not middle)
    const lineY = y + sigFontSize + Math.round(2 * scale);
    ctx.beginPath();
    ctx.moveTo(px + sigLabelW + gap, lineY);
    ctx.lineTo(width - px - suffixW - gap, lineY);
    ctx.stroke();
    y += sigFontSize + Math.round(8 * scale);

    return canvas.toDataURL('image/png');
}
