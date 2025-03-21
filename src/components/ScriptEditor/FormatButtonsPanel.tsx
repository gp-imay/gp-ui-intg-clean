import React from 'react';
import { ElementType } from '../../types/screenplay';
import { FormatButton } from '../FormatButton';

interface FormatButtonsPanelProps {
  showFormatting: boolean;
  currentType: ElementType;
  onTypeChange: (type: ElementType) => void;
  resetSuggestions: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const FormatButtonsPanel: React.FC<FormatButtonsPanelProps> = ({
  showFormatting,
  currentType,
  onTypeChange,
  resetSuggestions,
  onMouseEnter,
  onMouseLeave
}) => {
  const elementTypes: ElementType[] = [
    'scene-heading',
    'action',
    'character',
    'dialogue',
    'parenthetical',
    'transition'
  ];

  return (
    <div 
      className={`absolute -left-[12rem] top-0 flex flex-col gap-0.5 transition-all duration-200 z-10 ${
        showFormatting ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white rounded-lg shadow-lg p-1">
        {elementTypes.map((elementType, index) => (
          <div
            key={elementType}
            className={`transition-all duration-200 ${
              showFormatting 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-2'
            }`}
            style={{ 
              transitionDelay: showFormatting ? `${index * 50}ms` : '0ms'
            }}
          >
            <FormatButton
              type={elementType}
              isActive={currentType === elementType}
              onClick={() => {
                onTypeChange(elementType);
                resetSuggestions(); // Close suggestions when changing element type
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};