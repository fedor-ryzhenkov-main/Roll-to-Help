'use client';

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { cn } from '@/app/utils/cn';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  positionProp?: TooltipPosition;
  delay?: number;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  closeOnClick?: boolean;
}

/**
 * Tooltip component that displays additional information on hover or focus
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  positionProp = 'top',
  delay = 300,
  className,
  contentClassName,
  maxWidth = '200px',
  closeOnClick = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const targetRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle click on the target element
  const handleClick = () => {
    if (closeOnClick) {
      setIsVisible(false);
    }
  };

  // Show tooltip
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Function to calculate and update tooltip position
  const updatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current || !isVisible) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let newTop = 0, newLeft = 0;

    const effectivePosition = positionProp;

    switch (effectivePosition) {
      case 'top':
        newTop = targetRect.top + scrollY - tooltipRect.height - 8;
        newLeft = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'right':
        newTop = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
        newLeft = targetRect.right + 8;
        break;
      case 'left':
        newTop = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
        newLeft = targetRect.left + scrollX - tooltipRect.width - 8;
        break;
      case 'bottom':
      default:
        newTop = targetRect.bottom + scrollY + 8;
        newLeft = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
    }
    
    // Boundary checks (optional but recommended)
    // Prevent tooltip from going off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    newLeft = Math.max(scrollX + 10, Math.min(newLeft, scrollX + viewportWidth - tooltipRect.width - 10));
    newTop = Math.max(scrollY + 10, Math.min(newTop, scrollY + viewportHeight - tooltipRect.height - 10));

    setPosition({ top: newTop, left: newLeft });
  }, [isVisible, positionProp]);

  // Update position on scroll or resize
  useEffect(() => {
    if (!isVisible) return; // Only listen when visible
    
    window.addEventListener('scroll', updatePosition, true); 
    window.addEventListener('resize', updatePosition);

    // Initial position update
    updatePosition();

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]); // Include isVisible here as well

  // Position classes based on tooltip position
  const positionClasses = {
    top: 'mb-2',
    right: 'ml-2',
    bottom: 'mt-2',
    left: 'mr-2',
  };

  // Arrow classes based on tooltip position
  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    right: 'left-[-6px] top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'top-[-6px] left-1/2 transform -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-6px] top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
  };

  return (
    <>
      <div
        ref={targetRef}
        className={cn('inline-block', className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={handleClick}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 p-2 text-sm text-white bg-gray-800 rounded-md shadow-lg',
            positionClasses[positionProp],
            contentClassName
          )}
          style={{
            left: `${position.left}px`,
            top: `${position.top}px`,
            maxWidth,
          }}
          role="tooltip"
        >
          {content}
          <span
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowClasses[positionProp]
            )}
          />
        </div>
      )}
    </>
  );
}; 