import React from 'react';
import { Sparkles, Wand2 } from 'lucide-react';

interface GenerateNextSceneButtonProps {
  onClick: () => void;
  visible: boolean;
}

export const GenerateNextSceneButton: React.FC<GenerateNextSceneButtonProps> = ({
  onClick,
  visible
}) => {
  if (!visible) return null;
  
  return (
    <div className="flex justify-center my-8">
      <button
        onClick={onClick}
        className="generate-scene-button flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
          <Wand2 className="w-5 h-5 relative z-10" />
        </div>
        <span className="font-medium">Generate Next Scene</span>
        <Sparkles className="w-4 h-4 text-yellow-200" />
      </button>
    </div>
  );
};