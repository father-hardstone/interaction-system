/** True when interaction is treated as filed for ministry in billing UI. */
export function isMinistryClaimFiled(i) {
    return i?.ministryClaimFiled === true || i?.ministryClaimFiled === 'true';
}

/**
 * Split entity interactions into the four billing buckets (same rules as BillingSection).
 * @param {Array<object>} interactions
 */
export function partitionBillingInteractions(interactions) {
    const unbilled = [];
    const detailClaim = [];
    const filed = [];
    const completedOpen = [];

    for (const i of interactions || []) {
        if (i.cancelled) continue;

        if (i.completed && !i.closed) {
            completedOpen.push(i);
        }

        if (!i.completed) continue;

        const hasBeenBilled = i.billed === true;
        const hasBillingInfo =
            i.serviceLines?.length > 0 &&
            i.serviceLines.some((line) => (line.totalFee && line.totalFee > 0) || line.accountingNumber);
        const isClosed = i.closed || hasBillingInfo;

        if (hasBeenBilled) {
            if (isMinistryClaimFiled(i)) filed.push(i);
            else detailClaim.push(i);
        } else if (isClosed) {
            unbilled.push(i);
        }
    }

    const sortByDateDesc = (a, b) => {
        const bDate = new Date(b.closedAt || b.completedAt || b.editedAt || b.createdAt || 0).getTime();
        const aDate = new Date(a.closedAt || a.completedAt || a.editedAt || a.createdAt || 0).getTime();
        return bDate - aDate;
    };

    completedOpen.sort(sortByDateDesc);
    unbilled.sort((a, b) => {
        const aDate = new Date(a.closedAt || a.completedAt || a.editedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.closedAt || b.completedAt || b.editedAt || b.createdAt || 0).getTime();
        return aDate - bDate;
    });
    detailClaim.sort(sortByDateDesc);
    filed.sort(sortByDateDesc);

    return {
        completedInteractionsBilling: completedOpen,
        unbilledInteractions: unbilled,
        detailClaimInteractions: detailClaim,
        filedClaimsInteractions: filed,
    };
}
