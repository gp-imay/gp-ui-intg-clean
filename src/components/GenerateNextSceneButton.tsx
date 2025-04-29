import React from 'react';
import { Sparkles, Wand2, RefreshCw } from 'lucide-react';

interface GenerateNextSceneButtonProps {
  onClick: () => void;
  visible: boolean;
  isLoading?: boolean;
}

export const GenerateNextSceneButton: React.FC<GenerateNextSceneButtonProps> = ({
  onClick,
  visible,
  isLoading = false
}) => {
  if (!visible) return null;
  
  return (
    <div className="flex justify-center my-8">
      <button
        // data-event-name="generate_scenes_for_beat_beatsheet_page"
        data-event-name="generate_next_scenes_with_ai"
        onClick={onClick}
        disabled={isLoading}
        className={`generate-scene-button flex items-center gap-2 px-4 py-3 ${
          isLoading 
            ? 'bg-gray-400' 
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg'
        } text-white rounded-lg shadow-md transition-all duration-300 group`}
      >
        <div className="relative">
          <div className={`absolute inset-0 bg-white rounded-full opacity-20 ${
            isLoading ? '' : 'group-hover:scale-150 transition-transform duration-700'
          }`}></div>
          {isLoading ? (
            <RefreshCw className="w-5 h-5 relative z-10 animate-spin" />
          ) : (
            <Wand2 className="w-5 h-5 relative z-10" />
          )}
        </div>
        <span className="font-medium">
          {isLoading ? 'Generating...' : 'Generate Next Scene'}
        </span>
        {!isLoading && <Sparkles className="w-4 h-4 text-yellow-200" />}
      </button>
    </div>
  );
};