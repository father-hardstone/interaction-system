import { useMemo, useRef, useState, useEffect } from 'react';
import api from '../services/api';
import { reportService } from '../services/reportService';

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
                    style={{ resize: isMobile ? 'none' : 'vertical', minHeight }}
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
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                        <button
                            onClick={handleCloseModal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                        >
                            Save & Close
                        </button>
                    </div>
                    <div
                        ref={modalContainerRef}
                        className="flex-1 w-full bg-white overflow-hidden"
                        style={{ touchAction: 'none' }}
                    >
                        <canvas
                            ref={modalCanvasRef}
                            className="absolute inset-0 w-full h-full touch-manipulation"
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
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleCloseModal}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const OfficerTab = ({ userData, interactions, visitors }) => {
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
    const [expandedPrevious, setExpandedPrevious] = useState(false);
    const [expandedInteractionIds, setExpandedInteractionIds] = useState({});
    const [activeInteractionId, setActiveInteractionId] = useState(() => {
        return sessionStorage.getItem('activeInteractionId') || null;
    });
    const [activeViewTab, setActiveViewTab] = useState(() => {
        return sessionStorage.getItem('activeViewTab') || 'scheduled';
    });

    // Save persistence state to sessionStorage
    useEffect(() => {
        if (activeInteractionId) {
            sessionStorage.setItem('activeInteractionId', activeInteractionId);
        } else {
            sessionStorage.removeItem('activeInteractionId');
        }
    }, [activeInteractionId]);

    useEffect(() => {
        sessionStorage.setItem('activeViewTab', activeViewTab);
    }, [activeViewTab]);

    // Interaction recovery logic is now handled below after diagnostics/services state is initialized.

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [patientReports, setPatientReports] = useState([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [viewingMedia, setViewingMedia] = useState(null); // { type: 'image' | 'pdf', url: string, title?: string }

    const handleCancelInteraction = () => {
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        if (!activeInteractionId) return;
        try {
            await api.put(`/interactions/${activeInteractionId}/details`, {
                started: false,
                ongoing: false,
                incomplete: false,
                completed: false
            });
            setShowCancelModal(false);
            resetInteractionFields();
            setActiveInteractionId(null);
            setActiveViewTab('scheduled');
        } catch (error) {
            console.error('Error canceling interaction:', error);
            alert('Failed to cancel interaction');
        }
    };

    const moveToIncomplete = async () => {
        if (!activeInteractionId) return;
        try {
            await api.put(`/interactions/${activeInteractionId}/details`, {
                started: true,
                ongoing: false,
                incomplete: true,
                completed: false
            });
            setShowCancelModal(false);
            resetInteractionFields();
            setActiveInteractionId(null);
            setActiveViewTab('scheduled');
        } catch (error) {
            console.error('Error moving interaction to incomplete:', error);
            alert('Failed to move interaction to incomplete');
        }
    };

    const resetInteractionFields = () => {
        setCcReason('');
        setSubjective('');
        setObjective('');
        setAssessmentPlan('');
        setCcReasonPad('');
        setSubjectivePad('');
        setObjectivePad('');
        setAssessmentPlanPad('');
        setCcReasonMode('pad');
        setSubjectiveMode('pad');
        setObjectiveMode('pad');
        setAssessmentPlanMode('pad');
        setServiceLines([
            {
                id: Date.now(),
                serialNumber: 1,
                diagnostic: '',
                diagnosticDescription: '',
                billingCode: '',
                billingDescription: '',
                suffix: '',
                totalFee: '',
                accountingNumber: ''
            }
        ]);
    };

    // Interaction note fields (UI only for now)
    const [ccReason, setCcReason] = useState('');
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessmentPlan, setAssessmentPlan] = useState('');

    // Mode toggles: text or pad (default to pad/handwriting)
    const [ccReasonMode, setCcReasonMode] = useState('pad');
    const [subjectiveMode, setSubjectiveMode] = useState('pad');
    const [objectiveMode, setObjectiveMode] = useState('pad');
    const [assessmentPlanMode, setAssessmentPlanMode] = useState('pad');

    // Saved sketches (data URLs) for pad mode
    const [ccReasonPad, setCcReasonPad] = useState('');
    const [subjectivePad, setSubjectivePad] = useState('');
    const [objectivePad, setObjectivePad] = useState('');
    const [assessmentPlanPad, setAssessmentPlanPad] = useState('');

    // Service lines (for billing/services) - start with one line
    const [serviceLines, setServiceLines] = useState([
        {
            id: Date.now(),
            serialNumber: 1,
            diagnostic: '',
            diagnosticDescription: '',
            billingCode: '',
            billingDescription: '',
            suffix: '',
            totalFee: '',
            accountingNumber: ''
        }
    ]);

    // Services and diagnostics from backend
    const [services, setServices] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);

    // Recover active interaction state once master data is loaded
    const [hasRecovered, setHasRecovered] = useState(false);
    useEffect(() => {
        if (!hasRecovered && activeInteractionId && interactions.length > 0 && services.length > 0 && diagnostics.length > 0) {
            const activeInt = interactions.find(i => i.id === activeInteractionId);
            if (activeInt && !activeInt.completed) {
                loadInteractionToState(activeInt);
                setHasRecovered(true);
            } else if (activeInt && activeInt.completed) {
                setActiveInteractionId(null);
                setActiveViewTab('scheduled');
            }
        }
    }, [interactions, activeInteractionId, services, diagnostics, hasRecovered]);
    const [isSaving, setIsSaving] = useState(false);

    const doctorId = userData?.id;

    // Fetch services and diagnostics on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, diagnosticsRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/diagnostics')
                ]);
                setServices(servicesRes.data || []);
                setDiagnostics(diagnosticsRes.data || []);
            } catch (error) {
                console.error('Error fetching services/diagnostics:', error);
            }
        };
        fetchData();
    }, []);

    // Get visitorId of the active interaction
    const activePatientVisitorId = useMemo(() => {
        if (!activeInteractionId) return null;
        const interaction = interactions.find(i => i.id === activeInteractionId);
        return interaction?.visitorId;
    }, [activeInteractionId, interactions]);

    // Fetch reports for the active patient
    useEffect(() => {
        const fetchReports = async () => {
            if (!activePatientVisitorId) {
                setPatientReports([]);
                return;
            }
            setIsLoadingReports(true);
            try {
                const data = await reportService.getByPatient(activePatientVisitorId);
                setPatientReports(data || []);
            } catch (error) {
                console.error('Error fetching patient reports:', error);
            } finally {
                setIsLoadingReports(false);
            }
        };
        fetchReports();
    }, [activePatientVisitorId]);

    const doctorInteractions = useMemo(
        () => interactions.filter((i) => i.officerId === doctorId),
        [interactions, doctorId]
    );

    // Scheduled interactions: assigned to doctor, not completed, not ongoing, and not incomplete
    const scheduledInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => !i.completed && !i.ongoing && !i.incomplete
        );
    }, [doctorInteractions]);

    // Incomplete interactions
    const incompleteInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.incomplete && !i.completed
        );
    }, [doctorInteractions]);

    // Completed interactions: assigned to doctor and completed
    const completedInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.completed
        ).sort((a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime());
    }, [doctorInteractions]);

    const ongoingInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.ongoing || (i.id === activeInteractionId && !i.completed)
        );
    }, [doctorInteractions, activeInteractionId]);

    const pastInteractionsForActivePatient = useMemo(() => {
        if (!activePatientVisitorId) return [];
        return interactions
            .filter(
                (i) =>
                    i.visitorId === activePatientVisitorId &&
                    (i.completed || i.closed)
            )
            .sort(
                (a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime()
            );
    }, [interactions, activePatientVisitorId]);

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
            return imagePath;
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${API_URL.replace('/api', '')}/${imagePath}`;
    };

    const getVisitor = (visitorId) => visitors.find((v) => v.id === visitorId);

    const getVisitorName = (visitorId) => {
        const v = getVisitor(visitorId);
        if (!v) return 'Unknown patient';
        return `${v.firstName || ''}${v.firstName ? ' ' : ''}${v.middleName ? v.middleName + ' ' : ''
            }${v.lastName || ''}`.trim() || 'Unknown patient';
    };

    const getVisitorSerial = (visitorId) => {
        const v = getVisitor(visitorId);
        if (!v) return 'N/A';
        if (v.serial && v.serial.includes('-')) return v.serial;
        return v.entitySerial ? `${v.entitySerial}-${v.serial}` : v.serial || 'N/A';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const loadInteractionToState = (interaction) => {
        if (!interaction) return;

        setCcReason(interaction.ccReason?.text || '');
        setCcReasonPad(interaction.ccReason?.scratchpad || '');
        setCcReasonMode(interaction.ccReason?.hasScratchpad ? 'pad' : 'text');

        setSubjective(interaction.subjective?.text || '');
        setSubjectivePad(interaction.subjective?.scratchpad || '');
        setSubjectiveMode(interaction.subjective?.hasScratchpad ? 'pad' : 'text');

        setObjective(interaction.objective?.text || '');
        setObjectivePad(interaction.objective?.scratchpad || '');
        setObjectiveMode(interaction.objective?.hasScratchpad ? 'pad' : 'text');

        setAssessmentPlan(interaction.assessmentPlan?.text || '');
        setAssessmentPlanPad(interaction.assessmentPlan?.scratchpad || '');
        setAssessmentPlanMode(interaction.assessmentPlan?.hasScratchpad ? 'pad' : 'text');

        if (interaction.serviceLines && interaction.serviceLines.length > 0) {
            setServiceLines(interaction.serviceLines.map(line => ({
                id: Math.random(), // New temp ID for UI
                serialNumber: line.serialNumber || 1,
                diagnostic: line.diagnostic || '',
                // Description handling would need finding the diagnostic in the list
                diagnosticDescription: diagnostics.find(d => d.code === line.diagnostic)?.description || '',
                billingCode: line.service || '',
                billingDescription: services.find(s => s.code === line.service)?.description || '',
                suffix: line.suffix || '',
                totalFee: line.totalFee !== undefined ? line.totalFee.toString() : '',
                accountingNumber: line.accountingNumber || ''
            })));
        } else {
            resetInteractionFields();
        }
    };

    const handleStartInteraction = async (interactionId) => {
        // Check if there is already an ongoing interaction (excluding the one we might be resuming)
        const currentOngoing = ongoingInteractions.find(i => i.id !== interactionId);
        if (currentOngoing && activeViewTab !== 'ongoing') {
            alert('You already have an interaction in progress. Please complete or pause it before starting a new one.');
            setActiveViewTab('ongoing');
            return;
        }

        const interaction = interactions.find(i => i.id === interactionId);
        if (interaction) {
            loadInteractionToState(interaction);
        } else {
            resetInteractionFields();
        }

        setActiveInteractionId(interactionId);

        // Mark interaction as started and ongoing in backend
        try {
            await api.put(`/interactions/${interactionId}/details`, {
                started: true,
                ongoing: true,
                incomplete: false,
                completed: false // Explicitly set to false 
            });
            setActiveViewTab('ongoing');
        } catch (error) {
            console.error('Error marking interaction as started:', error);
            // Don't block UI if this fails
            setActiveViewTab('ongoing');
        }
    };

    const handleAddServiceLine = () => {
        if (serviceLines.length >= 4) {
            alert('Maximum 4 service lines allowed');
            return;
        }
        const newLine = {
            id: Date.now(), // Temporary ID
            serialNumber: serviceLines.length + 1,
            service: '',
            suffix: '',
            diagnostic: '',
            totalFee: '', // Will be set by internal logic
            accountingNumber: '' // Will be set by internal logic
        };
        setServiceLines([...serviceLines, newLine]);
    };

    const handleUpdateServiceLine = (id, field, value) => {
        const updatedLines = serviceLines.map(line => {
            if (line.id !== id) return line;

            let updatedLine = { ...line, [field]: value };

            // If diagnostic code is being updated
            if (field === 'diagnostic') {
                const foundDiag = diagnostics.find(d => d.code === value);
                if (foundDiag) {
                    updatedLine.diagnosticDescription = foundDiag.description;
                } else {
                    updatedLine.diagnosticDescription = '';
                }
            }

            // If billing code (renamed from service) is being updated
            if (field === 'billingCode') {
                // Find service in services array and calculate total fee (case-insensitive)
                const service = services.find(s => s.code.toUpperCase() === value.trim().toUpperCase());
                if (service) {
                    updatedLine.billingDescription = service.description;

                    // Extract suffix (first letter before numbers, e.g., "A" from "A001")
                    const match = value.trim().match(/^([A-Za-z]+)/);
                    if (match) {
                        updatedLine.suffix = match[1].toUpperCase();
                    }

                    // Sum all fees: hcpFee + tFee + pFee + sFee
                    const totalFee = (service.hcpFee || 0) +
                        (service.tFee || 0) +
                        (service.pFee || 0) +
                        (service.sFee || 0);
                    updatedLine.totalFee = totalFee.toFixed(2);
                } else {
                    updatedLine.billingDescription = '';
                    updatedLine.totalFee = '';
                    updatedLine.suffix = '';
                }
            }

            return updatedLine;
        });

        setServiceLines(updatedLines);
    };

    const handleRemoveServiceLine = (id) => {
        const updatedLines = serviceLines.filter(line => line.id !== id);
        // Recalculate serial numbers
        setServiceLines(updatedLines.map((line, index) => ({
            ...line,
            serialNumber: index + 1
        })));
    };

    // Auto-save pad data when toggling modes
    const handleModeToggle = (fieldName, newMode) => {
        if (fieldName === 'ccReason') {
            // If switching from pad to text, the pad data is already saved in state
            // If switching from text to pad, text is already in state
            setCcReasonMode(newMode);
        } else if (fieldName === 'subjective') {
            setSubjectiveMode(newMode);
        } else if (fieldName === 'objective') {
            setObjectiveMode(newMode);
        } else if (fieldName === 'assessmentPlan') {
            setAssessmentPlanMode(newMode);
        }
    };

    const handleSaveInteraction = async () => {
        if (!activeInteractionId) return;

        // Validate required fields (except A and P)
        if (!ccReason.trim() && !ccReasonPad) {
            alert('CC / reason is required');
            return;
        }
        if (!subjective.trim() && !subjectivePad) {
            alert('S (Subjective) is required');
            return;
        }
        if (!objective.trim() && !objectivePad) {
            alert('O (Objective) is required');
            return;
        }

        setIsSaving(true);
        try {
            // Get the active interaction to extract entitySerial, visitorSerial, and interactionSerial
            const activeInteraction = interactions.find(i => i.id === activeInteractionId);
            if (!activeInteraction) {
                alert('Interaction not found');
                setIsSaving(false);
                return;
            }

            const { entitySerial, visitorSerial, interactionSerial } = activeInteraction;

            // Save images first (if they exist)
            const imagePaths = {};
            const imageFields = [
                { name: 'CC', data: ccReasonPad },
                { name: 'S', data: subjectivePad },
                { name: 'O', data: objectivePad },
                { name: 'AP', data: assessmentPlanPad }
            ];

            for (const field of imageFields) {
                if (field.data && field.data.startsWith('data:image')) {
                    try {
                        const imageResponse = await api.post('/images/interaction', {
                            entitySerial: entitySerial,
                            visitorSerial: visitorSerial,
                            interactionSerial: interactionSerial,
                            fieldName: field.name,
                            imageData: field.data
                        });
                        imagePaths[field.name] = imageResponse.data.path;
                    } catch (error) {
                        console.error(`Error saving ${field.name} image:`, error);
                        // Continue even if image save fails
                    }
                }
            }

            // Build payload with both text and pad data, plus flags, and service lines
            const payload = {
                ccReason: {
                    text: ccReason.trim(),
                    scratchpad: imagePaths['CC'] || ccReasonPad || '',
                    hasScratchpad: !!(imagePaths['CC'] || ccReasonPad),
                },
                subjective: {
                    text: subjective.trim(),
                    scratchpad: imagePaths['S'] || subjectivePad || '',
                    hasScratchpad: !!(imagePaths['S'] || subjectivePad),
                },
                objective: {
                    text: objective.trim(),
                    scratchpad: imagePaths['O'] || objectivePad || '',
                    hasScratchpad: !!(imagePaths['O'] || objectivePad),
                },
                assessmentPlan: {
                    text: assessmentPlan.trim(),
                    scratchpad: imagePaths['AP'] || assessmentPlanPad || '',
                    hasScratchpad: !!(imagePaths['AP'] || assessmentPlanPad),
                },
                serviceLines: serviceLines.map(line => ({
                    serialNumber: line.serialNumber,
                    service: line.billingCode,
                    suffix: line.suffix,
                    diagnostic: line.diagnostic,
                    totalFee: parseFloat(line.totalFee) || 0,
                    accountingNumber: line.accountingNumber || ''
                })),
                ongoing: false,
                incomplete: false,
                completed: true
            };

            console.log('Saving interaction:', payload);
            const response = await api.put(`/interactions/${activeInteractionId}/details`, payload);
            console.log('Interaction saved successfully:', response.data);
            alert('Interaction saved successfully!');

            // Optionally refresh interactions or update local state
            // You might want to reload interactions here to reflect the completed status
        } catch (error) {
            console.error('Error saving interaction:', error);
            alert(`Error saving interaction: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsSaving(false);
            // Reset to default state
            setActiveInteractionId(null);
            resetInteractionFields();
            setActiveViewTab('scheduled');
        }
    };

    const handleOpenPatientDetails = (visitorId) => {
        const v = getVisitor(visitorId);
        if (!v) return;
        setSelectedPatient(v);
        setExpandedPrevious(false);
        setExpandedInteractionIds({});
        setShowPatientDetailModal(true);
    };

    const previousInteractionsForSelected = useMemo(() => {
        if (!selectedPatient) return [];
        return interactions
            .filter(
                (i) =>
                    i.visitorId === selectedPatient.id &&
                    i.officerId === doctorId &&
                    i.id !== activeInteractionId
            )
            .sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
    }, [interactions, selectedPatient, doctorId, activeInteractionId]);

    // Completed interactions for selected patient
    const completedInteractionsForPatient = useMemo(() => {
        if (!selectedPatient) return [];
        return interactions
            .filter(
                (i) =>
                    i.visitorId === selectedPatient.id &&
                    i.completed
            )
            .sort(
                (a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime()
            );
    }, [interactions, selectedPatient]);


    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveViewTab('scheduled')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeViewTab === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Scheduled
                </button>
                <button
                    onClick={() => setActiveViewTab('ongoing')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeViewTab === 'ongoing' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Ongoing
                </button>
                <button
                    onClick={() => setActiveViewTab('incomplete')}
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeViewTab === 'incomplete' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                    Incomplete
                </button>
            </div>

            {/* Scheduled Tab */}
            {activeViewTab === 'scheduled' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Scheduled interactions
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Patients assigned to you and waiting to be seen
                            </p>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm min-w-[600px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Registration
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Created at
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {scheduledInteractions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-xs text-slate-400"
                                        >
                                            No scheduled interactions
                                        </td>
                                    </tr>
                                )}
                                {scheduledInteractions.map((interaction) => (
                                    <tr key={interaction.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 align-top">
                                            <div className="text-xs font-semibold text-blue-700">
                                                {interaction.interactionSerial || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-top">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenPatientDetails(interaction.visitorId)
                                                }
                                                className="text-sm font-medium text-slate-900 hover:text-blue-700 transition-colors"
                                            >
                                                {getVisitorName(interaction.visitorId)}
                                            </button>
                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                {getVisitorSerial(interaction.visitorId)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 align-top text-xs text-slate-500">
                                            {formatDate(interaction.createdAt)}
                                        </td>
                                        <td className="px-4 py-2 align-top text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleStartInteraction(interaction.id)
                                                }
                                                disabled={ongoingInteractions.length > 0}
                                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 ${ongoingInteractions.length > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                            >
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                                <span>{ongoingInteractions.length > 0 ? 'Finish current first' : 'Start interaction'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Incomplete Tab */}
            {activeViewTab === 'incomplete' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Incomplete interactions
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Interactions you started but haven&apos;t finished yet
                            </p>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm min-w-[600px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Registration
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Last Edited
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {incompleteInteractions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-12 text-center text-xs text-slate-400"
                                        >
                                            No incomplete interactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    incompleteInteractions.map((interaction) => (
                                        <tr key={interaction.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 align-top">
                                                <div className="text-xs font-semibold text-blue-700">
                                                    {interaction.interactionSerial || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-top">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleOpenPatientDetails(interaction.visitorId)
                                                    }
                                                    className="text-sm font-medium text-slate-900 hover:text-blue-700 transition-colors"
                                                >
                                                    {getVisitorName(interaction.visitorId)}
                                                </button>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {getVisitorSerial(interaction.visitorId)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 align-top text-xs text-slate-500">
                                                {formatDate(interaction.editedAt || interaction.createdAt)}
                                            </td>
                                            <td className="px-4 py-2 align-top text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStartInteraction(interaction.id)
                                                    }
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 transition-all active:scale-95"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Resume</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Ongoing Tab */}
            {activeViewTab === 'ongoing' && (
                <div className="flex flex-col xl:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-6 w-full lg:min-w-0">
                        {/* Ongoing Interaction Details (Header) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Ongoing interaction
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Documenting current visit
                                    </p>
                                </div>
                            </div>

                            <div className="border border-slate-100 rounded-lg overflow-x-auto">
                                {ongoingInteractions.length > 0 ? (
                                    <table className="min-w-full divide-y divide-slate-100 text-sm min-w-[600px]">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Registration
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Patient
                                                </th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {ongoingInteractions.map((interaction) => (
                                                <tr key={interaction.id} className={interaction.id === activeInteractionId ? "bg-blue-50/50" : ""}>
                                                    <td className="px-4 py-2 align-top">
                                                        <div className="text-xs font-semibold text-blue-700">
                                                            {interaction.interactionSerial || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 align-top">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleOpenPatientDetails(
                                                                    interaction.visitorId
                                                                )
                                                            }
                                                            className="text-sm font-medium text-slate-900 hover:text-blue-700 transition-colors"
                                                        >
                                                            {getVisitorName(interaction.visitorId)}
                                                        </button>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            {getVisitorSerial(interaction.visitorId)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 align-top">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                            <span className="text-xs font-medium text-green-700">Active now</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            Started {new Date(interaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 align-top text-right">
                                                        <button
                                                            onClick={() => handleStartInteraction(interaction.id)}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${interaction.id === activeInteractionId ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
                                                            disabled={interaction.id === activeInteractionId}
                                                        >
                                                            {interaction.id === activeInteractionId ? 'Currently Viewing' : 'Resume'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="px-4 py-12 text-center text-xs text-slate-400 italic">
                                        No interactions currently in progress.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Interaction Section (SOAP Notes) */}
                        {activeInteractionId && ongoingInteractions.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">Interaction Details</h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Structured notes for the currently selected interaction
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700 border border-green-100">
                                        Active
                                    </span>
                                </div>

                                <div className="space-y-4 sm:space-y-6 mt-2">
                                    {/* CC / Reason */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <label className="block text-sm sm:text-xs font-semibold text-slate-700">
                                                CC / reason <span className="text-red-500">*</span>
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={ccReasonMode === 'pad'}
                                                    onChange={(e) =>
                                                        handleModeToggle('ccReason', e.target.checked ? 'pad' : 'text')
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-12 h-7 sm:w-11 sm:h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <span className="ml-2 text-sm sm:text-[11px] text-slate-600">
                                                    {ccReasonMode === 'text' ? 'Text' : 'Handwriting'}
                                                </span>
                                            </label>
                                        </div>
                                        {ccReasonMode === 'text' ? (
                                            <textarea
                                                required
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[100px] sm:min-h-[60px]"
                                                value={ccReason}
                                                onChange={(e) => setCcReason(e.target.value)}
                                                placeholder="Chief complaint or reason for visit..."
                                            />
                                        ) : (
                                            <DrawingPad
                                                label="Handwriting pad"
                                                value={ccReasonPad}
                                                onChange={setCcReasonPad}
                                                minHeight="100px"
                                            />
                                        )}
                                    </div>

                                    {/* S */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <label className="block text-sm sm:text-xs font-semibold text-slate-700">
                                                S <span className="text-red-500">*</span>
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={subjectiveMode === 'pad'}
                                                    onChange={(e) =>
                                                        handleModeToggle('subjective', e.target.checked ? 'pad' : 'text')
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <span className="ml-2 text-[11px] text-slate-600">
                                                    {subjectiveMode === 'text' ? 'Text' : 'Handwriting'}
                                                </span>
                                            </label>
                                        </div>
                                        {subjectiveMode === 'text' ? (
                                            <textarea
                                                required
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px] sm:min-h-[80px]"
                                                value={subjective}
                                                onChange={(e) => setSubjective(e.target.value)}
                                                placeholder="Subjective information..."
                                            />
                                        ) : (
                                            <DrawingPad
                                                label="Handwriting pad"
                                                value={subjectivePad}
                                                onChange={setSubjectivePad}
                                                minHeight="120px"
                                            />
                                        )}
                                    </div>

                                    {/* O */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <label className="block text-sm sm:text-xs font-semibold text-slate-700">
                                                O <span className="text-red-500">*</span>
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={objectiveMode === 'pad'}
                                                    onChange={(e) =>
                                                        handleModeToggle('objective', e.target.checked ? 'pad' : 'text')
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <span className="ml-2 text-[11px] text-slate-600">
                                                    {objectiveMode === 'text' ? 'Text' : 'Handwriting'}
                                                </span>
                                            </label>
                                        </div>
                                        {objectiveMode === 'text' ? (
                                            <textarea
                                                required
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px] sm:min-h-[80px]"
                                                value={objective}
                                                onChange={(e) => setObjective(e.target.value)}
                                                placeholder="Objective findings..."
                                            />
                                        ) : (
                                            <DrawingPad
                                                label="Handwriting pad"
                                                value={objectivePad}
                                                onChange={setObjectivePad}
                                                minHeight="120px"
                                            />
                                        )}
                                    </div>

                                    {/* A and P */}
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <label className="block text-sm sm:text-xs font-semibold text-slate-700">
                                                A and P
                                            </label>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={assessmentPlanMode === 'pad'}
                                                    onChange={(e) =>
                                                        handleModeToggle('assessmentPlan', e.target.checked ? 'pad' : 'text')
                                                    }
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                <span className="ml-2 text-[11px] text-slate-600">
                                                    {assessmentPlanMode === 'text' ? 'Text' : 'Handwriting'}
                                                </span>
                                            </label>
                                        </div>
                                        {assessmentPlanMode === 'text' ? (
                                            <textarea
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px] sm:min-h-[80px]"
                                                value={assessmentPlan}
                                                onChange={(e) => setAssessmentPlan(e.target.value)}
                                                placeholder="Assessment and plan..."
                                            />
                                        ) : (
                                            <DrawingPad
                                                label="Handwriting pad"
                                                value={assessmentPlanPad}
                                                onChange={setAssessmentPlanPad}
                                                minHeight="120px"
                                            />
                                        )}
                                    </div>

                                    {/* Billing Information Section */}
                                    <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Information</h3>
                                        </div>

                                        <div className="space-y-1.5">
                                            {serviceLines.map((line) => (
                                                <div key={line.id} className="group flex items-center gap-2 p-1.5 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-blue-200 transition-all">
                                                    <span className="flex-shrink-0 w-4 pb-1 text-[10px] font-black text-slate-400">
                                                        {line.serialNumber}
                                                    </span>
                                                    {/* Diagnostic Code */}
                                                    <div className="w-24 flex-shrink-0">
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Diag Code</div>
                                                        <input
                                                            type="text"
                                                            value={line.diagnostic}
                                                            onChange={(e) => handleUpdateServiceLine(line.id, 'diagnostic', e.target.value)}
                                                            list={`diagnostic-list-${line.id}`}
                                                            className="w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Code"
                                                        />
                                                        <datalist id={`diagnostic-list-${line.id}`}>
                                                            {diagnostics.map((diag, idx) => (
                                                                <option key={idx} value={diag.code}>{diag.description}</option>
                                                            ))}
                                                        </datalist>
                                                    </div>

                                                    {/* Diagnostic Description */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Description</div>
                                                        <div className="px-1 py-0.5 text-[11px] text-slate-500 truncate italic">
                                                            {line.diagnosticDescription || "---"}
                                                        </div>
                                                    </div>

                                                    <div className="w-px h-6 bg-slate-200 mx-1 self-end mb-1"></div>

                                                    {/* Billing Code */}
                                                    <div className="w-24 flex-shrink-0">
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 ml-0.5">Billing Code</div>
                                                        <input
                                                            type="text"
                                                            value={line.billingCode}
                                                            onChange={(e) => handleUpdateServiceLine(line.id, 'billingCode', e.target.value)}
                                                            list={`billing-list-${line.id}`}
                                                            className="w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Code"
                                                        />
                                                        <datalist id={`billing-list-${line.id}`}>
                                                            {services.map((svc, idx) => (
                                                                <option key={idx} value={svc.code}>{svc.description}</option>
                                                            ))}
                                                        </datalist>
                                                    </div>

                                                    {/* Billing Description */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Description</div>
                                                        <div className="px-1 py-0.5 text-[11px] text-slate-500 truncate italic">
                                                            {line.billingDescription || "---"}
                                                        </div>
                                                    </div>

                                                    {/* Fee */}
                                                    <div className="w-16 flex-shrink-0 text-right">
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 pr-1">Fee</div>
                                                        <div className="text-[11px] text-blue-700 font-bold px-1">
                                                            ${line.totalFee || '0.00'}
                                                        </div>
                                                    </div>

                                                    {/* Action */}
                                                    <div className="flex-shrink-0 w-6 flex justify-center pt-3">
                                                        {serviceLines.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveServiceLine(line.id)}
                                                                className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Remove line"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {serviceLines.length < 4 && (
                                            <button
                                                type="button"
                                                onClick={handleAddServiceLine}
                                                className="mt-1 inline-flex items-center text-blue-600 hover:text-blue-700 text-[10px] font-bold uppercase tracking-widest transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Add Billing Line
                                            </button>
                                        )}
                                    </div>

                                    {/* Save and Cancel buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={handleCancelInteraction}
                                            disabled={isSaving}
                                            className="inline-flex items-center px-6 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                                        >
                                            Cancel interaction
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveInteraction}
                                            disabled={isSaving}
                                            className="inline-flex items-center px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save interaction'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Past Interactions Sidebar */}
                    <aside className="xl:w-[400px] w-full flex-shrink-0 sticky top-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[calc(100vh-140px)]">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Past Interactions
                                </h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase">
                                    History
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {!activePatientVisitorId ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">No patient selected</p>
                                        <p className="text-xs text-slate-400 mt-1">Start an interaction to see history</p>
                                    </div>
                                ) : pastInteractionsForActivePatient.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">No past interactions</p>
                                        <p className="text-xs text-slate-400 mt-1">This patient has no previous records</p>
                                    </div>
                                ) : (
                                    pastInteractionsForActivePatient.map((interaction) => {
                                        const isExpanded = expandedInteractionIds[interaction.id];
                                        const date = new Date(interaction.editedAt || interaction.createdAt);
                                        const diagCode = interaction.serviceLines?.[0]?.diagnostic || 'N/A';

                                        return (
                                            <div
                                                key={interaction.id}
                                                className={`group border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md ${isExpanded ? 'border-blue-200 ring-1 ring-blue-100 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedInteractionIds(prev => ({ ...prev, [interaction.id]: !isExpanded }))}
                                                    className="w-full text-left p-4 focus:outline-none"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                                                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                            <span className="text-sm font-bold text-slate-900">
                                                                {interaction.interactionSerial || 'REG-N/A'}
                                                            </span>
                                                        </div>
                                                        <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                                            <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                            Dx: {diagCode.split(' - ')[0]}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-slate-400">
                                                            {interaction.serviceLines?.[0]?.service || ''}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-4 pb-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="h-px bg-slate-100 -mx-4"></div>

                                                        <div className="grid grid-cols-1 gap-4">
                                                            {/* CC Recap */}
                                                            {(interaction.ccReason?.text || (interaction.ccReason?.hasScratchpad && interaction.ccReason?.scratchpad)) && (
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Chief Complaint</label>
                                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[40px]">
                                                                        {interaction.ccReason.text && (
                                                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-1">
                                                                                {interaction.ccReason.text}
                                                                            </p>
                                                                        )}
                                                                        {interaction.ccReason.hasScratchpad && interaction.ccReason.scratchpad && (
                                                                            <img
                                                                                src={getImageUrl(interaction.ccReason.scratchpad)}
                                                                                alt="CC Scratchpad"
                                                                                className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                                onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.ccReason.scratchpad), title: 'Chief Complaint Handwriting' })}
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* S Recap */}
                                                            {(interaction.subjective?.text || (interaction.subjective?.hasScratchpad && interaction.subjective?.scratchpad)) && (
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Subjective (S)</label>
                                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[40px]">
                                                                        {interaction.subjective.text && (
                                                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-1">
                                                                                {interaction.subjective.text}
                                                                            </p>
                                                                        )}
                                                                        {interaction.subjective.hasScratchpad && interaction.subjective.scratchpad && (
                                                                            <img
                                                                                src={getImageUrl(interaction.subjective.scratchpad)}
                                                                                alt="S Scratchpad"
                                                                                className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                                onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.subjective.scratchpad), title: 'Subjective Handwriting' })}
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* O Recap */}
                                                            {(interaction.objective?.text || (interaction.objective?.hasScratchpad && interaction.objective?.scratchpad)) && (
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Objective (O)</label>
                                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[40px]">
                                                                        {interaction.objective.text && (
                                                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-1">
                                                                                {interaction.objective.text}
                                                                            </p>
                                                                        )}
                                                                        {interaction.objective.hasScratchpad && interaction.objective.scratchpad && (
                                                                            <img
                                                                                src={getImageUrl(interaction.objective.scratchpad)}
                                                                                alt="O Scratchpad"
                                                                                className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                                onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.objective.scratchpad), title: 'Objective Handwriting' })}
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Assessment Recap */}
                                                            {(interaction.assessmentPlan?.text || (interaction.assessmentPlan?.hasScratchpad && interaction.assessmentPlan?.scratchpad)) && (
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assessment & Plan</label>
                                                                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 min-h-[40px]">
                                                                        {interaction.assessmentPlan.text && (
                                                                            <p className="text-xs text-slate-700 leading-relaxed font-medium mb-1">
                                                                                {interaction.assessmentPlan.text}
                                                                            </p>
                                                                        )}
                                                                        {interaction.assessmentPlan.hasScratchpad && interaction.assessmentPlan.scratchpad && (
                                                                            <img
                                                                                src={getImageUrl(interaction.assessmentPlan.scratchpad)}
                                                                                alt="A&P Scratchpad"
                                                                                className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                                onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.assessmentPlan.scratchpad), title: 'Assessment & Plan Handwriting' })}
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Service Lines Recap */}
                                                        {interaction.serviceLines && interaction.serviceLines.length > 0 && (
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Services & Billing</label>
                                                                <div className="space-y-1.5">
                                                                    {interaction.serviceLines.map((line, idx) => (
                                                                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px]">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className="font-bold text-blue-700">{line.diagnostic}</span>
                                                                                <span className="font-bold text-slate-900">${line.totalFee || '0.00'}</span>
                                                                            </div>
                                                                            <div className="text-slate-500 font-medium leading-tight mb-1">
                                                                                {diagnostics.find(d => d.code === line.diagnostic)?.description || 'No description'}
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-200/50 pt-1 mt-1">
                                                                                <span>Code: <span className="text-slate-600 font-bold">{line.service}</span></span>
                                                                                <span>Acct: <span className="text-slate-600 font-bold">{line.accountingNumber || 'N/A'}</span></span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Reports section */}
                                                        <div className="pt-2">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reports</label>
                                                                <span className="text-[10px] font-medium text-blue-600">
                                                                    {patientReports.filter(r => r.interactionId === interaction.id).length} items
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2">
                                                                {patientReports
                                                                    .filter(r => r.interactionId === interaction.id)
                                                                    .map((report) => {
                                                                        const isPdf = report.fileMetadata.mimeType === 'application/pdf';
                                                                        const fileUrl = report.fileMetadata.localPath.startsWith('http')
                                                                            ? report.fileMetadata.localPath
                                                                            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${report.fileMetadata.localPath}`;

                                                                        return (
                                                                            <div
                                                                                key={report.id}
                                                                                onClick={() => setViewingMedia({
                                                                                    type: isPdf ? 'pdf' : 'image',
                                                                                    url: fileUrl,
                                                                                    title: report.fileMetadata.filename
                                                                                })}
                                                                                className="relative group/report cursor-pointer border border-slate-100 rounded-xl p-1 bg-white hover:border-blue-400 transition-colors"
                                                                            >
                                                                                <div className="aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden relative">
                                                                                    {isPdf ? (
                                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                                                                                            <span className="text-red-500 font-black text-[10px]">PDF</span>
                                                                                            <span className="text-[8px] text-slate-400 truncate w-full mt-1">{report.fileMetadata.filename}</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <img
                                                                                            src={fileUrl}
                                                                                            alt={report.fileMetadata.filename}
                                                                                            className="w-full h-full object-cover transition-transform group-hover/report:scale-110"
                                                                                        />
                                                                                    )}
                                                                                    <div className="absolute inset-0 bg-slate-900/0 group-hover/report:bg-slate-900/20 transition-all"></div>
                                                                                </div>
                                                                                <div className="mt-1 px-1">
                                                                                    <div className="text-[9px] font-bold text-slate-700 truncate">{report.labMetadata?.labName || report.reportType}</div>
                                                                                    <div className="text-[8px] text-slate-400 font-medium">{new Date(report.procedureDate).toLocaleDateString()}</div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                {patientReports.filter(r => r.interactionId === interaction.id).length === 0 && (
                                                                    <div className="col-span-2 py-3 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                                                        <span className="text-[10px] text-slate-400 font-medium italic">No reports attached</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                                <button
                                    onClick={() => handleOpenPatientDetails(activePatientVisitorId)}
                                    className="w-full py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Full Patient Profile
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* Completed interactions footer (optional, keeping it here as it was) */}
            {activeViewTab === 'scheduled' && completedInteractions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col pt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Recently completed
                            </h2>
                        </div>
                    </div>
                    <div className="border border-slate-100 rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Registration</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Patient</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Completed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {completedInteractions.slice(0, 5).map((interaction) => (
                                    <tr key={interaction.id}>
                                        <td className="px-4 py-2 font-medium text-blue-600">{interaction.interactionSerial}</td>
                                        <td className="px-4 py-2">{getVisitorName(interaction.visitorId)}</td>
                                        <td className="px-4 py-2 text-slate-500">{formatDate(interaction.editedAt || interaction.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Patient details modal */}
            {showPatientDetailModal && selectedPatient && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">
                                    Patient details
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {getVisitorName(selectedPatient.id)} ·{' '}
                                    {getVisitorSerial(selectedPatient.id)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPatientDetailModal(false)}
                                className="text-xs font-medium text-slate-500 hover:text-slate-900"
                            >
                                Close
                            </button>
                        </div>

                        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 space-y-6 text-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                                        Name
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        {getVisitorName(selectedPatient.id)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                                        Patient ID
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        {getVisitorSerial(selectedPatient.id)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                                        Date of birth
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        {selectedPatient.dateOfBirth || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                                        Phone
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        {selectedPatient.phone || selectedPatient.phoneH || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                                        Email
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        {selectedPatient.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                                        Health card
                                    </div>
                                    <div className="font-medium text-slate-900">
                                        {selectedPatient.healthCardNumber || 'N/A'}
                                        {selectedPatient.healthCardVersion && (
                                            <span className="text-xs text-slate-500 ml-1">
                                                · {selectedPatient.healthCardVersion}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Completed interactions */}
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Completed Interactions</h4>
                                {completedInteractionsForPatient.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic py-2">
                                        No completed interactions for this patient.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {completedInteractionsForPatient.map((interaction) => {
                                            const isExpanded = expandedInteractionIds[interaction.id];
                                            return (
                                                <div
                                                    key={interaction.id}
                                                    className="border border-slate-200 rounded-lg overflow-hidden bg-white"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedInteractionIds((prev) => ({
                                                                ...prev,
                                                                [interaction.id]: !isExpanded,
                                                            }))
                                                        }
                                                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-semibold text-blue-700">
                                                                {interaction.interactionSerial || 'N/A'}
                                                            </span>
                                                            <span className="text-xs text-slate-500 mt-0.5">
                                                                Completed: {formatDate(interaction.editedAt || interaction.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${interaction.closed
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {interaction.closed ? 'Closed' : 'Open'}
                                                            </span>
                                                            <svg
                                                                className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                    {isExpanded && (
                                                        <div className="px-4 py-3 text-sm text-slate-700 space-y-4 bg-slate-50 border-t border-slate-200">
                                                            {/* CC/Reason */}
                                                            {interaction.ccReason && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">CC / Reason</h5>
                                                                    {interaction.ccReason.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.ccReason.text}</p>
                                                                    )}
                                                                    {interaction.ccReason.hasScratchpad && interaction.ccReason.scratchpad && (
                                                                        <img
                                                                            src={getImageUrl(interaction.ccReason.scratchpad)}
                                                                            alt="CC/Reason"
                                                                            className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                            onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.ccReason.scratchpad), title: 'Chief Complaint Handwriting' })}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Subjective */}
                                                            {interaction.subjective && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">S (Subjective)</h5>
                                                                    {interaction.subjective.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.subjective.text}</p>
                                                                    )}
                                                                    {interaction.subjective.hasScratchpad && interaction.subjective.scratchpad && (
                                                                        <img
                                                                            src={getImageUrl(interaction.subjective.scratchpad)}
                                                                            alt="Subjective"
                                                                            className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                            onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.subjective.scratchpad), title: 'Subjective Handwriting' })}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Objective */}
                                                            {interaction.objective && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">O (Objective)</h5>
                                                                    {interaction.objective.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.objective.text}</p>
                                                                    )}
                                                                    {interaction.objective.hasScratchpad && interaction.objective.scratchpad && (
                                                                        <img
                                                                            src={getImageUrl(interaction.objective.scratchpad)}
                                                                            alt="Objective"
                                                                            className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                            onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.objective.scratchpad), title: 'Objective Handwriting' })}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Assessment and Plan */}
                                                            {interaction.assessmentPlan && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-1">A and P (Assessment and Plan)</h5>
                                                                    {interaction.assessmentPlan.text && (
                                                                        <p className="text-xs text-slate-600 mb-2 whitespace-pre-wrap">{interaction.assessmentPlan.text}</p>
                                                                    )}
                                                                    {interaction.assessmentPlan.hasScratchpad && interaction.assessmentPlan.scratchpad && (
                                                                        <img
                                                                            src={getImageUrl(interaction.assessmentPlan.scratchpad)}
                                                                            alt="Assessment and Plan"
                                                                            className="max-w-full h-auto rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                                                            onClick={() => setViewingMedia({ type: 'image', url: getImageUrl(interaction.assessmentPlan.scratchpad), title: 'Assessment & Plan Handwriting' })}
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {/* Service Lines */}
                                                            {interaction.serviceLines && interaction.serviceLines.length > 0 && (
                                                                <div>
                                                                    <h5 className="font-semibold text-slate-900 mb-2">Services</h5>
                                                                    <div className="space-y-1">
                                                                        {interaction.serviceLines.map((line, idx) => (
                                                                            <div key={idx} className="bg-white rounded p-2 text-xs border border-slate-200">
                                                                                <div className="grid grid-cols-6 gap-2">
                                                                                    <div className="font-medium text-slate-600">{line.serialNumber}</div>
                                                                                    <div><span className="text-slate-500">Service:</span> {line.service}</div>
                                                                                    <div><span className="text-slate-500">Suffix:</span> {line.suffix}</div>
                                                                                    <div><span className="text-slate-500">Diagnostic:</span> {line.diagnostic}</div>
                                                                                    <div><span className="text-slate-500">Fee:</span> ${line.totalFee || '0.00'}</div>
                                                                                    <div><span className="text-slate-500">Acct #:</span> {line.accountingNumber || 'N/A'}</div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Reports Section */}
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Reports</h4>
                                {isLoadingReports ? (
                                    <div className="text-xs text-slate-400 italic py-2">Loading reports...</div>
                                ) : patientReports.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic py-2">No reports found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {patientReports.map((report) => {
                                            const procDate = new Date(report.procedureDate).toLocaleDateString(undefined, { dateStyle: 'medium' });
                                            const fileUrl = report.fileMetadata.localPath.startsWith('http')
                                                ? report.fileMetadata.localPath
                                                : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${report.fileMetadata.localPath}`;

                                            const typeLabel = [
                                                { value: 'blood_test', label: 'Blood Test' },
                                                { value: 'x_ray', label: 'X-Ray' },
                                                { value: 'ultrasound', label: 'Ultrasound' },
                                                { value: 'ct_scan', label: 'CT Scan' },
                                                { value: 'mri_scan', label: 'MRI Scan' },
                                                { value: 'ecg', label: 'ECG' },
                                                { value: 'pathology', label: 'Pathology' },
                                                { value: 'urine_test', label: 'Urine Test' },
                                                { value: 'other', label: 'Other' }
                                            ].find(t => t.value === report.reportType)?.label || report.reportType;

                                            return (
                                                <div key={report.id} className="group relative bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all">
                                                    <div className="flex gap-3">
                                                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                                            {report.fileMetadata.mimeType.startsWith('image/') ? (
                                                                <img
                                                                    src={fileUrl}
                                                                    alt="Preview"
                                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                                                    onClick={() => setViewingMedia({ type: 'image', url: fileUrl, title: `${typeLabel} - ${procDate}` })}
                                                                />
                                                            ) : (
                                                                <div className="text-center cursor-pointer" onClick={() => setViewingMedia({ type: 'pdf', url: fileUrl, title: `${typeLabel} - ${procDate}` })}>
                                                                    <div className="text-[8px] font-black text-red-600">PDF</div>
                                                                    <svg className="w-4 h-4 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider truncate">{typeLabel}</span>
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                            <div className="text-xs font-bold text-slate-800 truncate" title={report.labMetadata?.labName}>
                                                                {report.labMetadata?.labName || 'Laboratory Not Specified'}
                                                            </div>
                                                            <div className="mt-1 text-[10px] text-slate-500">{procDate}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Cancel Interaction Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Interaction?</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6">
                                What would you like to do with this interaction? You can either cancel it entirely or save it to your incomplete list to resume later.
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={moveToIncomplete}
                                    className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Move to Incomplete
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    className="w-full py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Cancel & Return to Queue
                                </button>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="w-full py-2 px-4 text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
                                >
                                    Go back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Media Viewer Modal */}
            {viewingMedia && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                        <div className="flex-1 overflow-hidden bg-slate-50 flex items-center justify-center p-2 sm:p-4">
                            {viewingMedia.type === 'pdf' ? (
                                <iframe
                                    src={`${viewingMedia.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full rounded-lg bg-white border border-slate-200"
                                    title={viewingMedia.title}
                                />
                            ) : (
                                <img
                                    src={viewingMedia.url}
                                    alt={viewingMedia.title}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                />
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
            )}
        </div>
    );
};

export default OfficerTab;
