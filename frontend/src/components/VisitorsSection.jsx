import PhoneInput from './PhoneInput';

const VisitorsSection = ({
    visitors,
    searchFirstName,
    setSearchFirstName,
    searchMiddleName,
    setSearchMiddleName,
    searchLastName,
    setSearchLastName,
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
    phoneHData,
    setPhoneHData,
    idCardNumber,
    setIdCardNumber,
    healthCardVersion,
    setHealthCardVersion,
    healthCardEffectivityDate,
    setHealthCardEffectivityDate,
    healthCardExpiryDate,
    setHealthCardExpiryDate,
    handleCreateVisitor,
    handleIdCardChange,
    error,
    setError,
    onDeleteVisitor,
    handlePatientClick,
    selectedPatient,
    showPatientDetailModal,
    setShowPatientDetailModal,
    handlePatientDragStart,
    handlePatientDrop,
    isCreatingVisitor,
    deletingVisitorId
}) => {
    const filteredVisitors = visitors
        .filter((v) => {
            const firstName = (v.firstName || '').toLowerCase();
            const middleName = (v.middleName || '').toLowerCase();
            const lastName = (v.lastName || '').toLowerCase();
            const serialDisplay = `${v.entitySerial ? v.entitySerial + '-' : ''}${v.serial}`.toLowerCase();
            const phoneStr = (v.phone || '').toLowerCase();
            const idCardStr = (v.idCardNumber || '').toLowerCase();

            const matchesFirstName = !searchFirstName || firstName.includes(searchFirstName.toLowerCase());
            const matchesMiddleName = !searchMiddleName || middleName.includes(searchMiddleName.toLowerCase());
            const matchesLastName = !searchLastName || lastName.includes(searchLastName.toLowerCase());
            const matchesSerial = !searchSerial || serialDisplay.includes(searchSerial.toLowerCase());
            const matchesPhone = !searchPhone || phoneStr.includes(searchPhone.toLowerCase());
            const matchesIdCard = !searchIdCard || idCardStr.includes(searchIdCard.toLowerCase());

            return matchesFirstName && matchesMiddleName && matchesLastName && matchesSerial && matchesPhone && matchesIdCard;
        });

    return (
        <div className="space-y-6">
            {/* Visitors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Patients</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage patients for your entity</p>
                    </div>
                    <button
                        onClick={() => setShowVisitorModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors"
                    >
                        Add a patient
                    </button>
                </div>

                {/* Search filters */}
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-6 gap-4 border-b border-slate-200 bg-slate-50">
                    <input
                        type="text"
                        placeholder="Search by first name"
                        value={searchFirstName}
                        onChange={(e) => setSearchFirstName(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by middle name"
                        value={searchMiddleName}
                        onChange={(e) => setSearchMiddleName(e.target.value)}
                        className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                    />
                    <input
                        type="text"
                        placeholder="Search by last name"
                        value={searchLastName}
                        onChange={(e) => setSearchLastName(e.target.value)}
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
                        placeholder="Search by health card"
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
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Health Card</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                                        No patients found. Click "Add a patient" to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredVisitors.map((visitor) => {
                                    let dragStarted = false;
                                    return (
                                    <tr 
                                        key={visitor.id} 
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer"
                                        onMouseDown={() => {
                                            dragStarted = false;
                                        }}
                                        onClick={(e) => {
                                            if (!dragStarted) {
                                                handlePatientClick(visitor);
                                            }
                                        }}
                                        draggable
                                        onDragStart={(e) => {
                                            dragStarted = true;
                                            handlePatientDragStart(e, visitor);
                                            // Add visual feedback - make row look like it's being lifted
                                            e.currentTarget.style.opacity = '0.4';
                                            e.currentTarget.style.transform = 'scale(0.98)';
                                            e.currentTarget.style.transition = 'all 0.2s';
                                        }}
                                        onDragEnd={(e) => {
                                            // Reset visual feedback
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.transform = 'scale(1)';
                                            setTimeout(() => {
                                                dragStarted = false;
                                            }, 200);
                                        }}
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900">{visitor.entitySerial ? `${visitor.entitySerial}-${visitor.serial}` : visitor.serial}</td>
                                        <td className="px-6 py-4 text-slate-700">
                                            <div className="font-medium">
                                                {visitor.firstName} {visitor.middleName ? visitor.middleName + ' ' : ''}{visitor.lastName}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                <span>{visitor.firstName || 'N/A'}</span>
                                                <span className="text-slate-300 mx-1">•</span>
                                                <span>{visitor.middleName || 'N/A'}</span>
                                                <span className="text-slate-300 mx-1">•</span>
                                                <span>{visitor.lastName || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.dateOfBirth}</td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.phone}</td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.email || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-700">{visitor.idCardNumber}</td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => onDeleteVisitor(visitor.id)}
                                                disabled={deletingVisitorId === visitor.id}
                                                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {deletingVisitorId === visitor.id ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    'Delete'
                                                )}
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

            {/* Add Visitor Modal */}
            {showVisitorModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowVisitorModal(false)}>
                    <div className="bg-white w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Patient</h2>
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

                            <div className="grid grid-cols-3 gap-4">
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
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Postal Code <span className="text-slate-500 text-xs font-normal">(5 digits)</span></label>
                                    <input
                                        type="text"
                                        placeholder="12345"
                                        value={visitorForm.postalCode}
                                        onChange={(e) => {
                                            // Only allow digits, max 5
                                            const value = e.target.value.replace(/\D/g, '').substring(0, 5);
                                            setVisitorForm({ ...visitorForm, postalCode: value });
                                        }}
                                        maxLength={5}
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

                            {/* Phone (H) */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Phone Number (H)</label>
                                <PhoneInput
                                    onChange={setPhoneHData}
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

                            {/* Health Card Number */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Health Card Number <span className="text-red-500">*</span> <span className="text-slate-500 text-xs font-normal">(10 digits)</span></label>
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

                            {/* Health Card Version */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Health Card Version <span className="text-slate-500 text-xs font-normal">(max 2 characters)</span></label>
                                <input
                                    type="text"
                                    placeholder="Version"
                                    value={healthCardVersion}
                                    onChange={(e) => {
                                        const value = e.target.value.substring(0, 2);
                                        setHealthCardVersion(value);
                                    }}
                                    maxLength={2}
                                    className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            {/* Health Card Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Effectivity Date <span className="text-slate-500 text-xs font-normal">(DD-MM-YYYY)</span></label>
                                    <input
                                        type="text"
                                        placeholder="DD-MM-YYYY"
                                        value={healthCardEffectivityDate}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
                                            if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 9);
                                            setHealthCardEffectivityDate(value);
                                        }}
                                        maxLength={10}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">Expiry Date <span className="text-slate-500 text-xs font-normal">(DD-MM-YYYY)</span></label>
                                    <input
                                        type="text"
                                        placeholder="DD-MM-YYYY"
                                        value={healthCardExpiryDate}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length > 2) value = value.substring(0, 2) + '-' + value.substring(2);
                                            if (value.length > 5) value = value.substring(0, 5) + '-' + value.substring(5, 9);
                                            setHealthCardExpiryDate(value);
                                        }}
                                        maxLength={10}
                                        className="w-full py-3.5 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 transition-all text-slate-900 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
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
                                            postalCode: '',
                                            gender: '',
                                            email: '',
                                            phoneH: ''
                                        });
                                        setPhoneData({ fullNumber: '', valid: false });
                                        setPhoneHData({ fullNumber: '', valid: false });
                                        setIdCardNumber('');
                                        setHealthCardVersion('');
                                        setHealthCardEffectivityDate('');
                                        setHealthCardExpiryDate('');
                                        setError('');
                                    }}
                                    className="flex-1 py-4 px-4 bg-slate-200 text-slate-800 border-none rounded-xl cursor-pointer hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreatingVisitor}
                                    className="flex-1 py-4 px-4 bg-primary text-white border-none rounded-xl font-semibold text-base cursor-pointer transition-all shadow-lg shadow-blue-300/30 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {isCreatingVisitor ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Patient'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Detail Modal */}
            {showPatientDetailModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]" onClick={() => setShowPatientDetailModal(false)}>
                    <div className="bg-white w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-8 rounded-3xl shadow-lg animate-[slideUp_0.4s_ease-out] mx-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Patient Details</h2>
                            <button
                                onClick={() => setShowPatientDetailModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">ID</label>
                                    <p className="text-base text-slate-900 mt-1">
                                        {selectedPatient.entitySerial ? `${selectedPatient.entitySerial}-${selectedPatient.serial}` : selectedPatient.serial}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Date of Birth</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.dateOfBirth || 'N/A'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-500">Name</label>
                                <p className="text-base text-slate-900 mt-1">
                                    {selectedPatient.firstName} {selectedPatient.middleName ? selectedPatient.middleName + ' ' : ''}{selectedPatient.lastName}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    <span>{selectedPatient.firstName || 'N/A'}</span>
                                    <span className="text-slate-300 mx-1">•</span>
                                    <span>{selectedPatient.middleName || 'N/A'}</span>
                                    <span className="text-slate-300 mx-1">•</span>
                                    <span>{selectedPatient.lastName || 'N/A'}</span>
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-500">Address</label>
                                <p className="text-base text-slate-900 mt-1">
                                    {selectedPatient.addressLine || 'N/A'}
                                    {selectedPatient.city && `, ${selectedPatient.city}`}
                                    {selectedPatient.state && `, ${selectedPatient.state}`}
                                    {selectedPatient.postalCode && ` ${selectedPatient.postalCode}`}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Phone</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Phone (H)</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.phoneH || 'N/A'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-500">Email</label>
                                <p className="text-base text-slate-900 mt-1">{selectedPatient.email || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-500">Gender</label>
                                <p className="text-base text-slate-900 mt-1 capitalize">{selectedPatient.gender || 'N/A'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-500">Health Card Number</label>
                                <p className="text-base text-slate-900 mt-1">{selectedPatient.idCardNumber || 'N/A'}</p>
                            </div>

                            {selectedPatient.healthCardVersion && (
                                <div>
                                    <label className="text-sm font-semibold text-slate-500">Health Card Version</label>
                                    <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardVersion}</p>
                                </div>
                            )}

                            {(selectedPatient.healthCardEffectivityDate || selectedPatient.healthCardExpiryDate) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedPatient.healthCardEffectivityDate && (
                                        <div>
                                            <label className="text-sm font-semibold text-slate-500">Effectivity Date</label>
                                            <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardEffectivityDate}</p>
                                        </div>
                                    )}
                                    {selectedPatient.healthCardExpiryDate && (
                                        <div>
                                            <label className="text-sm font-semibold text-slate-500">Expiry Date</label>
                                            <p className="text-base text-slate-900 mt-1">{selectedPatient.healthCardExpiryDate}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => setShowPatientDetailModal(false)}
                                    className="w-full py-3 px-4 bg-primary text-white rounded-xl font-semibold text-base hover:bg-primary-dark transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisitorsSection;
