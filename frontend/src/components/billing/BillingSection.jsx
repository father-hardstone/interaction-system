import React, { useState, useMemo, useCallback } from 'react';
import { useMasterData } from '../../contexts/MasterDataContext';
import { parsePhoneToDigits } from '../../utils/formatUtils';
import PatientSearchFilters from '../PatientSearchFilters';
import UnbilledBillingTable from './UnbilledBillingTable';
import BilledBillingTable from './BilledBillingTable';
import BillNowModal from './BillNowModal';
import CompletedInteractionsTable from '../CompletedInteractionsTable';
import { generateBillingStatementImage } from '../../utils/billingStatementImage';
import { interactionService } from '../../services/interactionService';
import { partitionBillingInteractions } from './billingBuckets';
import { buildVisitorMatcher } from './billingVisitorMatch';
import BillingStatementModals from './BillingStatementModals';
import BillingSubTabBar from './BillingSubTabBar';

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
    onCloseBillNow,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    lastVisits = {},
    userRole = '',
}) => {
    const isAccountant = userRole === 'accountant';
    const { services = [], diagnostics = [] } = useMasterData();
    const [activeBillingSubTab, setActiveBillingSubTab] = useState('completed');
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
    const [showMinistryConfirm, setShowMinistryConfirm] = useState(false);
    const [lastMinistryRows, setLastMinistryRows] = useState([]);
    const [isMinistryProcessing, setIsMinistryProcessing] = useState(false);
    const [billingModalLinesOnly, setBillingModalLinesOnly] = useState(false);

    const billingModalInteraction = billingModalInteractionProp ?? internalModalInteraction;
    const handleOpenBillNow = onOpenBillNow ?? ((i) => setInternalModalInteraction(i));
    const handleCloseBillNow = onCloseBillNow ?? (() => setInternalModalInteraction(null));

    const {
        unbilledInteractions,
        detailClaimInteractions,
        filedClaimsInteractions,
        completedInteractionsBilling,
    } = useMemo(() => partitionBillingInteractions(interactions), [interactions]);

    const searchContactDigits = parsePhoneToDigits(searchContact || '');
    const visitorMatchesSearch = useMemo(
        () =>
            buildVisitorMatcher({
                searchFirstName,
                searchLastName,
                searchSerial,
                searchHealthCard,
                searchDob,
                searchContactDigits,
            }),
        [searchFirstName, searchLastName, searchSerial, searchHealthCard, searchDob, searchContactDigits]
    );

    const filterByVisitor = (list) =>
        list.filter((i) => visitorMatchesSearch(visitors.find((v) => v.id === i.visitorId)));

    const filteredCompleted = useMemo(
        () => filterByVisitor(completedInteractionsBilling),
        [completedInteractionsBilling, visitors, visitorMatchesSearch]
    );
    const filteredUnbilled = useMemo(() => filterByVisitor(unbilledInteractions), [unbilledInteractions, visitors, visitorMatchesSearch]);
    const filteredDetailClaim = useMemo(
        () => filterByVisitor(detailClaimInteractions),
        [detailClaimInteractions, visitors, visitorMatchesSearch]
    );
    const filteredFiled = useMemo(
        () => filterByVisitor(filedClaimsInteractions),
        [filedClaimsInteractions, visitors, visitorMatchesSearch]
    );

    const handleBillNow = (interaction) => {
        handleOpenBillNow(interaction);
    };

    const handleCloseModal = () => {
        setBillingModalLinesOnly(false);
        handleCloseBillNow();
    };

    const handleOpenAddBillingInfo = (interaction) => {
        setBillingModalLinesOnly(true);
        handleOpenBillNow(interaction);
    };

    const handleSaveBillingLinesOnly = async (data) => {
        const interactionId = data?.interactionId;
        if (!interactionId) {
            throw new Error('Missing interaction id');
        }

        const serviceLines = Array.isArray(data?.billingLines)
            ? data.billingLines.map((l, idx) => ({
                  serialNumber: l?.serialNumber ?? idx + 1,
                  service: (l?.service || '').trim(),
                  suffix: (l?.suffix || '').trim(),
                  diagnostic: (l?.diagnostic || '').trim(),
                  totalFee: parseFloat(l?.totalFee) || 0,
                  accountingNumber: (l?.accountingNumber || '').trim(),
              }))
            : [];

        try {
            const updated = await interactionService.saveDetails(interactionId, { serviceLines });
            onInteractionUpdated?.(updated);
            return updated;
        } catch (e) {
            console.error('Failed to save billing lines:', e);
            throw e;
        }
    };

    const handleSaveBilling = async (data) => {
        const interactionId = data?.interactionId;
        if (!interactionId) {
            console.warn('Bill Now save: missing interactionId');
            throw new Error('Missing interaction id');
        }

        const serviceLines = Array.isArray(data?.billingLines)
            ? data.billingLines.map((l, idx) => ({
                  serialNumber: l?.serialNumber ?? idx + 1,
                  service: (l?.service || '').trim(),
                  suffix: (l?.suffix || '').trim(),
                  diagnostic: (l?.diagnostic || '').trim(),
                  totalFee: parseFloat(l?.totalFee) || 0,
                  accountingNumber: '',
              }))
            : [];

        try {
            const updated = await interactionService.saveDetails(interactionId, {
                serviceLines,
                closed: true,
                billed: true,
                billingType: data.billingType,
                ministryClaimFiled: false,
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
                accountingNumber: '',
            }));
            const updated = await interactionService.saveDetails(interactionId, {
                serviceLines,
                billed: false,
                closed: true,
                accountingNumber: '',
                ministryClaimFiled: false,
            });
            onInteractionUpdated?.(updated);
            return updated;
        } catch (e) {
            console.error('Failed to unbill interaction:', e);
            throw e;
        }
    };

    const handleMinistryUnclaim = useCallback(
        async (interaction) => {
            const interactionId = interaction?.id;
            if (!interactionId) return;
            try {
                const updated = await interactionService.saveDetails(interactionId, { ministryClaimFiled: false });
                onInteractionUpdated?.(updated);
            } catch (e) {
                console.error('Failed to un-claim ministry filing:', e);
            }
        },
        [onInteractionUpdated]
    );

    const handleConfirmSendToMinistry = useCallback(async () => {
        const rows = lastMinistryRows;
        if (!Array.isArray(rows) || rows.length === 0) {
            setShowMinistryConfirm(false);
            return;
        }
        const ids = [...new Set(rows.map((r) => r.interactionId).filter(Boolean))];
        setIsMinistryProcessing(true);
        try {
            for (const id of ids) {
                const updated = await interactionService.saveDetails(id, { ministryClaimFiled: true });
                onInteractionUpdated?.(updated);
            }
        } catch (e) {
            console.error('Failed to mark claims as filed for ministry:', e);
        } finally {
            setIsMinistryProcessing(false);
            setProcessImageUrl(null);
            setShowMinistryConfirm(false);
            setLastMinistryRows([]);
        }
    }, [lastMinistryRows, onInteractionUpdated]);

    const handleProcessForMinistry = async (rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        if (isGeneratingSheet) return;
        setLastMinistryRows(rows);
        setIsGeneratingSheet(true);
        try {
            const dates = rows
                .map((r) => new Date(r.serviceDate || ''))
                .filter((d) => !Number.isNaN(d.getTime()));
            let statementFrom = '';
            let statementTo = '';
            const format = (time) => {
                const d = new Date(time);
                if (isNaN(d.getTime())) return '';
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const yyyy = d.getFullYear();
                return `${mm}-${dd}-${yyyy}`;
            };

            if (dates.length > 0) {
                const minTime = Math.min(...dates.map((d) => d.getTime()));
                const maxTime = Math.max(...dates.map((d) => d.getTime()));
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
                statementDate: format(new Date()),
                rows,
            });
            setProcessImageUrl(dataUrl);
            setProcessStatementDate(statementTo || statementFrom || '');
        } catch (e) {
            console.error('Failed to generate billing statement image:', e);
            setLastMinistryRows([]);
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
            <BillingSubTabBar
                activeBillingSubTab={activeBillingSubTab}
                setActiveBillingSubTab={setActiveBillingSubTab}
                counts={{
                    completed: filteredCompleted.length,
                    dailySheet: filteredUnbilled.length,
                    detailClaim: filteredDetailClaim.length,
                    filed: filteredFiled.length,
                }}
            />

            {activeBillingSubTab === 'completed' && getVisitorName && getVisitorSerial && formatDate && (
                <div className="flex-1 flex flex-col min-h-0">
                    <CompletedInteractionsTable
                        variant="completed"
                        completedInteractions={filteredCompleted}
                        isLoading={isLoadingInteractions}
                        handleOpenPatientDetails={onOpenPatientDetails}
                        getVisitorName={getVisitorName}
                        getVisitorSerial={getVisitorSerial}
                        formatDate={formatDate}
                        onInteractionClick={isAccountant ? undefined : onInteractionClick}
                        onEditCompleted={isAccountant ? undefined : (interaction, opts) => onInteractionClick?.(interaction, opts)}
                        onAddBillingInfo={isAccountant ? handleOpenAddBillingInfo : undefined}
                        showEditButton={!isAccountant}
                        highlightMissingBilling={!isAccountant}
                        blockEditCompleted={false}
                        interactions={interactions}
                        lastVisits={lastVisits}
                        title="Completed interactions"
                        emptyMessage="No completed interactions"
                        loadingMessage="Loading completed interactions…"
                    />
                </div>
            )}

            {activeBillingSubTab === 'daily_sheet' && (
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

            {activeBillingSubTab === 'detail_claim' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <BilledBillingTable
                        variant="detail"
                        billedInteractions={filteredDetailClaim}
                        isLoading={isLoadingInteractions}
                        visitors={visitors}
                        officers={officers}
                        interactions={interactions}
                        onInteractionClick={onInteractionClick}
                        onOpenPatientDetails={onOpenPatientDetails}
                        onUnbill={handleUnbill}
                        onProcessForMinistry={handleProcessForMinistry}
                        onMinistryUnclaim={handleMinistryUnclaim}
                        isGeneratingSheet={isGeneratingSheet}
                        isMinistryProcessing={isMinistryProcessing}
                    />
                </div>
            )}

            {activeBillingSubTab === 'filed_claims' && (
                <div className="flex-1 flex flex-col min-h-0">
                    <BilledBillingTable
                        variant="filed"
                        billedInteractions={filteredFiled}
                        isLoading={isLoadingInteractions}
                        visitors={visitors}
                        officers={officers}
                        interactions={interactions}
                        onInteractionClick={onInteractionClick}
                        onOpenPatientDetails={onOpenPatientDetails}
                        onUnbill={handleUnbill}
                        onProcessForMinistry={handleProcessForMinistry}
                        onMinistryUnclaim={handleMinistryUnclaim}
                        isGeneratingSheet={isGeneratingSheet}
                        isMinistryProcessing={isMinistryProcessing}
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
                linesOnly={billingModalLinesOnly}
                onSave={billingModalLinesOnly ? handleSaveBillingLinesOnly : handleSaveBilling}
            />

            <BillingStatementModals
                processImageUrl={processImageUrl}
                processStatementDate={processStatementDate}
                onCloseSheet={() => setProcessImageUrl(null)}
                onOpenMinistryConfirm={() => setShowMinistryConfirm(true)}
                showMinistryConfirm={showMinistryConfirm}
                onDismissConfirm={() => setShowMinistryConfirm(false)}
                onConfirmMinistry={handleConfirmSendToMinistry}
                isMinistryProcessing={isMinistryProcessing}
                sheetBlocked={showMinistryConfirm || isMinistryProcessing}
            />
        </div>
    );
};

export default BillingSection;
