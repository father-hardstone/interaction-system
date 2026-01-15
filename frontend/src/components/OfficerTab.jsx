import { useMemo, useRef, useState, useEffect } from 'react';
import api from '../services/api';

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
    const [activeInteractionId, setActiveInteractionId] = useState(null);

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
            service: '',
            suffix: '',
            diagnostic: '',
            totalFee: '',
            accountingNumber: ''
        }
    ]);

    // Services and diagnostics from backend
    const [services, setServices] = useState([]);
    const [diagnostics, setDiagnostics] = useState([]);
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

    const doctorInteractions = useMemo(
        () => interactions.filter((i) => i.officerId === doctorId),
        [interactions, doctorId]
    );

    // Scheduled interactions: assigned to doctor, not completed, and not currently active
    const scheduledInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => !i.completed && i.id !== activeInteractionId
        );
    }, [doctorInteractions, activeInteractionId]);
    
    // Completed interactions: assigned to doctor and completed
    const completedInteractions = useMemo(() => {
        return doctorInteractions.filter(
            (i) => i.completed
        ).sort((a, b) => new Date(b.editedAt || b.createdAt).getTime() - new Date(a.editedAt || a.createdAt).getTime());
    }, [doctorInteractions]);
    
    const ongoingInteractions = doctorInteractions.filter(
        (i) => i.id === activeInteractionId
    );

    const getVisitor = (visitorId) => visitors.find((v) => v.id === visitorId);

    const getVisitorName = (visitorId) => {
        const v = getVisitor(visitorId);
        if (!v) return 'Unknown patient';
        return `${v.firstName || ''}${v.firstName ? ' ' : ''}${
            v.middleName ? v.middleName + ' ' : ''
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

    const handleStartInteraction = async (interactionId) => {
        setActiveInteractionId(interactionId);
        // Reset note fields when starting a new interaction
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
        // Reset service lines to one default line
        setServiceLines([
            {
                id: Date.now(),
                serialNumber: 1,
                service: '',
                suffix: '',
                diagnostic: '',
                totalFee: '',
                accountingNumber: ''
            }
        ]);

        // Mark interaction as started in backend
        try {
            await api.put(`/interactions/${interactionId}/details`, {
                started: true
            });
        } catch (error) {
            console.error('Error marking interaction as started:', error);
            // Don't block UI if this fails
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
            
            const updatedLine = { ...line, [field]: value };
            
            // If service code is being updated, extract suffix and fetch prices
            if (field === 'service' && value) {
                // Extract suffix (first letter before numbers, e.g., "A" from "A001")
                const match = value.trim().match(/^([A-Za-z]+)/);
                if (match) {
                    updatedLine.suffix = match[1].toUpperCase();
                }
                
                // Find service in services array and calculate total fee (case-insensitive)
                const service = services.find(s => s.code.toUpperCase() === value.trim().toUpperCase());
                if (service) {
                    // Sum all fees: hcpFee + tFee + pFee + sFee
                    const totalFee = (service.hcpFee || 0) + 
                                   (service.tFee || 0) + 
                                   (service.pFee || 0) + 
                                   (service.sFee || 0);
                    updatedLine.totalFee = totalFee.toFixed(2);
                } else {
                    updatedLine.totalFee = '';
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
                    service: line.service,
                    suffix: line.suffix,
                    diagnostic: line.diagnostic,
                    totalFee: parseFloat(line.totalFee) || 0,
                    accountingNumber: line.accountingNumber || ''
                }))
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

    // Helper to get image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('data:image') || imagePath.startsWith('http')) {
            return imagePath;
        }
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        return `${API_URL.replace('/api', '')}/${imagePath}`;
    };

    return (
        <div className="space-y-8">
            {/* Top section: Scheduled & Ongoing tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Scheduled Interactions */}
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
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                ID: {interaction.id}
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
                                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium shadow-sm hover:bg-blue-700 transition-colors"
                                            >
                                                Start interaction
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ongoing interactions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Ongoing interaction
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                The interaction you have actively opened
                            </p>
                        </div>
                    </div>

                    <div className="border border-slate-100 rounded-lg overflow-x-auto min-h-[120px]">
                        {activeInteractionId && ongoingInteractions.length > 0 ? (
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
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {ongoingInteractions.map((interaction) => (
                                        <tr key={interaction.id}>
                                            <td className="px-4 py-2 align-top">
                                                <div className="text-xs font-semibold text-blue-700">
                                                    {interaction.interactionSerial || 'N/A'}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    ID: {interaction.id}
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
                                            <td className="px-4 py-2 align-top text-xs text-slate-500">
                                                {formatDate(interaction.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex items-center justify-center px-4 py-8 text-xs text-slate-400">
                                No ongoing interaction selected
                            </div>
                        )}
                    </div>
                </div>

                {/* Completed Interactions */}
                {completedInteractions.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col col-span-full">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Completed interactions
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Previously completed interactions ({completedInteractions.length})
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
                                            Completed at
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {completedInteractions.map((interaction) => (
                                        <tr key={interaction.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 align-top">
                                                <div className="text-xs font-semibold text-blue-700">
                                                    {interaction.interactionSerial || 'N/A'}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    ID: {interaction.id}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom: Interaction note fields */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Interaction</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Structured notes for the currently selected interaction
                        </p>
                    </div>
                    {activeInteractionId && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-700 border border-green-100">
                            Active
                        </span>
                    )}
                </div>

                {!activeInteractionId && (
                    <div className="border border-dashed border-slate-200 rounded-lg p-4 text-xs text-slate-400 text-center">
                        Select &quot;Start interaction&quot; from the scheduled list to begin
                        documenting.
                    </div>
                )}

                {activeInteractionId && (
                    <div className="space-y-4 sm:space-y-6 mt-2">
                        {/* CC / Reason */}
                        {/* CC / reason */}
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

                        {/* Service Lines Section */}
                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">Services</h3>
                            </div>
                            
                            {/* Service Lines */}
                            <div className="space-y-3">
                                {serviceLines.map((line) => (
                                    <div key={line.id} className="grid grid-cols-6 gap-3 items-center">
                                        {/* Serial Number */}
                                        <div className="flex items-center">
                                            <span className="text-xs font-medium text-slate-600 w-8">
                                                {line.serialNumber}
                                            </span>
                                        </div>
                                        
                                        {/* Service */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-slate-500">Service</label>
                                            <input
                                                type="text"
                                                value={line.service}
                                                onChange={(e) => handleUpdateServiceLine(line.id, 'service', e.target.value)}
                                                list={`service-list-${line.id}`}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Service code (e.g., A001)"
                                            />
                                            <datalist id={`service-list-${line.id}`}>
                                                {services.map((svc, idx) => (
                                                    <option key={idx} value={svc.code}>{svc.code} - {svc.description}</option>
                                                ))}
                                            </datalist>
                                        </div>
                                        
                                        {/* Suffix */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-slate-500">Suffix</label>
                                            <input
                                                type="text"
                                                value={line.suffix}
                                                onChange={(e) => handleUpdateServiceLine(line.id, 'suffix', e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Suffix"
                                            />
                                        </div>
                                        
                                        {/* Diagnostic */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-slate-500">Diagnostic</label>
                                            <input
                                                type="text"
                                                value={line.diagnostic}
                                                onChange={(e) => handleUpdateServiceLine(line.id, 'diagnostic', e.target.value)}
                                                list={`diagnostic-list-${line.id}`}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Diagnostic code"
                                            />
                                            <datalist id={`diagnostic-list-${line.id}`}>
                                                {diagnostics.map((diag, idx) => (
                                                    <option key={idx} value={`${diag.code} - ${diag.description}`} />
                                                ))}
                                            </datalist>
                                        </div>
                                        
                                        {/* Total Fee (non-editable) */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-slate-500">Total Fee</label>
                                            <input
                                                type="text"
                                                value={line.totalFee || ''}
                                                readOnly
                                                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-600 cursor-not-allowed"
                                                placeholder="Auto"
                                            />
                                        </div>
                                        
                                        {/* Accounting # (non-editable) */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] text-slate-500">Accounting #</label>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    value={line.accountingNumber || ''}
                                                    readOnly
                                                    className="flex-1 rounded-lg border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-600 cursor-not-allowed"
                                                    placeholder="Auto"
                                                />
                                                {serviceLines.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveServiceLine(line.id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Remove line"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Add New Button */}
                            {serviceLines.length < 4 && (
                                <button
                                    type="button"
                                    onClick={handleAddServiceLine}
                                    className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add new
                                </button>
                            )}
                        </div>

                        {/* Save button */}
                        <div className="flex justify-end pt-4 border-t border-slate-200">
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
                )}
            </div>

            {/* Patient details modal */}
            {showPatientDetailModal && selectedPatient && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
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
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                                interaction.closed 
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
                                                                            className="max-w-full h-auto rounded border border-slate-200"
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
                                                                            className="max-w-full h-auto rounded border border-slate-200"
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
                                                                            className="max-w-full h-auto rounded border border-slate-200"
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
                                                                            className="max-w-full h-auto rounded border border-slate-200"
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfficerTab;
