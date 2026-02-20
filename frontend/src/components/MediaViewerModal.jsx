import React, { useState, useEffect, useRef } from 'react';

const MediaViewerModal = ({ viewingMedia, setViewingMedia }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const loadTimeoutRef = useRef(null);

    useEffect(() => {
        if (viewingMedia) {
            setIsLoading(true);
            setHasError(false);
            loadTimeoutRef.current = setTimeout(() => {
                setIsLoading(false);
                setHasError(true);
            }, 12000);
        }
        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
            }
        };
    }, [viewingMedia]);

    if (!viewingMedia) return null;

    const clearLoadTimeout = () => {
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }
    };

    const handleImageLoad = () => {
        clearLoadTimeout();
        setIsLoading(false);
        setHasError(false);
    };

    const handleImageError = () => {
        clearLoadTimeout();
        setIsLoading(false);
        setHasError(true);
    };

    const handleIframeLoad = () => {
        clearLoadTimeout();
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center px-4 pb-4 pt-0 !mt-0">
            <div
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
                onClick={() => setViewingMedia(null)}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-slate-900 truncate">
                            {viewingMedia.title || 'Preview'}
                        </h3>
                        {viewingMedia.fileType && (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">{viewingMedia.fileType}</span>
                        )}
                    </div>
                    <button
                        onClick={() => setViewingMedia(null)}
                        className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-colors shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-hidden bg-slate-50 flex items-center justify-center p-2 sm:p-4 relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-slate-500 font-medium">Loading...</span>
                            </div>
                        </div>
                    )}
                    {viewingMedia.type === 'pdf' ? (
                        <iframe
                            src={`${viewingMedia.url}#toolbar=0&navpanes=0&scrollbar=0`}
                            className="w-full h-full rounded-lg bg-white border border-slate-200"
                            title={viewingMedia.title}
                            onLoad={handleIframeLoad}
                        />
                    ) : (
                        <>
                            {hasError ? (
                                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium">Failed to load image</span>
                                </div>
                            ) : (
                                <img
                                    src={viewingMedia.url}
                                    alt={viewingMedia.title}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MediaViewerModal;
