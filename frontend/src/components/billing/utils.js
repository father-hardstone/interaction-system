export const getVisitorName = (visitorId, visitors = []) => {
    const v = visitors.find((vis) => vis.id === visitorId);
    if (!v) return 'Unknown';
    return `${v.firstName || ''}${v.firstName ? ' ' : ''}${v.middleName ? v.middleName + ' ' : ''}${v.lastName || ''}`.trim() || 'Unknown';
};

export const getVisitorSerial = (visitorId, visitors = []) => {
    const v = visitors.find((vis) => vis.id === visitorId);
    if (!v) return 'N/A';
    return v.serial && v.serial.includes('-') ? v.serial : (v.entitySerial ? `${v.entitySerial}-${v.serial}` : v.serial) || 'N/A';
};

export const getOfficerName = (officerId, officers = []) => {
    const officer = officers.find((o) => o.id === officerId);
    return officer?.name || 'Unassigned';
};

export const getOfficerSerial = (officerId, officers = []) => {
    const officer = officers.find((o) => o.id === officerId);
    return officer?.serial || 'N/A';
};

export const calculateAge = (dob) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
};

export const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    if (!includeTime) return `${mm}-${dd}-${yyyy}`;
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd}-${yyyy} ${hh}:${min}`;
};
