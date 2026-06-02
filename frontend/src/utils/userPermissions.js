/** Role-based access for the internal user dashboard (Front Desk / Physician). */

export const MAIN_TABS = {
    RECEPTION: 'reception',
    OFFICER: 'officer'
};

export const RECEPTION_SUB_TABS = {
    UNCONFIRMED: 'unconfirmed',
    PATIENTS: 'patients',
    REGISTRATIONS: 'registrations',
    REPORTS: 'reports',
    BILLINGS: 'billings',
    OUTGOING_LOG: 'outgoing_log'
};

const RECEPTIONIST_SUB_TABS = [
    RECEPTION_SUB_TABS.UNCONFIRMED,
    RECEPTION_SUB_TABS.PATIENTS,
    RECEPTION_SUB_TABS.REGISTRATIONS,
    RECEPTION_SUB_TABS.REPORTS,
    RECEPTION_SUB_TABS.OUTGOING_LOG
];

const ACCOUNTANT_SUB_TABS = [
    RECEPTION_SUB_TABS.PATIENTS,
    RECEPTION_SUB_TABS.BILLINGS
];

const INTERNAL_ROLES = ['officer', 'receptionist', 'accountant', 'admin'];

export function normalizeRole(role) {
    return (role || '').toLowerCase();
}

export function hasFullAccess(role) {
    const r = normalizeRole(role);
    return r === 'officer' || r === 'admin';
}

export function isInternalUserRole(role) {
    return INTERNAL_ROLES.includes(normalizeRole(role));
}

export function canAccessMainTab(role, tab) {
    const r = normalizeRole(role);
    if (hasFullAccess(r)) return true;
    if (tab === MAIN_TABS.RECEPTION) {
        return r === 'receptionist' || r === 'accountant';
    }
    if (tab === MAIN_TABS.OFFICER) {
        return false;
    }
    return false;
}

export function canAccessReceptionSubTab(role, subTab) {
    const r = normalizeRole(role);
    if (hasFullAccess(r)) return true;
    if (r === 'receptionist') {
        return RECEPTIONIST_SUB_TABS.includes(subTab);
    }
    if (r === 'accountant') {
        return ACCOUNTANT_SUB_TABS.includes(subTab);
    }
    return false;
}

export function getDefaultMainTab(role) {
    const r = normalizeRole(role);
    if (r === 'officer' || r === 'admin') return MAIN_TABS.OFFICER;
    return MAIN_TABS.RECEPTION;
}

export function getDefaultReceptionSubTab(role) {
    return RECEPTION_SUB_TABS.PATIENTS;
}

export function getFirstAllowedReceptionSubTab(role) {
    const r = normalizeRole(role);
    if (hasFullAccess(r)) return RECEPTION_SUB_TABS.PATIENTS;
    if (r === 'accountant') return RECEPTION_SUB_TABS.PATIENTS;
    if (r === 'receptionist') return RECEPTION_SUB_TABS.PATIENTS;
    return RECEPTION_SUB_TABS.PATIENTS;
}

/** Add/edit patients, register visits, and create onboarding forms. */
export function canManagePatients(role) {
    const r = normalizeRole(role);
    if (r === 'accountant') return false;
    return hasFullAccess(r) || r === 'receptionist';
}
