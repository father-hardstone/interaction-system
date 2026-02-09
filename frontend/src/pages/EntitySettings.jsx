import { useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect, useRef } from 'react';
import { entityService } from '../services/entityService';
import supabaseStorageService from '../services/supabaseService';
import { formatPhoneDisplay } from '../utils/formatUtils';

const EntitySettings = () => {
    const { serial } = useParams();
    const [entityData, setEntityData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        profilePicture: '',
        icon: ''
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [iconFile, setIconFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageUrls, setImageUrls] = useState({});
    const [showProfilePictureMenu, setShowProfilePictureMenu] = useState(false);
    const profilePictureInputRef = useRef(null);
    const iconInputRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setEntityData(decoded);
            } catch (e) {
                console.error('Failed to decode token');
            }
        }
        loadEntitySettings();
    }, []);

    const loadEntitySettings = async () => {
        try {
            setIsLoading(true);
            const data = await entityService.getSettings();
            const newFormData = {
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                profilePicture: data.profilePicture || '',
                icon: data.icon || ''
            };
            setFormData(newFormData);
            setEntityData(data);
            
            // Immediately load image URLs if paths exist
            if (newFormData.profilePicture || newFormData.icon) {
                const urls = {};
                if (newFormData.profilePicture && !newFormData.profilePicture.startsWith('data:image') && !newFormData.profilePicture.startsWith('http')) {
                    try {
                        urls.profilePicture = await supabaseStorageService.getFileUrl('CRM testing', newFormData.profilePicture);
                    } catch (err) {
                        console.error('Failed to load profile picture URL:', err);
                    }
                }
                if (newFormData.icon && !newFormData.icon.startsWith('data:image') && !newFormData.icon.startsWith('http')) {
                    try {
                        urls.icon = await supabaseStorageService.getFileUrl('CRM testing', newFormData.icon);
                    } catch (err) {
                        console.error('Failed to load icon URL:', err);
                    }
                }
                if (Object.keys(urls).length > 0) {
                    setImageUrls(urls);
                }
            }
        } catch (err) {
            console.error('Failed to load entity settings:', err);
            setError('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'profilePicture') {
                setProfilePictureFile(file);
                // Preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, profilePicture: reader.result }));
                };
                reader.readAsDataURL(file);
            } else if (type === 'icon') {
                setIconFile(file);
                // Preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, icon: reader.result }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const handleRemoveProfilePicture = () => {
        setProfilePictureFile(null);
        setFormData(prev => ({ ...prev, profilePicture: '' }));
        setShowProfilePictureMenu(false);
    };

    const handleRemoveIcon = () => {
        setIconFile(null);
        setFormData(prev => ({ ...prev, icon: '' }));
    };

    const uploadImageToSupabase = async (file, type) => {
        if (!file || !entityData?.id) return null;

        try {
            let path;
            if (type === 'entity-profile') {
                path = await supabaseStorageService.uploadEntityProfilePicture(file, entityData.id);
            } else if (type === 'entity-icon') {
                path = await supabaseStorageService.uploadEntityIcon(file, entityData.id);
            } else {
                throw new Error('Invalid upload type');
            }

            return path;
        } catch (err) {
            console.error('Failed to upload image to Supabase:', err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setIsSaving(true);

            // Upload images to Supabase if files are selected
            let profilePicturePath = formData.profilePicture;
            let iconPath = formData.icon;

            if (profilePictureFile) {
                profilePicturePath = await uploadImageToSupabase(profilePictureFile, 'entity-profile');
            }

            if (iconFile) {
                iconPath = await uploadImageToSupabase(iconFile, 'entity-icon');
            }

            // Update entity settings with Supabase file paths
            const updateData = {
                name: formData.name,
                profilePicture: profilePicturePath,
                icon: iconPath
            };

            const updated = await entityService.updateSettings(updateData);
            
            // Update local state
            setFormData(prev => ({
                ...prev,
                name: updated.name || '',
                profilePicture: updated.profilePicture || '',
                icon: updated.icon || ''
            }));
            setEntityData(updated);
            setProfilePictureFile(null);
            setIconFile(null);
            setSuccess('Settings updated successfully!');
            
        } catch (err) {
            console.error('Failed to update settings:', err);
            setError(err.response?.data?.error || 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    // Load image URLs from Supabase using SDK
    useEffect(() => {
        const loadImageUrls = async () => {
            const urls = {};
            
            // Load profile picture URL
            if (formData.profilePicture && !formData.profilePicture.startsWith('data:image') && !formData.profilePicture.startsWith('http')) {
                try {
                    const url = await supabaseStorageService.getFileUrl('CRM testing', formData.profilePicture);
                    if (url) {
                        urls.profilePicture = url;
                    }
                } catch (err) {
                    console.error('Failed to load profile picture URL:', err);
                }
            }
            
            // Load icon URL
            if (formData.icon && !formData.icon.startsWith('data:image') && !formData.icon.startsWith('http')) {
                try {
                    const url = await supabaseStorageService.getFileUrl('CRM testing', formData.icon);
                    if (url) {
                        urls.icon = url;
                    }
                } catch (err) {
                    console.error('Failed to load icon URL:', err);
                }
            }
            
            // Only update if we have URLs to set
            if (Object.keys(urls).length > 0) {
                setImageUrls(prev => ({ ...prev, ...urls }));
            }
        };

        if (formData.profilePicture || formData.icon) {
            loadImageUrls();
        }
    }, [formData.profilePicture, formData.icon]);

    const getImageUrl = (path, type) => {
        if (!path) return null;
        
        if (path.startsWith('data:image')) {
            return path;
        }
        
        if (path.startsWith('http')) {
            return path;
        }
        
        return imageUrls[type] || null;
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                        {entityData?.name || 'Entity'}
                    </h2>
                    <p className="text-sm text-slate-500 normal-case">{serial}</p>
                </div>

                <nav className="flex-1 p-4">
                    <Link
                        to={`/entity/${serial}/dashboard`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors mb-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link
                        to={`/entity/${serial}/settings`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-primary font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/entity/login';
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50">
                <div className="bg-white border-b border-slate-200 px-8 py-6">
                    <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
                    <p className="text-slate-500 mt-1">Manage your entity information</p>
                </div>

                <div className="max-w-4xl mx-auto p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                            {/* Success/Error Messages */}
                            {success && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6">
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                    {error}
                                </div>
                            )}

                            {/* Profile Picture Section - Top Center */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group">
                                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-200 bg-slate-100 flex items-center justify-center">
                                        {(() => {
                                            if (!formData.profilePicture) {
                                                return (
                                                    <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                );
                                            }
                                            
                                            const imageUrl = getImageUrl(formData.profilePicture, 'profilePicture');
                                            
                                            // If we have a data URL (preview) or full URL, show it immediately
                                            if (formData.profilePicture.startsWith('data:image') || formData.profilePicture.startsWith('http')) {
                                                return (
                                                    <img
                                                        src={formData.profilePicture}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                );
                                            }
                                            
                                            // If URL is loaded from Supabase, show image
                                            if (imageUrl) {
                                                return (
                                                    <img
                                                        src={imageUrl}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                        }}
                                                    />
                                                );
                                            }
                                            
                                            // Otherwise show loading spinner
                                            return (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    
                                    {/* Edit Button - Left of Profile Picture */}
                                    <button
                                        type="button"
                                        onClick={() => setShowProfilePictureMenu(!showProfilePictureMenu)}
                                        className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-10"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showProfilePictureMenu && (
                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 translate-x-full ml-2 bg-white rounded-lg shadow-xl border border-slate-200 py-2 min-w-[160px] z-20">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    profilePictureInputRef.current?.click();
                                                    setShowProfilePictureMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Change Photo
                                            </button>
                                            {formData.profilePicture && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleRemoveProfilePicture();
                                                        setShowProfilePictureMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Remove Photo
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Hidden File Input */}
                                    <input
                                        ref={profilePictureInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'profilePicture')}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Entity Information */}
                            <div className="space-y-6 mb-8">
                                {/* Entity Name - Editable */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900">
                                        Entity Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        className="w-full py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-white transition-all text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-blue-100"
                                        placeholder="Enter entity name"
                                    />
                                </div>

                                {/* Entity Serial - Read Only */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 text-slate-500">
                                        Entity Serial
                                    </label>
                                    <input
                                        type="text"
                                        value={entityData?.serial || serial}
                                        disabled
                                        className="w-full py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Entity ID - Read Only */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 text-slate-500">
                                        Entity ID
                                    </label>
                                    <input
                                        type="text"
                                        value={entityData?.id || ''}
                                        disabled
                                        className="w-full py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Email - Read Only */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 text-slate-500">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email || entityData?.email || ''}
                                        disabled
                                        className="w-full py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone - Read Only */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-slate-900 text-slate-500">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formatPhoneDisplay(formData.phone || entityData?.phone) || ''}
                                        disabled
                                        className="w-full py-3 px-4 border border-slate-200 rounded-xl font-inherit text-base bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Entity Icon Section - Wide Block */}
                            <div className="mb-8">
                                <label className="text-sm font-semibold text-slate-900 mb-4 block">Entity Icon</label>
                                
                                {formData.icon ? (
                                    <div className="relative inline-block group">
                                        <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                                            {(() => {
                                                const iconUrl = getImageUrl(formData.icon, 'icon');
                                                
                                                // If we have a data URL (preview) or full URL, show it immediately
                                                if (formData.icon.startsWith('data:image') || formData.icon.startsWith('http')) {
                                                    return (
                                                        <img
                                                            src={formData.icon}
                                                            alt="Icon"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    );
                                                }
                                                
                                                // If URL is loaded from Supabase, show image
                                                if (iconUrl) {
                                                    return (
                                                        <img
                                                            src={iconUrl}
                                                            alt="Icon"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                            }}
                                                        />
                                                    );
                                                }
                                                
                                                // Otherwise show loading spinner
                                                return (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        {/* Remove Button - Cross on top */}
                                        <button
                                            type="button"
                                            onClick={handleRemoveIcon}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => iconInputRef.current?.click()}
                                        className="w-full border-2 border-dashed border-slate-300 rounded-xl p-12 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700 mb-1">Upload Entity Icon</p>
                                            <p className="text-xs text-slate-500">Click to browse or drag and drop</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                                        </div>
                                    </div>
                                )}

                                {/* Hidden File Input for Icon */}
                                <input
                                    ref={iconInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'icon')}
                                    className="hidden"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => loadEntitySettings()}
                                    className="px-6 py-3 bg-slate-200 text-slate-800 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EntitySettings;
