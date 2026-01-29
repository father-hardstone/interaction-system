import { useState, useMemo } from 'react';
import ReportUpload from './ReportUpload';

const RecordsSection = ({
    visitors = [],
    isLoadingVisitors = false,
    interactions = [],
    officers = [],
    userData,
    getVisitorName,
    getVisitorSerial,
    formatDate
}) => {
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchMiddleName, setSearchMiddleName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchHealthCard, setSearchHealthCard] = useState('');
    const [searchDob, setSearchDob] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);

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

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Records</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage patient medical records and reports</p>
                </div>

                <div className="px-4 sm:p-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 border-b border-slate-200 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search by last name"
                        value={searchLastName}
                        onChange={(e) => setSearchLastName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by first name"
                        value={searchFirstName}
                        onChange={(e) => setSearchFirstName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchSerial}
                        onChange={(e) => setSearchSerial(e.target.value.replace(/\D/g, '').substring(0, 6))}
                        maxLength={6}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by health card"
                        value={searchHealthCard}
                        onChange={(e) => setSearchHealthCard(e.target.value.replace(/\D/g, '').substring(0, 10))}
                        maxLength={10}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <div className="relative flex items-center">
                        <input
                            type={dobSearchFocused || searchDob ? "date" : "text"}
                            placeholder={!dobSearchFocused && !searchDob ? "Search by DOB" : ""}
                            value={searchDob}
                            onFocus={() => setDobSearchFocused(true)}
                            onBlur={() => setDobSearchFocused(false)}
                            onChange={(e) => setSearchDob(e.target.value)}
                            className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100 placeholder-slate-400"
                        />
                        {searchDob && (
                            <button
                                onClick={() => setSearchDob('')}
                                className="absolute right-9 text-slate-400 hover:text-slate-600 transition-colors bg-white px-1"
                                title="Clear date"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Health Card</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Last Visit</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingVisitors ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-sm font-semibold text-slate-600">Loading patients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                        No patients found.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((visitor) => {
                                    const lastVisit = interactions
                                        .filter(i => i.visitorId === visitor.id && i.completed)
                                        .sort((a, b) => new Date(b.editedAt || b.createdAt) - new Date(a.editedAt || a.createdAt))[0];

                                    return (
                                        <tr
                                            key={visitor.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                                        >
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial || '-'}` : (visitor.serial || '-')}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700">
                                                <div className="font-medium text-sm">
                                                    {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">{visitor.healthCardNumber || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 text-sm">
                                                {lastVisit ? formatDate(lastVisit.editedAt || lastVisit.createdAt, true) : '-'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4">
                                                <ReportUpload
                                                    visitor={visitor}
                                                    entityId={userData?.entityId}
                                                    entitySerial={userData?.entitySerial}
                                                    interactions={interactions}
                                                    officers={officers}
                                                    onUploadSuccess={() => {}}
                                                    buttonLabel="Add Record"
                                                />
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
    );
};

export default RecordsSection;
