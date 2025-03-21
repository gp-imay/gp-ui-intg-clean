import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { ScriptElement as ScriptElementType } from '../../types/screenplay';
import { ScriptEmptyState } from './ScriptEmptyState';

interface ScriptContentLoaderProps {
  scriptId: string;
  creationMethod: string;
  initialElements: ScriptElementType[];
  onElementsLoaded: (elements: ScriptElementType[]) => void;
  onSceneSegmentIdUpdate: (id: string | null) => void;
  showAlert: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  isGeneratingFirstScene: boolean;
  onGenerateScript: () => void;
}

const PAGE_SIZE = 20; // Number of scene segments to load at once

export function ScriptContentLoader({
  scriptId,
  creationMethod,
  initialElements,
  onElementsLoaded,
  onSceneSegmentIdUpdate,
  showAlert,
  isGeneratingFirstScene,
  onGenerateScript
}: ScriptContentLoaderProps) {
  const [elements, setElements] = useState<ScriptElementType[]>(initialElements);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreContent, setHasMoreContent] = useState(true);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadingObserverRef = useRef<HTMLDivElement>(null);
  const contentLoaded = useRef(false);
  
  // Add a Set to track loaded segment IDs
  const loadedSegmentIds = useRef<Set<string>>(new Set());
  
  // Initialize with any existing segment IDs
  useEffect(() => {
    if (initialElements.length > 0) {
      initialElements.forEach(element => {
        if (element.sceneSegmentId) {
          loadedSegmentIds.current.add(element.sceneSegmentId);
        }
      });
    }
  }, [initialElements]);

  // Helper function to sort elements by segment position
  const sortElementsByPosition = (elements: ScriptElementType[]): ScriptElementType[] => {
    // Group elements by segment ID
    const segmentGroups = new Map<string, ScriptElementType[]>();
    
    elements.forEach(element => {
      if (element.sceneSegmentId) {
        if (!segmentGroups.has(element.sceneSegmentId)) {
          segmentGroups.set(element.sceneSegmentId, []);
        }
        segmentGroups.get(element.sceneSegmentId)?.push(element);
      }
    });
    
    // Get sorted segments based on segmentPosition
    const sortedSegmentIds = Array.from(segmentGroups.keys()).sort((a, b) => {
      const aElement = elements.find(el => el.sceneSegmentId === a);
      const bElement = elements.find(el => el.sceneSegmentId === b);
      const aPosition = aElement?.position ?? 0;
      const bPosition = bElement?.position ?? 0;
      return aPosition - bPosition;
    });
    
    // Flatten the sorted groups
    const sortedElements: ScriptElementType[] = [];
    sortedSegmentIds.forEach(segmentId => {
      const segmentElements = segmentGroups.get(segmentId) || [];
      sortedElements.push(...segmentElements);
    });
    
    return sortedElements;
  };

  // Updated load initial content function
  async function loadInitialContent() {
    if (!scriptId) return;
    
    console.log("Starting loadInitialContent");
    setIsInitialLoading(true);
    setHasError(false);
    
    try {
      // Check if we already have content (initialElements)
      if (initialElements.length > 1 || (initialElements.length === 1 && initialElements[0].content)) {
        console.log("Using initial elements:", initialElements.length);
        setElements(initialElements);
        contentLoaded.current = true;
        setIsInitialLoading(false);
        return;
      }
      
      // Fetch first batch of script segments
      const data = await api.getScriptSegments(scriptId, 0, PAGE_SIZE);
      console.log("API response:", data);
      
      // If we got segments, convert and set them
      if (data.segments && data.segments.length > 0) {
        console.log(`Loaded ${data.segments.length} initial segments`);
        
        // Track the loaded segment IDs
        data.segments.forEach(segment => {
          if (segment.id) loadedSegmentIds.current.add(segment.id);
        });
        
        // Convert segments to elements while passing empty array for existingElements
        const scriptElements = api.convertSegmentsToScriptElements(data.segments, []);
        
        if (scriptElements.length > 0) {
          // Sort by segment position
          const sortedElements = sortElementsByPosition(scriptElements);
          
          setElements(sortedElements);
          onElementsLoaded(sortedElements);
          
          // Update the current scene segment ID using the last segment
          const lastSegment = data.segments[data.segments.length - 1];
          if (lastSegment && lastSegment.id) {
            onSceneSegmentIdUpdate(lastSegment.id);
          }
          
          // Update pagination
          setPageOffset(data.segments.length);
          setHasMoreContent(data.total > data.segments.length);
          
          contentLoaded.current = true;
          showAlert('success', 'Script loaded successfully');
        } else {
          // Handle empty conversion case
          console.log("Warning: Segments returned but conversion produced no elements", data.segments);
          
          // Set appropriate state for empty script
          setElements([{
            id: 'empty-element',
            type: 'action',
            content: ''
          }]);
          
          // Update UI state
          contentLoaded.current = true;
          setHasMoreContent(false);
          
          // Show a message to the user
          showAlert('warning', 'Could not convert script data to editable format');
        }
      } else {
        // Handle no segments case
        console.log("No segments returned from API", data);
        
        // Set appropriate empty state
        setElements([{
          id: 'empty-element',
          type: 'action',
          content: ''
        }]);
        
        // Update UI state
        contentLoaded.current = true;
        setHasMoreContent(false);
      }
    } catch (error) {
      console.error('Failed to fetch script content:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load script content');
      showAlert('error', error instanceof Error ? error.message : 'Failed to load script content');
    } finally {
      console.log("Ending loadInitialContent, setting isInitialLoading to false");
      setIsInitialLoading(false);
    }
  }
  
  // Update loadMoreContent to handle merging content correctly
  const loadMoreContent = async () => {
    if (!hasMoreContent || isLoadingMore || !scriptId) return;
    
    setIsLoadingMore(true);
    
    try {
      console.log(`Loading more content, offset: ${pageOffset}`);
      const data = await api.getScriptSegments(scriptId, pageOffset, PAGE_SIZE);
      
      if (!data.segments || data.segments.length === 0) {
        setHasMoreContent(false);
        return;
      }
      
      // Filter out segments we've already loaded
      const newSegments = data.segments.filter(segment => 
        !loadedSegmentIds.current.has(segment.id)
      );
      
      // Track the newly loaded segment IDs
      newSegments.forEach(segment => {
        loadedSegmentIds.current.add(segment.id);
      });
      
      // Only process if we have new segments
      if (newSegments.length > 0) {
        // Convert segments to elements with existing elements for reference
        const newElements = api.convertSegmentsToScriptElements(newSegments, elements);
        
        if (newElements.length > 0) {
          // Combine existing elements with new elements and sort by position
          const combinedElements = [...elements, ...newElements];
          const sortedElements = sortElementsByPosition(combinedElements);
          
          // Update state with sorted elements
          setElements(sortedElements);
          onElementsLoaded(sortedElements);
          
          // Update the current scene segment ID using the last segment
          const lastSegment = data.segments[data.segments.length - 1];
          if (lastSegment && lastSegment.id) {
            onSceneSegmentIdUpdate(lastSegment.id);
          }
          
          // Update pagination state
          setPageOffset(prev => prev + data.segments.length);
          setHasMoreContent(data.total > pageOffset + data.segments.length);
        }
      } else {
        // If all segments were duplicates, we still need to update pagination
        setPageOffset(prev => prev + data.segments.length);
        setHasMoreContent(data.total > pageOffset + data.segments.length);
      }
    } catch (error) {
      console.error('Error loading more content:', error);
      showAlert('error', 'Failed to load more content. Try scrolling again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (!loadingObserverRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreContent && !isLoadingMore && elements.length > 0) {
          loadMoreContent();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(loadingObserverRef.current);
    
    return () => observer.disconnect();
  }, [hasMoreContent, isLoadingMore, elements.length]);

  // Initial content loading
  useEffect(() => {
    if (!contentLoaded.current) {
      loadInitialContent();
    }
  }, [scriptId]);

  const handleRetry = () => {
    contentLoaded.current = false;
    setHasError(false);
    setErrorMessage(null);
    setIsInitialLoading(true);
    setPageOffset(0);
    setHasMoreContent(true);
    loadInitialContent();
  };

  // Handle initial loading state
  if (isInitialLoading) {
    console.log("Rendering loading state");
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading script content...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (hasError) {
    return (
      <div className="flex items-center justify-center p-8 h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Script</h3>
          <p className="text-gray-600 mb-4">{errorMessage || 'An error occurred while loading your script.'}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Handle empty state - if no content was found after loading
  if (elements.length === 0) {
    const scriptType = creationMethod === 'WITH_AI' ? 'AI' : 'MANUAL';
    return (
      <ScriptEmptyState
        scriptType={scriptType}
        onGenerateScript={onGenerateScript}
        isGenerating={isGeneratingFirstScene}
      />
    );
  }

  console.log("Elements length:", elements.length);
  console.log("Is loading:", isInitialLoading);

  // Content is loaded, children will render the actual elements
  return (
    <>
      {/* Infinite scroll loader - rendered after the actual script content */}
      <div ref={loadingObserverRef} className="h-16 flex items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-2" />
            <span className="text-sm text-gray-600">Loading more content...</span>
          </div>
        )}
      </div>
    </>
  );
}