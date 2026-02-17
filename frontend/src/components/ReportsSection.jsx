import { useState, useMemo } from 'react';
import { formatHealthCardDisplay, parseHealthCardToDigits, formatDateMMDDYYYY, formatPhoneDisplay, getVisitorSerialDisplay, parsePhoneToDigits, getAgeYearsMonthsDisplay, getLastVisitDisplay } from '../utils/formatUtils';
import PatientSearchFilters from './PatientSearchFilters';
import ReportUpload from './ReportUpload';

const ReportsSection = ({
    visitors = [],
    isLoadingVisitors = false,
    interactions = [],
    lastVisits = {},
    officers = [],
    userData,
    getVisitorName,
    getVisitorSerial,
    formatDate,
    onPatientClick
}) => {
    const [searchFirstName, setSearchFirstName] = useState('');
    const [searchMiddleName, setSearchMiddleName] = useState('');
    const [searchLastName, setSearchLastName] = useState('');
    const [searchSerial, setSearchSerial] = useState('');
    const [searchHealthCard, setSearchHealthCard] = useState('');
    const [searchDob, setSearchDob] = useState('');
    const [searchContact, setSearchContact] = useState('');
    const [dobSearchFocused, setDobSearchFocused] = useState(false);

    const searchContactDigits = parsePhoneToDigits(searchContact || '');
    const filteredVisitors = useMemo(() => {
        return visitors.filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial || ''}`.toLowerCase();
            const healthCardStr = parseHealthCardToDigits(v.healthCardNumber || '');
            const dobStr = (v.dateOfBirth || '').toLowerCase();
            const toDigits = (p) => parsePhoneToDigits(p || '');
            const phoneM = toDigits(v.phoneM || v.phone);
            const phoneB = toDigits(v.phoneB);
            const phoneH = toDigits(v.phoneH);
            const anyPhoneContains = !searchContactDigits || [phoneM, phoneB, phoneH].some(d => d && d.includes(searchContactDigits));

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

            return matchesFirstName && matchesMiddleName && matchesLastName && matchesSerial && matchesHealthCard && matchesDob && anyPhoneContains;
        });
    }, [visitors, searchFirstName, searchMiddleName, searchLastName, searchSerial, searchHealthCard, searchDob, searchContactDigits]);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="p-4 sm:p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage patient medical reports</p>
                </div>

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

                <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full border-collapse min-w-[800px]">
                        <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden md:table-cell">Date of Birth</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden lg:table-cell">Phone</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Health Card</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Version</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700 hidden xl:table-cell">Last Visit</th>
                                <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingVisitors ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
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
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                                        No patients found.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((visitor) => (
                                        <tr
                                            key={visitor.id}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                            onClick={() => onPatientClick?.(visitor)}
                                        >
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden md:table-cell text-sm">
                                                {formatDateMMDDYYYY(visitor.dateOfBirth) || '-'}
                                                {visitor.dateOfBirth && (
                                                    <span className="text-slate-500 ml-1">({getAgeYearsMonthsDisplay(visitor)})</span>
                                                )}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700">
                                                <div className="font-medium text-sm">
                                                    {visitor.firstName || '-'} {(visitor.middleName ? visitor.middleName + ' ' : '') + (visitor.lastName || '-')}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-4 font-medium text-slate-900 text-xs sm:text-sm">{getVisitorSerialDisplay(visitor) || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden lg:table-cell text-sm">{formatPhoneDisplay(visitor.phoneM || visitor.phone) || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{formatHealthCardDisplay(visitor.healthCardNumber || '') || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">{visitor.healthCardVersion || '-'}</td>
                                            <td className="px-4 sm:px-6 py-4 text-slate-700 hidden xl:table-cell text-sm">
                                                {getLastVisitDisplay(visitor, lastVisits, interactions)}
                                            </td>
                                            <td className="px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <ReportUpload
                                                    visitor={visitor}
                                                    entityId={userData?.entityId}
                                                    entitySerial={userData?.entitySerial}
                                                    interactions={interactions}
                                                    officers={officers}
                                                    onUploadSuccess={() => {}}
                                                    buttonLabel="Add Report"
                                                />
                                            </td>
                                        </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsSection;
