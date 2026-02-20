import { useRef, useState, useEffect, useMemo } from 'react';

const MAX_SHEETS = 4;

/** Parse value into sheets array. Supports legacy single image, JSON array, or array from API. */
function parseSheets(value) {
    if (value == null || value === '') return [''];
    if (Array.isArray(value)) return value.slice(0, MAX_SHEETS);
    if (typeof value === 'string' && value.trim().startsWith('[')) {
        try {
            const arr = JSON.parse(value);
            return Array.isArray(arr) ? arr.slice(0, MAX_SHEETS) : [value];
        } catch {
            return [value];
        }
    }
    return [value];
}

/** Serialize sheets for onChange. Preserves empty sheets when multiple. */
function serializeSheets(sheets) {
    if (sheets.length <= 1) return sheets[0] || '';
    return JSON.stringify(sheets);
}

/** Check if a sheet has meaningful content (non-empty image). */
function sheetHasContent(sheet) {
    return !!sheet && (sheet.startsWith('data:image') || sheet.includes('/interactions/'));
}

// existingSheetCount: when in edit mode, first N sheets are read-only; new sheets can be added and edited.
const DrawingPad = ({ label, value, onChange, minHeight = '200px', enableSheets = false, readOnly = false, existingSheetCount = 0, addedLaterSheetIndices }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const modalCanvasRef = useRef(null);
    const modalContainerRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const [showModal, setShowModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    /** True only after the current sheet image has been drawn on canvas (or there is no image). Avoids blank flash when switching sheets. */
    const [imageLoaded, setImageLoaded] = useState(false);
    const [modalImageLoaded, setModalImageLoaded] = useState(false);

    const sheets = useMemo(() => parseSheets(value), [value]);
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

    useEffect(() => {
        if (currentSheetIndex >= sheets.length) {
            setCurrentSheetIndex(Math.max(0, sheets.length - 1));
        }
    }, [sheets.length, currentSheetIndex]);

    const currentSheetValue = sheets[currentSheetIndex] ?? '';
    const isCurrentSheetReadOnly = readOnly || (existingSheetCount > 0 && currentSheetIndex < existingSheetCount);
    const isCurrentSheetAddedLater = Array.isArray(addedLaterSheetIndices) && addedLaterSheetIndices.includes(currentSheetIndex);

    const notifyChange = (newSheets) => {
        const serialized = serializeSheets(newSheets);
        onChange(serialized);
    };

    const updateCurrentSheet = (dataUrl) => {
        const next = [...sheets];
        next[currentSheetIndex] = dataUrl;
        notifyChange(next);
    };

    const canAddSheet = enableSheets && sheets.length < MAX_SHEETS && (sheetHasContent(currentSheetValue) || existingSheetCount > 0);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fixed internal canvas resolution for consistent drawing
    // This is the "whiteboard" size - drawings are stored at this resolution
    const CANVAS_WIDTH = 2000;
    const CANVAS_HEIGHT = 1200;

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Set canvas internal resolution (this is the actual drawing surface)
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // Configure drawing context
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0ea5e9';

        // If there's a saved image, load it (set crossOrigin for URLs so canvas is not tainted). Show spinner until drawn.
        const imgSrc = enableSheets ? currentSheetValue : value;
        if (imgSrc && (imgSrc.startsWith('data:image') || imgSrc.includes('/interactions/') || imgSrc.startsWith('http'))) {
            setImageLoaded(false);
            const img = new Image();
            if (!imgSrc.startsWith('data:')) {
                img.crossOrigin = 'anonymous';
            }
            img.onload = () => {
                ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                setImageLoaded(true);
            };
            img.onerror = () => setImageLoaded(true);
            img.src = imgSrc;
        } else {
            setImageLoaded(true);
        }

        // Update canvas display size when container resizes
        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                // Set CSS size to match container (display size)
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
            }
        };

        updateCanvasSize();

        // Use ResizeObserver to update display size when container resizes
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(container);

        // Touch events need passive: false to allow preventDefault (stop scroll while drawing)
        const opts = { passive: false };
        const onTouchStart = (e) => { startDraw(e); };
        const onTouchMove = (e) => { draw(e); };
        const onTouchEnd = () => { endDraw(); };

        canvas.addEventListener('touchstart', onTouchStart, opts);
        canvas.addEventListener('touchmove', onTouchMove, opts);
        canvas.addEventListener('touchend', onTouchEnd, opts);
        canvas.addEventListener('touchcancel', onTouchEnd, opts);

        return () => {
            resizeObserver.disconnect();
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [enableSheets ? currentSheetValue : value, enableSheets]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return { x: 0, y: 0 };

        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Get position relative to container
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Convert to canvas internal coordinates
        // Scale from display size to internal canvas size
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        return {
            x: x * scaleX,
            y: y * scaleY
        };
    };

    const startDraw = (e) => {
        if (isCurrentSheetReadOnly) return;
        e.preventDefault();
        isDrawing.current = true;
        lastPos.current = getPos(e);
    };

    const draw = (e) => {
        if (isCurrentSheetReadOnly || !isDrawing.current) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPos.current = pos;
    };

    const endDraw = () => {
        if (isDrawing.current) {
            const canvas = canvasRef.current;
            if (canvas) {
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    if (enableSheets) updateCurrentSheet(dataUrl);
                    else onChange(dataUrl);
                } catch (_) {
                    // Tainted canvas - skip update
                }
            }
        }
        isDrawing.current = false;
    };

    const handleClear = () => {
        if (isCurrentSheetReadOnly) return;
        const canvas = showModal && isMobile ? modalCanvasRef.current : canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (enableSheets) updateCurrentSheet('');
        else onChange('');
    };

    const handleOpenModal = () => {
        if (isMobile) {
            setShowModal(true);
            const imgSrc = enableSheets ? currentSheetValue : value;
            setTimeout(() => {
                const sourceCanvas = canvasRef.current;
                const targetCanvas = modalCanvasRef.current;
                if (sourceCanvas && targetCanvas) {
                    const ctx = targetCanvas.getContext('2d');
                    if (imgSrc && (imgSrc.startsWith('data:image') || imgSrc.includes('/interactions/') || imgSrc.startsWith('http'))) {
                        const img = new Image();
                        if (!imgSrc.startsWith('data:')) {
                            img.crossOrigin = 'anonymous';
                        }
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                        };
                        img.onerror = () => {};
                        img.src = imgSrc;
                    }
                }
            }, 100);
        }
    };

    const handleCloseModal = () => {
        if (readOnly) {
            setShowModal(false);
            return;
        }
        if (showModal && modalCanvasRef.current) {
            try {
                const dataUrl = modalCanvasRef.current.toDataURL('image/png');
                if (enableSheets) updateCurrentSheet(dataUrl);
                else onChange(dataUrl);
            } catch (_) {
                // Tainted canvas - skip update
            }
        }
        setShowModal(false);
    };

    const handleCloseWithoutSave = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowModal(false);
    };

    // Modal canvas setup (same as regular canvas)
    useEffect(() => {
        if (!showModal || !isMobile) return;

        const canvas = modalCanvasRef.current;
        const container = modalContainerRef.current;
        if (!canvas || !container) return;

        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 4; // Thicker for mobile
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0ea5e9';

        const imgSrc = enableSheets ? currentSheetValue : value;
        if (imgSrc && (imgSrc.startsWith('data:image') || imgSrc.includes('/interactions/') || imgSrc.startsWith('http'))) {
            setModalImageLoaded(false);
            const img = new Image();
            if (!imgSrc.startsWith('data:')) {
                img.crossOrigin = 'anonymous';
            }
            img.onload = () => {
                ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                setModalImageLoaded(true);
            };
            img.onerror = () => setModalImageLoaded(true);
            img.src = imgSrc;
        } else {
            setModalImageLoaded(true);
        }

        const updateCanvasSize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.style.width = `${rect.width}px`;
                canvas.style.height = `${rect.height}px`;
            }
        };

        updateCanvasSize();
        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        resizeObserver.observe(container);

        const opts = { passive: false };
        const onTouchStart = (e) => { startDrawModal(e); };
        const onTouchMove = (e) => { drawModal(e); };
        const onTouchEnd = (e) => { endDrawModal(); };

        canvas.addEventListener('touchstart', onTouchStart, opts);
        canvas.addEventListener('touchmove', onTouchMove, opts);
        canvas.addEventListener('touchend', onTouchEnd, opts);
        canvas.addEventListener('touchcancel', onTouchEnd, opts);

        return () => {
            resizeObserver.disconnect();
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('touchcancel', onTouchEnd);
        };
    }, [showModal, enableSheets ? currentSheetValue : value, enableSheets, isMobile]);

    const getModalPos = (e) => {
        const canvas = modalCanvasRef.current;
        const container = modalContainerRef.current;
        if (!canvas || !container) return { x: 0, y: 0 };

        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        return {
            x: x * scaleX,
            y: y * scaleY
        };
    };

    const startDrawModal = (e) => {
        if (isCurrentSheetReadOnly) return;
        e.preventDefault();
        e.stopPropagation();
        isDrawing.current = true;
        lastPos.current = getModalPos(e);
    };

    const drawModal = (e) => {
        if (isCurrentSheetReadOnly || !isDrawing.current) return;
        e.preventDefault();
        e.stopPropagation();

        const canvas = modalCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const pos = getModalPos(e);

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        lastPos.current = pos;
    };

    const endDrawModal = () => {
        if (isDrawing.current) {
            const canvas = modalCanvasRef.current;
            if (canvas) {
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    if (enableSheets) updateCurrentSheet(dataUrl);
                    else onChange(dataUrl);
                } catch (_) {
                    // Tainted canvas - skip update
                }
            }
        }
        isDrawing.current = false;
    };

    const saveCurrentCanvasAndSwitchSheet = (nextIndex) => {
        if (isCurrentSheetReadOnly) {
            setCurrentSheetIndex(nextIndex);
            return;
        }
        const canvas = showModal && isMobile ? modalCanvasRef.current : canvasRef.current;
        if (canvas && enableSheets) {
            try {
                const dataUrl = canvas.toDataURL('image/png');
                const next = [...sheets];
                next[currentSheetIndex] = dataUrl;
                notifyChange(next);
            } catch (_) {
                // Tainted canvas - keep existing sheet value (already in sheets)
            }
        }
        setCurrentSheetIndex(nextIndex);
    };

    const handleAddSheet = () => {
        if (!canAddSheet) return;
        const canvas = showModal && isMobile ? modalCanvasRef.current : canvasRef.current;
        let dataForCurrent = currentSheetValue || '';
        if (canvas) {
            try {
                dataForCurrent = canvas.toDataURL('image/png');
            } catch (_) {
                // Tainted canvas (e.g. cross-origin image) - keep existing sheet value
            }
        }
        const next = [...sheets];
        next[currentSheetIndex] = dataForCurrent;
        next.push('');
        notifyChange(next);
        setCurrentSheetIndex(next.length - 1);
    };

    const handlePrevSheet = () => {
        if (currentSheetIndex <= 0) return;
        saveCurrentCanvasAndSwitchSheet(currentSheetIndex - 1);
    };

    const handleNextSheet = () => {
        if (currentSheetIndex >= sheets.length - 1) return;
        saveCurrentCanvasAndSwitchSheet(currentSheetIndex + 1);
    };

    const displayValue = enableSheets ? currentSheetValue : value;

    return (
        <>
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 sm:p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-xs sm:text-sm font-semibold text-slate-700">{label}</div>
                    {enableSheets && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevSheet}
                                    disabled={currentSheetIndex <= 0}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Previous sheet"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-slate-600 font-medium min-w-[4rem] text-center text-xs sm:text-sm">
                                    Sheet {currentSheetIndex + 1} of {sheets.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleNextSheet}
                                    disabled={currentSheetIndex >= sheets.length - 1}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Next sheet"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={handleAddSheet}
                                    disabled={!canAddSheet}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50 text-xs sm:text-sm"
                                >
                                    + Add sheet
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div
                    ref={containerRef}
                    className={`relative w-full border border-slate-200 rounded-lg bg-white overflow-hidden ${isMobile ? 'cursor-pointer' : ''}`}
                    style={{ resize: isMobile ? 'none' : 'vertical', minHeight, height: enableSheets ? minHeight : undefined, touchAction: 'none' }}
                    onClick={isMobile ? handleOpenModal : undefined}
                >
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[8]" aria-hidden="true">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600" />
                        </div>
                    )}
                    {isCurrentSheetAddedLater && (
                        <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shadow-sm">Added later</span>
                    )}
                    {isMobile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10 pointer-events-none">
                            <div className="text-xs text-slate-500 text-center px-4">
                                {readOnly ? 'Tap to view fullscreen' : 'Tap to open fullscreen drawing pad'}
                            </div>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className={`absolute inset-0 w-full h-full touch-manipulation ${isCurrentSheetReadOnly ? 'cursor-default' : 'cursor-crosshair'}`}
                        style={{ imageRendering: 'auto', pointerEvents: isCurrentSheetReadOnly ? 'none' : (isMobile ? 'none' : 'auto') }}
                        onMouseDown={!isCurrentSheetReadOnly && !isMobile ? startDraw : undefined}
                        onMouseMove={!isCurrentSheetReadOnly && !isMobile ? draw : undefined}
                        onMouseUp={!isCurrentSheetReadOnly && !isMobile ? endDraw : undefined}
                        onMouseLeave={!isCurrentSheetReadOnly && !isMobile ? endDraw : undefined}
                    />
                </div>
                {!isCurrentSheetReadOnly && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    {displayValue && (
                        <span className="text-green-600">Saved</span>
                    )}
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear
                    </button>
                </div>
                )}
            </div>

            {/* Mobile Fullscreen Modal */}
            {showModal && isMobile && (
                <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                        {enableSheets && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handlePrevSheet}
                                        disabled={currentSheetIndex <= 0}
                                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Previous sheet"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <span className="text-slate-600 font-medium min-w-[4rem] text-center">Sheet {currentSheetIndex + 1} of {sheets.length}</span>
                                    <button
                                        type="button"
                                        onClick={handleNextSheet}
                                        disabled={currentSheetIndex >= sheets.length - 1}
                                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Next sheet"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={handleAddSheet}
                                        disabled={!canAddSheet}
                                        className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        + Add sheet
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div
                        ref={modalContainerRef}
                        className="flex-1 w-full bg-white overflow-hidden touch-none relative"
                        style={{ touchAction: 'none' }}
                    >
                        {!modalImageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-[8]" aria-hidden="true">
                                <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600" />
                            </div>
                        )}
                        {isCurrentSheetAddedLater && (
                            <span className="absolute top-2 right-2 z-10 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shadow-sm">Added later</span>
                        )}
                        <canvas
                            ref={modalCanvasRef}
                            className={`relative inset-0 w-full h-full touch-manipulation ${isCurrentSheetReadOnly ? 'cursor-default' : ''}`}
                            style={{ imageRendering: 'auto', pointerEvents: isCurrentSheetReadOnly ? 'none' : 'auto' }}
                            onMouseDown={startDrawModal}
                            onMouseMove={drawModal}
                            onMouseUp={endDrawModal}
                            onMouseLeave={endDrawModal}
                        />
                    </div>
                    <div className="relative z-10 p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                        {readOnly ? (
                            <button
                                type="button"
                                onClick={handleCloseWithoutSave}
                                className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-300 transition-colors"
                            >
                                Close
                            </button>
                        ) : (
                            <>
                                {!isCurrentSheetReadOnly && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 active:bg-red-200 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseWithoutSave}
                                        className="w-12 h-12 rounded-full bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-600 flex items-center justify-center transition-colors shrink-0 touch-manipulation select-none"
                                        title="Close without saving"
                                        aria-label="Close without saving"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
                                    >
                                        Save & Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default DrawingPad;
