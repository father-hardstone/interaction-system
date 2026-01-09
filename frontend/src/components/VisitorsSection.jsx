import PhoneInput from './PhoneInput';

const VisitorsSection = ({
    visitors,
    searchName,
    setSearchName,
    searchSerial,
    setSearchSerial,
    searchPhone,
    setSearchPhone,
    searchIdCard,
    setSearchIdCard,
    showVisitorModal,
    setShowVisitorModal,
    visitorForm,
    setVisitorForm,
    phoneData,
    setPhoneData,
    idCardNumber,
    setIdCardNumber,
    handleCreateVisitor,
    handleIdCardChange,
    error,
    setError,
    onDeleteVisitor
}) => {
    const filteredVisitors = visitors
        .filter((v) => {
            const fullName = `${v.firstName} ${v.middleName ? v.middleName + ' ' : ''}${v.lastName}`.toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial}`.toLowerCase();
            const phoneStr = (v.phone || '').toLowerCase();
            const idCardStr = (v.idCardNumber || '').toLowerCase();

            const matchesName = !searchName || fullName.includes(searchName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const matchesPhone = !searchPhone || phoneStr.includes(searchPhone.toLowerCase());
            const matchesIdCard = !searchIdCard || idCardStr.includes(searchIdCard.toLowerCase());

            return matchesName && matchesSerial && matchesPhone && matchesIdCard;
        });

    return (
        <div className="space-y-6">
            {/* Visitors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Visitors</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage visitors for your entity</p>
                    </div>
                    <button
                        onClick={() => setShowVisitorModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        Add a visitor
                    </button>
                </div>

                {/* Search filters */}
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search by name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchSerial}
                        onChange={(e) => setSearchSerial(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by phone"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by ID card"
                        value={searchIdCard}
                        onChange={(e) => setSearchIdCard(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date of Birth</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID Card</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                                        No visitors found. Click "Add a visitor" to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((visitor) => (
                                    <tr key={visitor.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial}` : visitor.serial}</td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {visitor.firstName} {visitor.middleName ? visitor.middleName + ' ' : ''}{visitor.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.dateOfBirth}</td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.phone}</td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.idCardNumber}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => onDeleteVisitor(visitor.id)}
                                                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Visitor Modal */}
            {showVisitorModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowVisitorModal(false)}>
                    <div className="bg-white w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Visitor</h2>
                        {error && <p className="bg-red-50 border border-red-200 text-red-600 py-3 px-4 rounded-xl text-sm mb-4">{error}</p>}
                        <form onSubmit={handleCreateVisitor} className="flex flex-col gap-5">
                            {/* Name Fields */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">First Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="First name"
                                        value={visitorForm.firstName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, firstName: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Middle Name</label>
                                    <input
                                        type="text"
                                        placeholder="Middle name"
                                        value={visitorForm.middleName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, middleName: e.target.value })}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Last Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Last name"
                                        value={visitorForm.lastName}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, lastName: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Date of Birth <span className="text-red-500">*</span> <span className="text-slate-500 text-xs font-normal">(DD-MM-YYYY)</span></label>
                                <input
                                    type="text"
                                    placeholder="DD-MM-YYYY"
                                    value={visitorForm.dateOfBirth}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, '');
                                        if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
                                        if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 9);
                                        setVisitorForm({ ...visitorForm, dateOfBirth: value });
                                    }}
                                    maxLength={10}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            {/* Address */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Address Line <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Street address"
                                    value={visitorForm.addressLine}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, addressLine: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">City <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={visitorForm.city}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, city: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">State <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={visitorForm.state}
                                        onChange={(e) => setVisitorForm({ ...visitorForm, state: e.target.value })}
                                        required
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Gender <span className="text-red-500">*</span></label>
                                <select
                                    value={visitorForm.gender}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, gender: e.target.value })}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone Number <span className="text-red-500">*</span></label>
                                <PhoneInput
                                    onChange={setPhoneData}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address (optional)"
                                    value={visitorForm.email}
                                    onChange={(e) => setVisitorForm({ ...visitorForm, email: e.target.value })}
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            {/* ID Card Number */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">ID Card Number <span className="text-red-500">*</span> <span className="text-slate-500 text-xs font-normal">(10 digits)</span></label>
                                <input
                                    type="text"
                                    placeholder="1234-5678-90"
                                    value={idCardNumber}
                                    onChange={handleIdCardChange}
                                    maxLength={12}
                                    required
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowVisitorModal(false);
                                        setVisitorForm({
                                            firstName: '',
                                            middleName: '',
                                            lastName: '',
                                            dateOfBirth: '',
                                            addressLine: '',
                                            city: '',
                                            state: '',
                                            gender: '',
                                            email: ''
                                        });
                                        setPhoneData({ fullNumber: '', valid: false });
                                        setIdCardNumber('');
                                        setError('');
                                    }}
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40"
                                >
                                    Create Visitor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorsSection;
