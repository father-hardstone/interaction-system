/**
 * Utility functions for cross-platform drag and drop
 * Handles both mouse (desktop) and touch (mobile) events
 */

export const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Setup drag and drop for an element
 * Works on both desktop (mouse) and mobile (touch)
 */
export const setupDragAndDrop = (element, options) => {
    if (!element) return () => {};

    const {
        onDragStart,
        onDrag,
        onDragEnd,
        onDragOver,
        onDrop,
        canDrag = true
    } = options;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let dragElement = null;
    let dragImage = null;

    // Touch event handlers
    const handleTouchStart = (e) => {
        if (!canDrag) return;
        
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        isDragging = false;
        dragElement = e.currentTarget;

        // Prevent default to avoid scrolling
        e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (!canDrag || !dragElement) return;

        const touch = e.touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;

        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        // Start dragging if moved more than 10px (to distinguish from scroll)
        if (!isDragging && (deltaX > 10 || deltaY > 10)) {
            isDragging = true;
            
            // Prevent scrolling during drag
            document.body.style.overflow = 'hidden';
            
            // Create visual feedback
            dragElement.style.opacity = '0.5';
            dragElement.style.transform = 'scale(0.95)';
            
            // Call onDragStart
            if (onDragStart) {
                const syntheticEvent = {
                    currentTarget: dragElement,
                    dataTransfer: {
                        effectAllowed: 'move',
                        setData: () => {},
                        getData: () => 'touch-drag'
                    }
                };
                onDragStart(syntheticEvent, dragElement);
            }

            // Create drag image
            dragImage = dragElement.cloneNode(true);
            dragImage.style.position = 'fixed';
            dragImage.style.top = `${touch.clientY - 50}px`;
            dragImage.style.left = `${touch.clientX - 50}px`;
            dragImage.style.pointerEvents = 'none';
            dragImage.style.zIndex = '10000';
            dragImage.style.opacity = '0.8';
            dragImage.style.transform = 'scale(0.9)';
            document.body.appendChild(dragImage);
        }

        if (isDragging) {
            // Update drag image position
            if (dragImage) {
                dragImage.style.top = `${touch.clientY - 50}px`;
                dragImage.style.left = `${touch.clientX - 50}px`;
            }

            // Prevent scrolling
            e.preventDefault();

            // Call onDrag if provided
            if (onDrag) {
                onDrag(e);
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging || !dragElement) {
            // Reset
            dragElement = null;
            document.body.style.overflow = '';
            return;
        }

        // Find drop target
        const touch = e.changedTouches[0];
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Restore body overflow
        document.body.style.overflow = '';
        
        // Remove drag image
        if (dragImage && document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
            dragImage = null;
        }

        // Restore element style
        if (dragElement) {
            dragElement.style.opacity = '';
            dragElement.style.transform = '';
        }

        // Check if dropped on a valid target
        if (dropTarget) {
            // Find the closest drop zone
            const dropZone = dropTarget.closest('[data-drop-zone]');
            if (dropZone && onDrop) {
                const syntheticEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    currentTarget: dropZone,
                    dataTransfer: {
                        getData: () => 'touch-drag'
                    }
                };
                onDrop(syntheticEvent);
            }
        }

        // Call onDragEnd
        if (onDragEnd) {
            onDragEnd(e);
        }

        // Reset
        isDragging = false;
        dragElement = null;
    };

    // Mouse event handlers (for desktop)
    const handleMouseDown = (e) => {
        if (!canDrag) return;
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;
        dragElement = e.currentTarget;
    };

    // Add event listeners
    if (isTouchDevice()) {
        // Touch events for mobile
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
    } else {
        // Mouse events for desktop (keep existing drag API)
        // The HTML5 drag API will handle this
    }

    // Cleanup function
    return () => {
        if (isTouchDevice()) {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        }
        if (dragImage && document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
        }
        document.body.style.overflow = '';
    };
};

/**
 * Setup drop zone for touch devices
 */
export const setupDropZone = (element, options) => {
    if (!element) return () => {};

    const { onDragOver, onDrop, onDragLeave } = options;
    let isOver = false;

    // Mark as drop zone
    element.setAttribute('data-drop-zone', 'true');

    const handleTouchOver = (e) => {
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (target && (target === element || element.contains(target))) {
            if (!isOver) {
                isOver = true;
                if (onDragOver) {
                    const syntheticEvent = {
                        preventDefault: () => {},
                        currentTarget: element
                    };
                    onDragOver(syntheticEvent);
                }
            }
        } else {
            if (isOver) {
                isOver = false;
                if (onDragLeave) {
                    onDragLeave();
                }
            }
        }
    };

    // For touch devices, we need to track touch moves over the drop zone
    if (isTouchDevice()) {
        document.addEventListener('touchmove', handleTouchOver, { passive: true });
    }

    // Cleanup
    return () => {
        if (isTouchDevice()) {
            document.removeEventListener('touchmove', handleTouchOver);
        }
        element.removeAttribute('data-drop-zone');
    };
};
