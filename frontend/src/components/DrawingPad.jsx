import { useRef, useState, useEffect } from 'react';

// Whiteboard-style drawing pad that expands with container
const DrawingPad = ({ label, value, onChange, minHeight = '200px' }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const modalCanvasRef = useRef(null);
    const modalContainerRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const [showModal, setShowModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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

        // If there's a saved image, load it
        if (value && value.startsWith('data:image')) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            };
            img.src = value;
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

        return () => {
            resizeObserver.disconnect();
        };
    }, [value]);

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
        e.preventDefault();
        isDrawing.current = true;
        lastPos.current = getPos(e);
    };

    const draw = (e) => {
        if (!isDrawing.current) return;
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
            // Auto-save when drawing ends
            const canvas = canvasRef.current;
            if (canvas) {
                const dataUrl = canvas.toDataURL('image/png');
                onChange(dataUrl);
            }
        }
        isDrawing.current = false;
    };

    const handleClear = () => {
        const canvas = showModal && isMobile ? modalCanvasRef.current : canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        onChange('');
    };

    const handleOpenModal = () => {
        if (isMobile) {
            setShowModal(true);
            // Copy existing drawing to modal canvas
            setTimeout(() => {
                const sourceCanvas = canvasRef.current;
                const targetCanvas = modalCanvasRef.current;
                if (sourceCanvas && targetCanvas) {
                    const ctx = targetCanvas.getContext('2d');
                    if (value && value.startsWith('data:image')) {
                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                        };
                        img.src = value;
                    }
                }
            }, 100);
        }
    };

    const handleCloseModal = () => {
        if (showModal && modalCanvasRef.current) {
            // Save drawing from modal
            const dataUrl = modalCanvasRef.current.toDataURL('image/png');
            onChange(dataUrl);
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

        if (value && value.startsWith('data:image')) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            };
            img.src = value;
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

        return () => {
            resizeObserver.disconnect();
        };
    }, [showModal, value, isMobile]);

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
        e.preventDefault();
        e.stopPropagation();
        isDrawing.current = true;
        lastPos.current = getModalPos(e);
    };

    const drawModal = (e) => {
        if (!isDrawing.current) return;
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
                const dataUrl = canvas.toDataURL('image/png');
                onChange(dataUrl);
            }
        }
        isDrawing.current = false;
    };

    return (
        <>
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 sm:p-3 space-y-2">
                <div className="text-xs sm:text-sm font-semibold text-slate-700">{label}</div>
                <div
                    ref={containerRef}
                    className={`relative w-full border border-slate-200 rounded-lg bg-white overflow-hidden ${isMobile ? 'cursor-pointer' : ''}`}
                    style={{ resize: isMobile ? 'none' : 'vertical', minHeight, touchAction: 'none' }}
                    onClick={isMobile ? handleOpenModal : undefined}
                >
                    {isMobile && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10 pointer-events-none">
                            <div className="text-xs text-slate-500 text-center px-4">
                                Tap to open fullscreen drawing pad
                            </div>
                        </div>
                    )}
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full touch-manipulation cursor-crosshair"
                        style={{ imageRendering: 'auto', pointerEvents: isMobile ? 'none' : 'auto' }}
                        onMouseDown={!isMobile ? startDraw : undefined}
                        onMouseMove={!isMobile ? draw : undefined}
                        onMouseUp={!isMobile ? endDraw : undefined}
                        onMouseLeave={!isMobile ? endDraw : undefined}
                        onTouchStart={!isMobile ? startDraw : undefined}
                        onTouchMove={!isMobile ? draw : undefined}
                        onTouchEnd={!isMobile ? endDraw : undefined}
                    />
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500">
                    {value && (
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
            </div>

            {/* Mobile Fullscreen Modal */}
            {showModal && isMobile && (
                <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                        <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                    </div>
                    <div
                        ref={modalContainerRef}
                        className="flex-1 w-full bg-white overflow-hidden touch-none"
                        style={{ touchAction: 'none' }}
                    >
                        <canvas
                            ref={modalCanvasRef}
                            className="relative inset-0 w-full h-full touch-manipulation"
                            style={{ imageRendering: 'auto' }}
                            onTouchStart={startDrawModal}
                            onTouchMove={drawModal}
                            onTouchEnd={endDrawModal}
                            onMouseDown={startDrawModal}
                            onMouseMove={drawModal}
                            onMouseUp={endDrawModal}
                            onMouseLeave={endDrawModal}
                        />
                    </div>
                    <div className="relative z-10 p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 active:bg-red-200 transition-colors"
                        >
                            Clear
                        </button>
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
                    </div>
                </div>
            )}
        </>
    );
};

export default DrawingPad;
