import React, { useRef, useEffect } from 'react';

interface Suggestion {
  id: string;
  text: string;
  description?: string;
}

interface SuggestionsProps {
  suggestions: Suggestion[];
  selectedIndex: number;
  onSelect: (suggestion: Suggestion) => void;
  onMouseEnter: (index: number) => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  selectedIndex,
  onSelect,
  onMouseEnter
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const selected = selectedRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      
      if (selectedRect.bottom > containerRect.bottom) {
        container.scrollTop += selectedRect.bottom - containerRect.bottom;
      } else if (selectedRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - selectedRect.top;
      }
    }
  }, [selectedIndex]);

  if (!suggestions.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg z-50 min-w-[200px] max-w-[300px] overflow-hidden animate-fade-in">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Suggestions</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">↓</kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200 font-mono text-[10px]">Tab</kbd>
            <span>select</span>
          </span>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="max-h-[240px] overflow-y-auto"
      >
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            ref={index === selectedIndex ? selectedRef : null}
            className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${
              index === selectedIndex ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => onMouseEnter(index)}
          >
            <div className="font-medium">{suggestion.text}</div>
            {suggestion.description && (
              <div className="text-sm text-gray-500">{suggestion.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};