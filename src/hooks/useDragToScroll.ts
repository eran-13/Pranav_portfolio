import { useEffect, useRef, useState } from 'react';

export const useDragToScroll = (containerRef?: React.RefObject<HTMLElement>) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    scrollStart: 0,
  });

  useEffect(() => {
    const getScrollContainer = () => {
      return containerRef?.current || window;
    };

    const getScrollLeft = () => {
      if (containerRef?.current) {
        return containerRef.current.scrollLeft;
      }
      return window.scrollX;
    };

    const setScrollLeft = (value: number) => {
      if (containerRef?.current) {
        containerRef.current.scrollLeft = value;
      } else {
        window.scrollTo({
          left: value,
          behavior: 'auto',
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle if clicking on a horizontal scroll container or its children
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('.overflow-x-auto, .horizontal-scroll');
      
      // Don't start drag if clicking on interactive elements
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[data-no-drag]') ||
        (!scrollContainer && !containerRef) // Only allow if on a scroll container or if containerRef is provided
      ) {
        return;
      }

      dragState.current.isDragging = true;
      dragState.current.startX = e.clientX;
      dragState.current.scrollStart = getScrollLeft();
      setIsDragging(true);
      document.body.classList.add('grabbing');
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.current.isDragging) return;

      const deltaX = e.clientX - dragState.current.startX;
      setScrollLeft(dragState.current.scrollStart - deltaX);
    };

    const handleMouseUp = () => {
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        setIsDragging(false);
        document.body.classList.remove('grabbing');
        document.body.style.userSelect = '';
      }
    };

    // Touch events for mobile
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollContainer = target.closest('.overflow-x-auto, .horizontal-scroll');
      
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[data-no-drag]') ||
        (!scrollContainer && !containerRef)
      ) {
        return;
      }

      dragState.current.isDragging = true;
      dragState.current.startX = e.touches[0].clientX;
      dragState.current.scrollStart = getScrollLeft();
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragState.current.isDragging) return;

      e.preventDefault(); // Prevent default scrolling
      const deltaX = e.touches[0].clientX - dragState.current.startX;
      setScrollLeft(dragState.current.scrollStart - deltaX);
    };

    const handleTouchEnd = () => {
      if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        setIsDragging(false);
        document.body.classList.remove('grabbing');
      }
    };

    const scrollContainer = getScrollContainer();
    const element = scrollContainer === window ? window : scrollContainer as HTMLElement;

    // Mouse events
    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      document.body.classList.remove('grabbing');
      document.body.style.userSelect = '';
    };
  }, [containerRef]);

  return { isDragging };
};

