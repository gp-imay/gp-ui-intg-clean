import React from 'react';
import { ElementType } from '../types/screenplay';
import { 
  Clapperboard, 
  Activity, 
  User, 
  MessageSquareText, 
  Parentheses, 
  ArrowRight 
} from 'lucide-react';

interface FormatButtonProps {
  type: ElementType;
  onClick: () => void;
  isActive: boolean;
}

export const FormatButton: React.FC<FormatButtonProps> = ({ type, onClick, isActive }) => {
  const getIcon = () => {
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

  const getLabel = () => {
    switch (type) {
      case 'scene-heading':
        return 'Scene Heading (⌘1)';
      case 'action':
        return 'Action (⌘2)';
      case 'character':
        return 'Character (⌘3)';
      case 'dialogue':
        return 'Dialogue (⌘4)';
      case 'parenthetical':
        return 'Parenthetical (⌘5)';
      case 'transition':
        return 'Transition (⌘6)';
    }
  };

  return (
    <div className="group relative flex items-center">
      <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-colors flex items-center gap-2 w-48 ${
          isActive 
            ? 'bg-blue-100 text-blue-600' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {getIcon()}
        <span className="text-sm font-medium">{getLabel()}</span>
      </button>
    </div>
  );
};