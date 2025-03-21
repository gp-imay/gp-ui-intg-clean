import React from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface AIFeatureToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const AIFeatureToggle: React.FC<AIFeatureToggleProps> = ({
  label,
  description,
  enabled,
  onChange
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h5 className="text-sm font-medium text-gray-700">{label}</h5>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className="relative inline-block w-10 mr-2 align-middle select-none"
      >
        <div className={`w-10 h-5 ${enabled ? 'bg-blue-500' : 'bg-gray-300'} rounded-full shadow-inner transition-colors duration-200`}></div>
        <div className={`absolute w-5 h-5 bg-white rounded-full shadow -left-1 -top-1 transition-transform duration-200 ${enabled ? 'transform translate-x-full' : ''}`}></div>
      </button>
    </div>
  );
};