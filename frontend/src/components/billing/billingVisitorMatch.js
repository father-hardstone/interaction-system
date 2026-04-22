import { parsePhoneToDigits, parseHealthCardToDigits } from '../../utils/formatUtils';

/**
 * Builds a visitor predicate for billing search filters.
 * @param {object} filters
 */
export function buildVisitorMatcher(filters) {
    const {
        searchFirstName = '',
        searchLastName = '',
        searchSerial = '',
        searchHealthCard = '',
        searchDob = '',
        searchContactDigits = '',
    } = filters;

    return (visitor) => {
        if (!visitor) return false;
        const firstName = (visitor.firstName || '').toLowerCase();
        const lastName = (visitor.lastName || '').toLowerCase();
        const serialDisplay = `${visitor.entitySerial ? visitor.entitySerial + '-' : ''}${visitor.serial || ''}`.toLowerCase();
        const healthCardStr = parseHealthCardToDigits(visitor.healthCardNumber || '');
        const dobStr = (visitor.dateOfBirth || '').toLowerCase();
        const toDigits = (p) => parsePhoneToDigits(p || '');
        const phoneM = toDigits(visitor.phoneM || visitor.phone);
        const phoneB = toDigits(visitor.phoneB);
        const phoneH = toDigits(visitor.phoneH);
        const anyPhoneContains =
            !searchContactDigits || [phoneM, phoneB, phoneH].some((d) => d && d.includes(searchContactDigits));
        const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
        const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
        const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
        const searchHealthCardDigits = parseHealthCardToDigits(searchHealthCard || '');
        const matchesHealthCard = !searchHealthCardDigits || healthCardStr.includes(searchHealthCardDigits);
        const matchesDob =
            !searchDob ||
            (() => {
                const parts = searchDob.split('-');
                if (parts.length !== 3) return false;
                const [y, m, d] = parts;
                return dobStr.includes(`${m}-${d}-${y}`);
            })();
        return (
            matchesFirstName &&
            matchesLastName &&
            matchesSerial &&
            matchesHealthCard &&
            matchesDob &&
            anyPhoneContains
        );
    };
}
