import { useState, useMemo } from 'react';

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
    isCreatingInteraction = false
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
            const matchesHealthCard = !searchHealthCard || healthCardStr.includes(searchHealthCard.toLowerCase());
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
        const success = await handleRegisterPatient(pendingRegisterVisitor);
        if (success) {
            setShowRegisterConfirmModal(false);
            setPendingRegisterVisitor(null);
            onClose();
        }
    };

    const initiateRegistration = (visitor) => {
        setPendingRegisterVisitor(visitor);
        setShowRegisterConfirmModal(true);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 my-8">
                    <div className="shrink-0 p-6 border-b border-slate-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Register Interaction</h2>
                                <p className="text-sm text-slate-500 mt-1">Select a patient to register an interaction</p>
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
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                                type="text"
                                placeholder="Search by ID"
                                value={searchSerial}
                                onChange={(e) => setSearchSerial(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                maxLength={6}
                                className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                                type="text"
                                placeholder="Search by health card"
                                value={searchHealthCard}
                                onChange={(e) => setSearchHealthCard(e.target.value.replace(/\D/g, '').substring(0, 10))}
                                maxLength={10}
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
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto min-h-0">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 hidden xl:table-cell">Last Visit</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
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
                                                className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-900 text-sm">{visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial || '-'}` : (visitor.serial || '-')}</td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    <div className="font-medium text-sm">
                                                        {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 hidden md:table-cell text-sm">{visitor.dateOfBirth || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden lg:table-cell text-sm">{visitor.phone || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden xl:table-cell text-sm">{visitor.healthCardNumber || '-'}</td>
                                                <td className="px-4 py-3 text-slate-700 hidden xl:table-cell text-sm">
                                                    {lastVisit ? formatDate(lastVisit.editedAt || lastVisit.createdAt, true) : '-'}
                                                </td>
                                                <td className="px-4 py-3">
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
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isCreatingInteraction && (setShowRegisterConfirmModal(false), setPendingRegisterVisitor(null))}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Registration</h3>
                            <p className="text-slate-600 text-sm mb-6">
                                Do you want to register an interaction for {pendingRegisterVisitor ? `${pendingRegisterVisitor.firstName || ''} ${pendingRegisterVisitor.lastName || ''}`.trim() : 'this patient'}?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        if (!isCreatingInteraction) {
                                            setShowRegisterConfirmModal(false);
                                            setPendingRegisterVisitor(null);
                                        }
                                    }}
                                    disabled={isCreatingInteraction}
                                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    No, cancel
                                </button>
                                <button
                                    onClick={confirmRegistration}
                                    disabled={isCreatingInteraction}
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
