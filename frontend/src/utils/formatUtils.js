/**
 * Format phone for display/input: (XXX) XXX-XXXX (no +1)
 * Accepts: +14168880766, 4168880766, 416-888-0766, etc.
 */
export const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/**
 * Extract digits from phone (strip +1 if present)
 */
export const parsePhoneToDigits = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
};

/** Strip entity prefix from ID (e.g. E2-000001 -> 000001). Never show entity tag in IDs. */
const stripEntityFromId = (val) => {
    if (!val) return '';
    const s = String(val).trim();
    if (s.includes('-')) {
        const num = s.split('-').pop();
        return num ? String(num).padStart(6, '0') : '';
    }
    return s ? String(s).padStart(6, '0') : '';
};

/**
 * Visitor/patient ID display: show only the number part (e.g. 000001), never entity prefix like E2-000001
 */
export const getVisitorSerialDisplay = (visitor) => {
    if (!visitor) return '-';
    const raw = visitor.serial ?? visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial || ''}` : '';
    const out = stripEntityFromId(raw);
    return out || '-';
};

/** Get display serial by visitorId and visitors array */
export const getVisitorSerialDisplayById = (visitorId, visitors = []) => {
    const v = visitors.find((vis) => vis.id === visitorId);
    return getVisitorSerialDisplay(v);
};

/**
 * Health card format: XXXX-XXX-XXX (10 digits)
 * Display and input mask
 */
export const formatHealthCardDisplay = (value) => {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
};

/** Format accounting number as XX-XX-XX */
export const formatAccountingNumber = (v) => {
    const d = String(v || '').replace(/\D/g, '').slice(0, 6);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
};

/** Strip entity prefix from any ID (e.g. E2-REG-000001 -> REG-000001, E2-000001 -> 000001). Never show entity tag. */
export const stripEntityPrefix = (val) => {
    if (!val) return '';
    const s = String(val).trim();
    const idx = s.indexOf('-');
    return idx > 0 ? s.slice(idx + 1) : s;
};

/** Short interaction ID: "E2-REG-000001" -> "I1", "REG-000002" -> "I2". Uses stripped ID. */
export const getShortInteractionId = (serial) => {
    if (!serial) return '-';
    const stripped = stripEntityPrefix(serial) || serial;
    const parts = String(stripped).split('-');
    const last = parts[parts.length - 1] || '';
    const num = parseInt(last, 10);
    if (!isNaN(num)) return `I${num}`;
    return last || '-';
};

/** Interaction/registration serial for display: strip entity prefix. */
export const getInteractionSerialDisplay = (serial) => {
    return stripEntityPrefix(serial) || 'REG-PENDING';
};

/** Queue number for registrations (resets at 8 AM daily). Use in queues/scheduled lists; falls back to serial if no temporarySerial. */
export const getRegistrationDisplayId = (interaction) => {
    if (!interaction) return '—';
    const temp = interaction.temporarySerial;
    if (temp != null && Number(temp) > 0) return String(temp);
    return stripEntityPrefix(interaction.interactionSerial) || 'REG-PENDING';
};

export const parseHealthCardToDigits = (value) => {
    if (!value) return '';
    return String(value).replace(/\D/g, '').slice(0, 10);
};

/**
 * Normalize date to MM-DD-YYYY format. Handles ISO (YYYY-MM-DD), MM-DD-YYYY, etc.
 */
export const formatDateMMDDYYYY = (dateString) => {
    if (!dateString) return '';
    const str = String(dateString).trim();
    const parts = str.split(/[-/]/);
    if (parts.length === 3) {
        const [a, b, c] = parts;
        if (a.length === 4 && b.length <= 2 && c.length <= 2) {
            return `${b.padStart(2, '0')}-${c.padStart(2, '0')}-${a}`;
        }
        if (a.length <= 2 && b.length <= 2 && c.length === 4) {
            return `${a.padStart(2, '0')}-${b.padStart(2, '0')}-${c}`;
        }
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return str;
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
};

/**
 * Format date as MM-DD-YYYY, optionally with time HH:MM.
 */
export const formatDateDisplay = (dateString, includeTime = false) => {
    if (!dateString) return '';
    const normalized = formatDateMMDDYYYY(dateString);
    if (!includeTime || !normalized) return normalized;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return normalized;
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${normalized} ${hh}:${min}`;
};

/** Format as time only (e.g. 2:30 PM). */
export const formatTimeOnly = (dateStringOrMs) => {
    if (dateStringOrMs == null) return '—';
    const d = typeof dateStringOrMs === 'number' ? new Date(dateStringOrMs) : new Date(dateStringOrMs);
    if (isNaN(d.getTime())) return '—';
    const h = d.getHours();
    const m = d.getMinutes();
    const am = h < 12;
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
};

/** Display label for registration reason (new_visit, followup, refill_medicine). */
export const getReasonForVisitLabel = (reason) => {
    const r = (reason || '').trim();
    if (r === 'followup') return 'Followup';
    if (r === 'refill_medicine') return 'Refill medicine';
    return 'New visit';
};
