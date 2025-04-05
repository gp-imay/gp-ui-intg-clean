import React, { forwardRef } from 'react'; // Add forwardRef
import { 
  Wand2, 
  Maximize2, 
  Minimize2, 
  MessageCircle, 
  RefreshCw, 
  Zap 
} from 'lucide-react';

interface AIToolsPanelProps {
  showAITools: boolean;
  onAIAction: (action: string) => void;
}

export const AIToolsPanel = forwardRef<HTMLDivElement, AIToolsPanelProps>(({
  showAITools,
  onAIAction
}, ref) => {
  const aiTools = [
    { id: 'expand', icon: <Maximize2 className="w-3.5 h-3.5 text-purple-600" />, label: 'Expand', color: 'purple' },
    { id: 'shorten', icon: <Minimize2 className="w-3.5 h-3.5 text-amber-600" />, label: 'Shorten', color: 'amber' },
    { id: 'rewrite', icon: <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />, label: 'Rewrite', color: 'indigo' },
    { id: 'continue', icon: <Zap className="w-3.5 h-3.5 text-rose-600" />, label: 'Continue', color: 'rose' }
  ];
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 group-hover:bg-blue-200 text-blue-600';
      case 'purple': return 'bg-purple-100 group-hover:bg-purple-200 text-purple-600';
      case 'amber': return 'bg-amber-100 group-hover:bg-amber-200 text-amber-600';
      case 'green': return 'bg-green-100 group-hover:bg-green-200 text-green-600';
      case 'indigo': return 'bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600';
      case 'rose': return 'bg-rose-100 group-hover:bg-rose-200 text-rose-600';
      default: return 'bg-gray-100 group-hover:bg-gray-200 text-gray-600';
    }
  };

  const getHoverClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'hover:bg-blue-50';
      case 'purple': return 'hover:bg-purple-50';
      case 'amber': return 'hover:bg-amber-50';
      case 'green': return 'hover:bg-green-50';
      case 'indigo': return 'hover:bg-indigo-50';
      case 'rose': return 'hover:bg-rose-50';
      default: return 'hover:bg-gray-50';
    }
  };

  return (
    <div 
      ref={ref}
      className={`absolute -right-[12rem] top-0 flex flex-col gap-0.5 transition-all duration-200 z-10 ${
        showAITools ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={(e) => e.stopPropagation()} // Add this to prevent click propagation
    >


      <div className="bg-white rounded-lg shadow-lg p-1">
        {aiTools.map((tool, index) => (
          <div
            key={tool.id}
            className={`transition-all duration-200 ${
              showAITools 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-2'
            }`}
            style={{ 
              transitionDelay: showAITools ? `${index * 50}ms` : '0ms'
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation(); // Add this to prevent event bubbling
                onAIAction(tool.id);
              }}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 w-48 text-gray-700 ${getHoverClasses(tool.color)} group`}
            >

              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${getColorClasses(tool.color)}`}>
                {tool.icon}
              </div>
              <span className="text-sm font-medium">{tool.label}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});