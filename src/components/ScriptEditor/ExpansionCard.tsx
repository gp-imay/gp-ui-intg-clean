// Create a new file: src/components/ScriptEditor/ExpansionCard.tsx

import React, { useState } from 'react';
// import { ScriptExpansion } from '../../services/api'; // Adjust import path

interface ScriptExpansion {
    explanation: string;
    expanded_text: string;
  }

interface ExpansionCardProps {
  title: string;
  expansion: ScriptExpansion;
  onApply: (text: string) => void;
}

export function ExpansionCard({ title, expansion, onApply }: ExpansionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!expansion || typeof expansion.expanded_text !== 'string') {
    // Optionally render nothing or a placeholder if expansion data is invalid
    console.warn(`Invalid expansion data for card titled: "${title}"`, expansion);
    return null;
  }

  
  return (
    <div 
      className="bg-white rounded-lg shadow border border-gray-200 mb-4 overflow-hidden transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-medium text-gray-800">{title}</h3>
          {isHovered && expansion.expanded_text && (
            <button
              onClick={() => onApply(expansion.expanded_text)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply Changes
            </button>
          )}
        </div>
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
          {expansion.expanded_text}
        </div>
      </div>
    </div>
  );
}