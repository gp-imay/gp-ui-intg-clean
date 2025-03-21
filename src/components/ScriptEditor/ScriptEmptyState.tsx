import React from 'react';
import { FileText, Sparkles } from 'lucide-react';

interface ScriptEmptyStateProps {
  scriptType: 'AI' | 'MANUAL';
  onGenerateScript: () => void;
  isGenerating: boolean;
}

export function ScriptEmptyState({ 
  scriptType, 
  onGenerateScript,
  isGenerating = false
}: ScriptEmptyStateProps) {
  if (scriptType === 'AI') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-sm my-8 max-w-xl mx-auto">
        <img 
          src="https://framerusercontent.com/images/wlmLl0p0tfc5j0IhyhoO8krmeCM.png" 
          alt="Script icon" 
          className="w-16 h-16 mb-4 opacity-50" 
        />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Generate Your Script</h3>
        <p className="text-gray-600 mb-6 text-center">
          You've created the story beats. Click the button below to generate the first scene of your screenplay.
        </p>
        <button
          onClick={onGenerateScript}
          disabled={isGenerating}
          className={`px-4 py-2 ${
            isGenerating 
              ? 'bg-gray-400' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-md flex items-center transition-colors`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin mr-2">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate First Scene
            </>
          )}
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-sm my-8 max-w-xl mx-auto">
      <FileText className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Start Writing Your Script</h3>
      <p className="text-gray-600 mb-6 text-center">
        Your screenplay is empty. Click anywhere to start writing, or use the format buttons on the left to choose element types.
      </p>
      <div className="text-sm text-gray-500 bg-gray-100 p-4 rounded-md">
        <p className="font-medium mb-2">Pro Tip: Use keyboard shortcuts</p>
        <ul className="space-y-1">
          <li>⌘1: Scene Heading</li>
          <li>⌘2: Action</li>
          <li>⌘3: Character</li>
          <li>⌘4: Dialogue</li>
        </ul>
      </div>
    </div>
  );
}