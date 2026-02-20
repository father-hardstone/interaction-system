import React, { useState, useEffect, useRef } from 'react';

/**
 * Warning icon that shows red-zone content (allergies, type of reaction, etc.) on hover or click (touch).
 * Popup matches the red zone styling from PatientDetailsModal.
 */
const PatientHealthWarningTooltip = ({ visitor, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen]);

    if (!visitor) return null;

    const hasContent =
        (visitor.allergies && visitor.allergies !== 'N/A') ||
        (visitor.drugReactions && visitor.drugReactions !== 'N/A') ||
        (visitor.specialNotes && visitor.specialNotes !== '-');

    const RedZoneContent = () => (
        <div className="p-2 bg-red-50 border-2 border-red-200 rounded-xl min-w-[280px] max-w-[360px] shadow-xl">
            <div className="text-xs font-medium text-slate-500 mb-2 normal-case">Allergies, type of reaction & special notes</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <div className="space-y-0.5">
                    <label className="text-sm font-semibold text-red-900 normal-case tracking-wide block">Allergies</label>
                    <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight">{visitor.allergies || 'N/A'}</div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-sm font-semibold text-red-900 normal-case tracking-wide block">Type of Reaction</label>
                    <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight">{visitor.drugReactions || 'N/A'}</div>
                </div>
                <div className="space-y-0.5">
                    <label className="text-sm font-semibold text-red-900 normal-case tracking-wide block">Special Notes</label>
                    <div className="text-sm font-semibold text-slate-700 normal-case tracking-tight">{visitor.specialNotes || '-'}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={`relative inline-flex ${className}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                type="button"
                onClick={() => setIsOpen((o) => !o)}
                className={`inline-flex items-center justify-center rounded-full p-0.5 cursor-help transition-colors touch-manipulation ${
                    hasContent ? 'text-red-500 hover:text-red-600' : 'text-red-300'
                }`}
                aria-label="View allergies and health conditions"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute left-0 top-full pt-1 z-[100]">
                    <RedZoneContent />
                </div>
            )}
        </div>
    );
};

export default PatientHealthWarningTooltip;
