
import React, { useEffect, useRef } from 'react';
import { ScriptElement } from '../../types/screenplay';

interface ScrollPositionManagerProps {
  elements: ScriptElement[];
  selectedElementId: string | null;
  contentRef: React.RefObject<HTMLDivElement>;
  elementRefs: React.MutableRefObject<{ [key: string]: React.RefObject<any> }>;
  children: React.ReactNode;
}

/**
 * Component to manage scroll position during script loading and element selection
 */
export function ScrollPositionManager({
  elements,
  selectedElementId,
  contentRef,
  elementRefs,
  children
}: ScrollPositionManagerProps) {
  const lastElementsLength = useRef<number>(0);
  const lastSelectedId = useRef<string | null>(null);
  const isInitialRender = useRef<boolean>(true);
  const scrollRestorationPoint = useRef<number | null>(null);

  // Maintain scroll position when content changes
  useEffect(() => {
    // Skip on initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Keep track of scroll position before content changes
    if (contentRef.current && elements.length > lastElementsLength.current) {
      scrollRestorationPoint.current = window.scrollY;
    }
    
    // Update our reference for next comparison
    lastElementsLength.current = elements.length;
    
    // After DOM updates, restore scroll if needed
    if (scrollRestorationPoint.current !== null) {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: scrollRestorationPoint.current || 0,
          behavior: 'auto'
        });
        scrollRestorationPoint.current = null;
      });
    }
  }, [elements.length, contentRef]);

  // Scroll to selected element
  useEffect(() => {
    // Only scroll if selection changed
    if (selectedElementId && selectedElementId !== lastSelectedId.current) {
      const elementRef = elementRefs.current[selectedElementId];
      
      if (elementRef?.current) {
        // Use a small delay to ensure the DOM has updated
        setTimeout(() => {
          elementRef.current?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'center'
          });
        }, 100);
      }
      
      lastSelectedId.current = selectedElementId;
    }
  }, [selectedElementId, elementRefs]);

  return <>{children}</>;
}