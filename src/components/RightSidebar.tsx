import React, { useState } from 'react';
import { ChevronRight, Sparkles, Maximize2, Minimize2, Wand2, MessageSquare, Trash2, Zap } from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onApplySuggestion?: (content: string) => void;
  selectedElementId?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ 
  isOpen, 
  setIsOpen,
  onApplySuggestion,
  selectedElementId
}) => {
  const [suggestions, setSuggestions] = useState([
    {
      id: '1',
      type: 'improve',
      title: 'Improve Scene',
      timestamp: 'Just now',
      description: 'Added more visual details to the scene description to enhance the atmosphere.',
      content: 'INT. LIVING ROOM - NIGHT\n\nThe dimly lit room is cluttered with old furniture, the walls adorned with faded family photos. A single lamp casts long shadows across the worn carpet, where dust particles dance in the beam of light.'
    },
    {
      id: '2',
      type: 'expand',
      title: 'Expanded Dialogue',
      timestamp: '5m ago',
      description: 'Extended the character\'s response to reveal more about their motivation.',
      content: 'SARAH\n\nI can\'t just walk away from this. You don\'t understand what I\'ve been through, what we\'ve all sacrificed to get here. This isn\'t just about me anymore - there are people counting on us to finish what we started.'
    }
  ]);

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const handleApplySuggestion = (content: string) => {
    if (onApplySuggestion) {
      onApplySuggestion(content);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'improve': return <Wand2 className="h-4 w-4 text-blue-600" />;
      case 'expand': return <Maximize2 className="h-4 w-4 text-purple-600" />;
      case 'shorten': return <Minimize2 className="h-4 w-4 text-amber-600" />;
      case 'dialogue': return <MessageSquare className="h-4 w-4 text-green-600" />;
      default: return <Zap className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 overflow-hidden relative ${
      isOpen ? 'w-80' : 'w-0'
    }`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-none flex justify-between items-center">
          <div className="flex items-center">
            <div className="ai-icon-container mr-2 active">
              <div className="ai-icon-pulse"></div>
              <Sparkles className="ai-icon-sparkle h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Select text and use the AI Assist button in the toolbar to get suggestions and improvements.</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">AI Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
                  <Wand2 className="h-5 w-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-700">Improve</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
                  <Maximize2 className="h-5 w-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-700">Expand</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors group">
                  <Minimize2 className="h-5 w-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-700">Shorten</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
                  <MessageSquare className="h-5 w-5 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs text-gray-700">Dialogue</span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700">Recent Suggestions</h3>
                {suggestions.length > 0 && (
                  <button 
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                    onClick={clearSuggestions}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </button>
                )}
              </div>
              {suggestions.length === 0 ? (
                <div className="text-center py-6">
                  <Sparkles className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No suggestions yet</p>
                  <p className="text-xs text-gray-400 mt-1">Select text and use AI actions to get suggestions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map(suggestion => (
                    <div 
                      key={suggestion.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center">
                          {getIconForType(suggestion.type)}
                          <span className="text-xs font-medium text-gray-700 ml-1.5">{suggestion.title}</span>
                        </div>
                        <span className="text-xs text-gray-400">{suggestion.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{suggestion.description}</p>
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => handleApplySuggestion(suggestion.content)}
                          disabled={!selectedElementId}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {suggestions.length > 0 && (
                <div className="mt-2 text-center">
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    View all suggestions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};