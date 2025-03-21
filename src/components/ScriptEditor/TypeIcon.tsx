import React from 'react';
import { 
  Clapperboard, 
  Activity, 
  User, 
  MessageSquareText, 
  Parentheses, 
  ArrowRight 
} from 'lucide-react';
import { ElementType } from '../../types/screenplay';

interface TypeIconProps {
  type: ElementType;
  isSelected: boolean;
  isFocused: boolean;
  onMouseEnter: () => void;
}

export const TypeIcon: React.FC<TypeIconProps> = ({
  type,
  isSelected,
  isFocused,
  onMouseEnter
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'scene-heading':
        return <Clapperboard className="w-4 h-4" />;
      case 'action':
        return <Activity className="w-4 h-4" />;
      case 'character':
        return <User className="w-4 h-4" />;
      case 'dialogue':
        return <MessageSquareText className="w-4 h-4" />;
      case 'parenthetical':
        return <Parentheses className="w-4 h-4" />;
      case 'transition':
        return <ArrowRight className="w-4 h-4" />;
    }
  };

  return (
    <button
      className={`p-1.5 rounded-full transition-colors ${
        isSelected || isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } text-gray-400 hover:bg-gray-100 hover:text-gray-600`}
      title="Change element type"
      onMouseEnter={onMouseEnter}
    >
      {getTypeIcon()}
    </button>
  );
};