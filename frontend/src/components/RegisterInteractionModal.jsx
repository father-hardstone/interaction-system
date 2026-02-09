import { formatPhoneDisplay, formatHealthCardDisplay, parseHealthCardToDigits, formatDateMMDDYYYY, stripEntityPrefix, getVisitorSerialDisplay } from '../utils/formatUtils';

import { useState, useMemo } from 'react';

const REASON_FOR_VISIT_OPTIONS = [
    { value: '', label: '— Select reason —' },
    { value: 'followup', label: 'Followup' },
    { value: 'refill_medicine', label: 'Refill medicine' }
];

const RegisterInteractionModal = ({
    isOpen,
    onClose,
    visitors = [],
    interactions = [],
    getVisitorName,
    getVisitorSerial,
    getVisitorHealthCard,
    formatDate,
    handleRegisterPatient,
    isCreatingInteraction = false,
    onPatientClick
}) => {
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchMiddleName, setSearchMiddleName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchHealthCard, setSearchHealthCard] = useState('');
    const [searchDob, setSearchDob] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);
    const [showRegisterConfirmModal, setShowRegisterConfirmModal] = useState(false);
    const [pendingRegisterVisitor, setPendingRegisterVisitor] = useState(null);
    const [reasonForVisit, setReasonForVisit] = useState('');
    const [parentInteractionId, setParentInteractionId] = useState('');

    const filteredVisitors = useMemo(() => {
        return visitors.filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial || ''}`.toLowerCase();
            const healthCardStr = (v.healthCardNumber || '').toLowerCase();
            const dobStr = (v.dateOfBirth || '').toLowerCase();

            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesMiddleName = !searchMiddleName || middleName.includes(searchMiddleName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const searchHealthCardDigits = parseHealthCardToDigits(searchHealthCard || '');
            const matchesHealthCard = !searchHealthCardDigits || healthCardStr.includes(searchHealthCardDigits);
            const matchesDob = !searchDob || (() => {
                const parts = searchDob.split('-');
                if (parts.length !== 3) return false;
                const [y, m, d] = parts;
                const formattedSearch = `${m}-${d}-${y}`;
                return dobStr.includes(formattedSearch);
            })();

            return matchesFirstName && matchesMiddleName && matchesLastName && matchesSerial && matchesHealthCard && matchesDob;
        });
    }, [visitors, searchFirstName, searchMiddleName, searchLastName, searchSerial, searchHealthCard, searchDob]);

    const confirmRegistration = async () => {
        if (!pendingRegisterVisitor || !handleRegisterPatient) return;
        if (reasonForVisit === 'followup' && !parentInteractionId) return; // Must select prior visit for followup
        const success = await handleRegisterPatient(pendingRegisterVisitor, {
            reasonForVisit: reasonForVisit || '',
            parentInteractionId: reasonForVisit === 'followup' ? parentInteractionId : ''
        });
        if (success) {
            setShowRegisterConfirmModal(false);
            setPendingRegisterVisitor(null);
            setReasonForVisit('');
            setParentInteractionId('');
            onClose();
        }
    };

    const initiateRegistration = (visitor) => {
        setPendingRegisterVisitor(visitor);
        setReasonForVisit('');
        setParentInteractionId('');
        setShowRegisterConfirmModal(true);
    };

    const priorVisitsForPatient = useMemo(() => {
        if (!pendingRegisterVisitor) return [];
        return interactions
            .filter(i => i.visitorId === pendingRegisterVisitor.id && i.completed)
            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt));
    }, [pendingRegisterVisitor, interactions]);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 pb-4 pt-0 !mt-0 overflow-y-auto">
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 my-8">
                    <div className="shrink-0 p-6 sm:p-8 border-b border-slate-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Register Patient</h2>
                                <p className="text-sm text-slate-500 mt-1">Select a patient to register</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Search filters */}
                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <input
                                type="text"
                                placeholder="Search by last name"
                                value={searchLastName}
                                onChange={(e) => setSearchLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                                type="text"
                                placeholder="Search by first name"
                                value={searchFirstName}
                                onChange={(e) => setSearchFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                                type={dobSearchFocused || searchDob ? "date" : "text"}
                                placeholder={!dobSearchFocused && !searchDob ? "Search by DOB" : ""}
                                value={searchDob}
                                onFocus={() => setDobSearchFocused(true)}
                                onBlur={() => setDobSearchFocused(false)}
                                onChange={(e) => setSearchDob(e.target.value)}
                                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 placeholder-slate-400"
                            />
                            <input
                                type="text"
                                placeholder="Search by health card"
                                value={searchHealthCard}
                                onChange={(e) => setSearchHealthCard(formatHealthCardDisplay(parseHealthCardToDigits(e.target.value)))}
                                maxLength={12}
                                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                                type="text"
                                placeholder="Search by ID"
                                value={searchSerial}
                                onChange={(e) => setSearchSerial(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                maxLength={6}
                                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto min-h-0 p-4 sm:p-6">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date of Birth</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden xl:table-cell">Version</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden xl:table-cell">Last Visit</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-slate-400">
                                            No patients found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVisitors.map((visitor) => {
                                        const isRegistered = interactions.some(i => i.visitorId === visitor.id && !i.completed);
                                        const isRegisteringThis = isCreatingInteraction && pendingRegisterVisitor?.id === visitor.id;
                                        const isDisabled = isRegistered || isRegisteringThis;

                                        const lastVisit = interactions
                                            .filter(i => i.visitorId === visitor.id && i.completed)
                                            .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt))[0];

                                        return (
                                            <tr
                                                key={visitor.id}
                                                onClick={() => onPatientClick?.(visitor)}
                                                className={`border-b border-slate-100 hover:bg-slate-50 transition-all ${onPatientClick ? 'cursor-pointer' : ''}`}
                                            >
                                                <td className="px-4 py-3 text-slate-700 text-sm">{formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    <div className="font-medium text-sm">
                                                        {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900 text-sm">{getVisitorSerialDisplay(visitor)}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden lg:table-cell text-sm">{formatPhoneDisplay(visitor.phone) || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden xl:table-cell text-sm">{formatHealthCardDisplay(visitor.healthCardNumber || '') || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden xl:table-cell text-sm">{(visitor.healthCardVersion || '-').toUpperCase()}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden xl:table-cell text-sm">
                                                    {lastVisit ? formatDate(lastVisit.editedAt || lastVisit.createdAt, true) : '-'}
                                                </td>
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => !isDisabled && initiateRegistration(visitor)}
                                                        disabled={isDisabled}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[100px] ${isDisabled ? 'bg-slate-300 text-slate-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                    >
                                                        {isRegisteringThis ? (
                                                            <>
                                                                <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Registering...
                                                            </>
                                                        ) : isRegistered ? 'In Service' : 'Register'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Register Confirmation Modal */}
            {showRegisterConfirmModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4 pb-4 pt-0 !mt-0">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isCreatingInteraction && (setShowRegisterConfirmModal(false), setPendingRegisterVisitor(null), setReasonForVisit(''), setParentInteractionId(''))}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 text-center">Confirm Registration</h3>
                            <p className="text-slate-600 text-sm mb-4 text-center">
                                Register an interaction for {pendingRegisterVisitor ? `${pendingRegisterVisitor.firstName || ''} ${pendingRegisterVisitor.lastName || ''}`.trim() : 'this patient'}?
                            </p>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for visit</label>
                                    <select
                                        value={reasonForVisit}
                                        onChange={(e) => {
                                            setReasonForVisit(e.target.value);
                                            setParentInteractionId('');
                                        }}
                                        className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                    >
                                        {REASON_FOR_VISIT_OPTIONS.map((opt) => (
                                            <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {reasonForVisit === 'followup' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prior visit (followup to)</label>
                                        <select
                                            value={parentInteractionId}
                                            onChange={(e) => setParentInteractionId(e.target.value)}
                                            className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">— Select prior visit —</option>
                                            {priorVisitsForPatient.map((i) => (
                                                <option key={i.id} value={i.id}>
                                                    {stripEntityPrefix(i.interactionSerial) || 'REG'} — {formatDate(i.editedAt || i.createdAt, true)}
                                                </option>
                                            ))}
                                        </select>
                                        {priorVisitsForPatient.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">No completed visits found for this patient.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        if (!isCreatingInteraction) {
                                            setShowRegisterConfirmModal(false);
                                            setPendingRegisterVisitor(null);
                                            setReasonForVisit('');
                                            setParentInteractionId('');
                                        }
                                    }}
                                    disabled={isCreatingInteraction}
                                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    No, cancel
                                </button>
                                <button
                                    onClick={confirmRegistration}
                                    disabled={isCreatingInteraction || (reasonForVisit === 'followup' && !parentInteractionId)}
                                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-200/50 disabled:opacity-90 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                                >
                                    {isCreatingInteraction ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Registering...
                                        </>
                                    ) : (
                                        'Yes, register'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RegisterInteractionModal;
