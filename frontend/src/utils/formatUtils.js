/**
 * Normalize to 10 digits only. No country code; we accept, store, and display 10 digits.
 */
const toTenDigits = (str) => {
    const digits = String(str || '').replace(/\D/g, '');
    return digits.slice(0, 10);
};

/**
 * Format phone for display: (XXX) XXX-XXXX. 10 digits only.
 */
export const formatPhoneDisplay = (phone) => {
    const digits = toTenDigits(phone);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/**
 * Extract up to 10 digits from phone input. No country code handling.
 */
export const parsePhoneToDigits = (phone) => {
    if (!phone) return '';
    return toTenDigits(phone);
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

/** Current status from backend or derived from flags. One of: registered | queued | ongoing | incomplete | complete | closed | billed | cancelled. */
export const getInteractionStatus = (interaction) => {
    if (!interaction) return 'registered';
    if (interaction.interactionStatus && typeof interaction.interactionStatus === 'string') return interaction.interactionStatus;
    if (interaction.cancelled) return 'cancelled';
    if (interaction.billed) return 'billed';
    if (interaction.closed) return 'closed';
    if (interaction.completed) return 'complete';
    if (interaction.started) return interaction.incomplete ? 'incomplete' : (interaction.ongoing ? 'ongoing' : 'ongoing');
    const hasOfficer = interaction.officerId && String(interaction.officerId).trim() !== '';
    return hasOfficer ? 'queued' : 'registered';
};

/** Registration/queue display id: in queue views use position; elsewhere use interaction serial (no temporary serial). */
export const getRegistrationDisplayId = (interaction) => {
    if (!interaction) return '—';
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

/** Age as "X yr Y mo" or "X mo" if under 1 year. Uses visitor.dateOfBirth. */
export const getAgeYearsMonthsDisplay = (visitor) => {
    const dob = visitor?.dateOfBirth;
    if (!dob) return '—';
    const parts = String(dob).split(/[-/]/);
    if (parts.length < 3) return '—';
    let month, day, year;
    if (parts[0].length === 4) {
        [year, month, day] = parts;
    } else {
        [month, day, year] = parts;
    }
    month = parseInt(month, 10) - 1;
    day = parseInt(day, 10);
    year = parseInt(year, 10);
    const birth = new Date(year, month, day);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (isNaN(years) || years < 0) return '—';
    if (years === 0) return `${months} mo`;
    return months > 0 ? `${years} yr ${months} mo` : `${years} yr`;
};

/**
 * Last visit display for a visitor: prefer visitor.lastVisitAt (stored on person), then lastVisits map, then from interactions.
 * @param {Object} visitor - Visitor with optional lastVisitAt (ISO date)
 * @param {Object} lastVisitsMap - Optional map visitorId -> last completed interaction { editedAt, createdAt }
 * @param {Array} interactions - Optional all interactions (fallback: use latest completed for this visitor)
 * @returns {string} Formatted date with time, or '-'
 */
export const getLastVisitDisplay = (visitor, lastVisitsMap = {}, interactions = []) => {
    if (visitor?.lastVisitAt) return formatDateDisplay(visitor.lastVisitAt, true);
    const fromMap = lastVisitsMap?.[visitor?.id];
    if (fromMap) return formatDateDisplay(fromMap.editedAt || fromMap.createdAt, true);
    const sorted = (interactions || []).filter(i => i.visitorId === visitor?.id && i.completed)
        .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
    const first = sorted[0];
    return first ? formatDateDisplay(first.editedAt || first.createdAt, true) : '-';
};

/** Display label for registration reason (new_visit, followup, refill_medicine). */
export const getReasonForVisitLabel = (reason) => {
    const r = (reason || '').trim();
    if (r === 'followup') return 'Followup';
    if (r === 'refill_medicine') return 'Refill medicine';
    return 'New visit';
};
