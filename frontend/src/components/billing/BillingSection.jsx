import React, { useState, useMemo } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { parsePhoneToDigits, parseHealthCardToDigits } from '../../utils/formatUtils';
import PatientSearchFilters from '../PatientSearchFilters';
import UnbilledBillingTable from './UnbilledBillingTable';
import BilledBillingTable from './BilledBillingTable';
import BillNowModal from './BillNowModal';
import { generateBillingStatementImage } from '../../utils/billingStatementImage';
import { interactionService } from '../../services/interactionService';

const BillingSection = ({
    interactions = [],
    isLoadingInteractions = false,
    visitors = [],
    officers = [],
    onInteractionClick,
    onOpenPatientDetails,
    onInteractionUpdated,
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
    const [processImageUrl, setProcessImageUrl] = useState(null);
    const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
    const [processStatementDate, setProcessStatementDate] = useState('');
    const [showSendToMinistryNotice, setShowSendToMinistryNotice] = useState(false);

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

        // For unbilled, show earliest ready-for-billing first.
        unbilled.sort((a, b) => {
            const aDate = new Date(a.closedAt || a.completedAt || a.editedAt || a.createdAt || 0).getTime();
            const bDate = new Date(b.closedAt || b.completedAt || b.editedAt || b.createdAt || 0).getTime();
            return aDate - bDate;
        });

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

    const handleSaveBilling = async (data) => {
        const interactionId = data?.interactionId;
        if (!interactionId) {
            console.warn('Bill Now save: missing interactionId');
            throw new Error('Missing interaction id');
        }

        const serviceLines = Array.isArray(data?.billingLines) ? data.billingLines.map((l, idx) => ({
            serialNumber: l?.serialNumber ?? idx + 1,
            service: (l?.service || '').trim(),
            suffix: (l?.suffix || '').trim(),
            diagnostic: (l?.diagnostic || '').trim(),
            totalFee: parseFloat(l?.totalFee) || 0,
            accountingNumber: '' // backend assigns when billed
        })) : [];

        try {
            const updated = await interactionService.saveDetails(interactionId, {
                serviceLines,
                closed: true,
                billed: true,
                billingType: data.billingType
            });
            onInteractionUpdated?.(updated);
            return updated;
        } catch (e) {
            console.error('Failed to bill interaction:', e);
            throw e;
        }
    };

    const handleUnbill = async (interaction) => {
        const interactionId = interaction?.id;
        if (!interactionId) return;
        try {
            const existingLines = Array.isArray(interaction.serviceLines) ? interaction.serviceLines : [];
            const serviceLines = existingLines.map((l, idx) => ({
                serialNumber: l?.serialNumber ?? idx + 1,
                service: (l?.service || '').trim(),
                suffix: (l?.suffix || '').trim(),
                diagnostic: (l?.diagnostic || '').trim(),
                totalFee: parseFloat(l?.totalFee) || 0,
                accountingNumber: ''
            }));
            const updated = await interactionService.saveDetails(interactionId, {
                serviceLines,
                billed: false,
                closed: true,
                accountingNumber: ''
            });
            onInteractionUpdated?.(updated);
            return updated;
        } catch (e) {
            console.error('Failed to unbill interaction:', e);
            throw e;
        }
    };

    const handleProcessForMinistry = async (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        if (isGeneratingSheet) return;
        setIsGeneratingSheet(true);
        try {
            const dates = rows
                .map((r) => new Date(r.serviceDate || ''))
                .filter((d) => !Number.isNaN(d.getTime()));
            let statementFrom = '';
            let statementTo = '';
            if (dates.length > 0) {
                const minTime = Math.min(...dates.map((d) => d.getTime()));
                const maxTime = Math.max(...dates.map((d) => d.getTime()));
                const format = (time) => {
                    const d = new Date(time);
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    return `${mm}-${dd}-${yyyy}`;
                };
                statementFrom = format(minTime);
                statementTo = format(maxTime);
            }

            const doctorName = (() => {
                const first = rows[0];
                if (!first) return '';
                const interaction = interactions.find((i) => i.id === first.interactionId);
                if (!interaction) return '';
                const officer = officers.find((o) => o.id === interaction.officerId);
                return officer?.name || officer?.fullName || '';
            })();

            const dataUrl = await generateBillingStatementImage({
                doctorName,
                statementFrom,
                statementTo,
                rows
            });
            setProcessImageUrl(dataUrl);
            setProcessStatementDate(statementTo || statementFrom || '');
        } catch (e) {
            console.error('Failed to generate billing statement image:', e);
        } finally {
            setIsGeneratingSheet(false);
        }
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
                    Unbilled ({filteredUnbilled.length})
                </button>
                <button
                    onClick={() => setActiveBillingSubTab('processed')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeBillingSubTab === 'processed'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                >
                    Processed (0)
                </button>
                <button
                    onClick={() => setActiveBillingSubTab('billed')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeBillingSubTab === 'billed'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                >
                    Billed ({filteredBilled.length})
                </button>
            </div>

            {/* Content based on active subtab */}
            {activeBillingSubTab === 'unbilled' && (
                <div className="flex-1 flex flex-col min-h-0">
                <UnbilledBillingTable
                    unbilledInteractions={filteredUnbilled}
                    isLoading={isLoadingInteractions}
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
                    isLoading={isLoadingInteractions}
                    visitors={visitors}
                    officers={officers}
                    interactions={interactions}
                    onInteractionClick={onInteractionClick}
                    onOpenPatientDetails={onOpenPatientDetails}
                    onUnbill={handleUnbill}
                    onProcessForMinistry={handleProcessForMinistry}
                    isGeneratingSheet={isGeneratingSheet}
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
            {processImageUrl && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 px-2 sm:px-4" onClick={() => setProcessImageUrl(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900">Processed Billing Sheet</h3>
                            <button
                                type="button"
                                onClick={() => setProcessImageUrl(null)}
                                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-100 flex items-start justify-center p-2 sm:p-4">
                            <img
                                src={processImageUrl}
                                alt="Billing Statement"
                                className="w-full h-auto max-w-[1200px] md:max-w-[1400px] shadow bg-white"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50">
                            <button
                                type="button"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = processImageUrl;
                                    const safeDate = (processStatementDate || '').replace(/[^0-9-]/g, '');
                                    link.download = safeDate
                                        ? `billing-statement-${safeDate}.png`
                                        : 'billing-statement.png';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
                            >
                                Download
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSendToMinistryNotice(true)}
                                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Send to Ministry
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSendToMinistryNotice && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 px-4" onClick={() => setShowSendToMinistryNotice(false)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900">Feature Under Progress</h3>
                        <p className="text-sm text-slate-600">
                            Sending billing sheets directly to the ministry is not available yet. Please download the sheet and submit it using your current workflow.
                        </p>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowSendToMinistryNotice(false)}
                                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingSection;
