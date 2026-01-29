import React, { useState, useEffect } from 'react';

const MediaViewerModal = ({ viewingMedia, setViewingMedia }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (viewingMedia) {
            setIsLoading(true);
            setHasError(false);
        }
    }, [viewingMedia]);

    if (!viewingMedia) return null;

    const handleImageLoad = () => {
        setIsLoading(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
                onClick={() => setViewingMedia(null)}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full h-full max-w-5xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <h3 className="text-base font-bold text-slate-900 truncate pr-8">
                        {viewingMedia.title || 'Preview'}
                    </h3>
                    <button
                        onClick={() => setViewingMedia(null)}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end">
                    <button
                        onClick={() => setViewingMedia(null)}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MediaViewerModal;
