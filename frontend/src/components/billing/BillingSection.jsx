import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { parsePhoneToDigits, parseHealthCardToDigits } from '../../utils/formatUtils';
import PatientSearchFilters from '../PatientSearchFilters';
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
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchHealthCard, setSearchHealthCard] = useState('');
    const [searchDob, setSearchDob] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);

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

    const searchContactDigits = parsePhoneToDigits(searchContact || '');
    const visitorMatchesSearch = useMemo(() => {
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
            const anyPhoneContains = !searchContactDigits || [phoneM, phoneB, phoneH].some(d => d && d.includes(searchContactDigits));
            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const searchHealthCardDigits = parseHealthCardToDigits(searchHealthCard || '');
            const matchesHealthCard = !searchHealthCardDigits || healthCardStr.includes(searchHealthCardDigits);
            const matchesDob = !searchDob || (() => {
                const parts = searchDob.split('-');
                if (parts.length !== 3) return false;
                const [y, m, d] = parts;
                return dobStr.includes(`${m}-${d}-${y}`);
            })();
            return matchesFirstName && matchesLastName && matchesSerial && matchesHealthCard && matchesDob && anyPhoneContains;
        };
    }, [searchFirstName, searchLastName, searchSerial, searchHealthCard, searchDob, searchContactDigits]);

    const filteredUnbilled = useMemo(() => {
        return unbilledInteractions.filter((i) => visitorMatchesSearch(visitors.find((v) => v.id === i.visitorId)));
    }, [unbilledInteractions, visitors, visitorMatchesSearch]);
    const filteredBilled = useMemo(() => {
        return billedInteractions.filter((i) => visitorMatchesSearch(visitors.find((v) => v.id === i.visitorId)));
    }, [billedInteractions, visitors, visitorMatchesSearch]);

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
            <PatientSearchFilters
                searchLastName={searchLastName}
                setSearchLastName={setSearchLastName}
                searchFirstName={searchFirstName}
                setSearchFirstName={setSearchFirstName}
                searchDob={searchDob}
                setSearchDob={setSearchDob}
                searchHealthCard={searchHealthCard}
                setSearchHealthCard={setSearchHealthCard}
                searchSerial={searchSerial}
                setSearchSerial={setSearchSerial}
                searchContact={searchContact}
                setSearchContact={setSearchContact}
                dobSearchFocused={dobSearchFocused}
                setDobSearchFocused={setDobSearchFocused}
            />
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
                    unbilledInteractions={filteredUnbilled}
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
                    billedInteractions={filteredBilled}
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
