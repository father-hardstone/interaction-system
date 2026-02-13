import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import UnbilledBillingTable from './UnbilledBillingTable';
import BilledBillingTable from './BilledBillingTable';
import BillNowModal from './BillNowModal';

const BillingSection = ({
    interactions = [],
    visitors = [],
    officers = [],
    onInteractionClick,
    onOpenPatientDetails,
    billingModalInteraction: billingModalInteractionProp = null,
    onOpenBillNow,
    onCloseBillNow
}) => {
    const { services = [], diagnostics = [] } = useMasterData();
    const [activeBillingSubTab, setActiveBillingSubTab] = useState('unbilled');
    const [internalModalInteraction, setInternalModalInteraction] = useState(null);

    const billingModalInteraction = billingModalInteractionProp ?? internalModalInteraction;
    const handleOpenBillNow = onOpenBillNow ?? ((i) => setInternalModalInteraction(i));
    const handleCloseBillNow = onCloseBillNow ?? (() => setInternalModalInteraction(null));

    const { unbilledInteractions, billedInteractions } = useMemo(() => {
        const unbilled = [];
        const billed = [];
        for (const i of interactions) {
            if (!i.completed) continue;
            const hasBeenBilled = i.billed === true;
            const hasBillingInfo = i.serviceLines?.length > 0 &&
                i.serviceLines.some((line) => (line.totalFee && line.totalFee > 0) || line.accountingNumber);
            const isClosed = i.closed || hasBillingInfo; // closed or backward compat
            if (hasBeenBilled) {
                billed.push(i);
            } else if (isClosed) {
                unbilled.push(i);
            }
        }
        unbilled.sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
        return { unbilledInteractions: unbilled, billedInteractions: billed };
    }, [interactions]);

    const handleBillNow = (interaction) => {
        handleOpenBillNow(interaction);
    };

    const handleCloseModal = () => {
        handleCloseBillNow();
    };

    const handleSaveBilling = (data) => {
        // No API for now - would call billing API here
        console.log('Save billing:', data);
        handleCloseBillNow();
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-6">
            {/* Billing subtabs */}
            <div className="flex shrink-0 bg-slate-50 p-1 rounded-xl w-fit border border-slate-200">
                <button
                    onClick={() => setActiveBillingSubTab('unbilled')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeBillingSubTab === 'unbilled'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                >
                    Unbilled
                </button>
                <button
                    onClick={() => setActiveBillingSubTab('billed')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeBillingSubTab === 'billed'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                >
                    Billed
                </button>
            </div>

            {/* Content based on active subtab */}
            {activeBillingSubTab === 'unbilled' && (
                <div className="flex-1 flex flex-col min-h-0">
                <UnbilledBillingTable
                    unbilledInteractions={unbilledInteractions}
                    visitors={visitors}
                    officers={officers}
                    interactions={interactions}
                    onBillNow={handleBillNow}
                    onInteractionClick={onInteractionClick}
                    onOpenPatientDetails={onOpenPatientDetails}
                />
                </div>
            )}
            {activeBillingSubTab === 'billed' && (
                <div className="flex-1 flex flex-col min-h-0">
                <BilledBillingTable
                    billedInteractions={billedInteractions}
                    visitors={visitors}
                    officers={officers}
                    interactions={interactions}
                    onInteractionClick={onInteractionClick}
                    onOpenPatientDetails={onOpenPatientDetails}
                />
                </div>
            )}
            <BillNowModal
                isOpen={!!billingModalInteraction}
                onClose={handleCloseModal}
                interaction={billingModalInteraction}
                visitors={visitors}
                officers={officers}
                services={services}
                diagnostics={diagnostics}
                onSave={handleSaveBilling}
            />
        </div>
    );
};

export default BillingSection;
