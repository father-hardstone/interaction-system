/**
 * One flat row from BilledBillingTable → payload row for billing statement image / ministry flow.
 * @param {{ interaction: object, line: object, idx: number, key: string, patientId: string, patientName: string, feeTypeLabel: string }} r
 */
export function flatRowToMinistryPayload(r) {
    const { interaction: i, line: ln, idx: lineIdx, patientId: pid, patientName: pname, feeTypeLabel: feeT, key: k } = r;
    const rawDate = i.completedAt || i.editedAt || i.createdAt || '';
    const totalFeeNum = typeof ln.totalFee === 'number' ? ln.totalFee : parseFloat(ln.totalFee || 0) || 0;
    return {
        key: k,
        interactionId: i.id,
        patientId: pid,
        patientName: pname,
        accountingNumber: i.accountingNumber || '',
        serviceDate: rawDate,
        serviceCode: ln.service || '',
        diagnosticCode: ln.diagnostic || '',
        lineNumber: ln.serialNumber ?? lineIdx + 1,
        totalFee: totalFeeNum,
        feeTypeLabel: feeT,
        refDoctor: '',
    };
}
