import { useRef, useEffect } from 'react';

/**
 * Hook for cross-platform drag and drop
 * Works on both desktop (HTML5 drag API) and mobile (touch events)
 */
export const useDragAndDrop = ({
    onDragStart,
    onDragEnd,
    canDrag = true,
    dragThreshold = 10 // pixels to move before drag starts
}) => {
    const elementRef = useRef(null);
    const isDraggingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });
    const touchIdRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element || !canDrag) return;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!isTouchDevice) {
            // Desktop: Use HTML5 drag API (already handled by draggable attribute)
            return;
        }

        // Mobile: Use touch events
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return; // Only handle single touch
            
            const touch = e.touches[0];
            touchIdRef.current = touch.identifier;
            startPosRef.current = { x: touch.clientX, y: touch.clientY };
            isDraggingRef.current = false;

            // Prevent scrolling during potential drag
            element.style.touchAction = 'none';
        };

        const handleTouchMove = (e) => {
            if (!touchIdRef.current) return;
            
            const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
            if (!touch) return;

            const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
            const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

            // Start drag if moved beyond threshold
            if (!isDraggingRef.current && (deltaX > dragThreshold || deltaY > dragThreshold)) {
                isDraggingRef.current = true;
                
                // Prevent scrolling
                e.preventDefault();
                document.body.style.overflow = 'hidden';
                
                // Visual feedback
                element.style.opacity = '0.5';
                element.style.transform = 'scale(0.95)';
                
                // Call onDragStart
                if (onDragStart) {
                    const syntheticEvent = {
                        currentTarget: element,
                        dataTransfer: {
                            effectAllowed: 'move',
                            setData: () => {},
                            getData: () => 'touch-drag'
                        },
                        preventDefault: () => {}
                    };
                    onDragStart(syntheticEvent);
                }
            }

            if (isDraggingRef.current) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = (e) => {
            if (!touchIdRef.current) return;

            // Restore styles
            element.style.touchAction = '';
            element.style.opacity = '';
            element.style.transform = '';
            document.body.style.overflow = '';

            if (isDraggingRef.current && onDragEnd) {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
                if (touch) {
                    // Find drop target
                    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (dropTarget) {
                        onDragEnd({
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            target: dropTarget
                        });
                    }
                }
            }

            // Reset
            isDraggingRef.current = false;
            touchIdRef.current = null;
        };

        const handleTouchCancel = () => {
            element.style.touchAction = '';
            element.style.opacity = '';
            element.style.transform = '';
            document.body.style.overflow = '';
            isDraggingRef.current = false;
            touchIdRef.current = null;
        };

        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchcancel', handleTouchCancel);
            element.style.touchAction = '';
            element.style.opacity = '';
            element.style.transform = '';
            document.body.style.overflow = '';
        };
    }, [canDrag, onDragStart, onDragEnd, dragThreshold]);

    return elementRef;
};

/**
 * Hook for drop zones on mobile
 */
export const useDropZone = ({ onDrop, onDragOver, onDragLeave }) => {
    const elementRef = useRef(null);
    const isOverRef = useRef(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice) {
            // Desktop: Use HTML5 drag API (already handled)
            return;
        }

        // Mark as drop zone
        element.setAttribute('data-drop-zone', 'true');

        // For mobile, we check during touch move if we're over this element
        const handleGlobalTouchMove = (e) => {
            if (e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (target && (target === element || element.contains(target))) {
                if (!isOverRef.current) {
                    isOverRef.current = true;
                    if (onDragOver) {
                        onDragOver({
                            currentTarget: element,
                            preventDefault: () => {}
                        });
                    }
                }
            } else {
                if (isOverRef.current) {
                    isOverRef.current = false;
                    if (onDragLeave) {
                        onDragLeave();
                    }
                }
            }
        };

        document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });

        return () => {
            document.removeEventListener('touchmove', handleGlobalTouchMove);
            element.removeAttribute('data-drop-zone');
        };
    }, [onDrop, onDragOver, onDragLeave]);

    return elementRef;
};
