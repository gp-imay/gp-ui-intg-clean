import React, { useState } from 'react';
import { X, User, PenTool, Layers, Lightbulb } from 'lucide-react';
import { FormatSettings, SceneSuggestions, UserProfile } from '../../types/screenplay';
import { ProfileTab } from './ProfileTab';
import { ElementsTab } from './ElementsTab';
import { PageLayoutTab } from './PageLayoutTab';
import { SuggestionsTab } from './SuggestionsTab';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  settings: FormatSettings;
  setSettings: (settings: FormatSettings) => void;
  suggestions: SceneSuggestions;
  setSuggestions: (suggestions: SceneSuggestions) => void;
  userProfiles: UserProfile[];
  setUserProfiles: (profiles: UserProfile[]) => void;
  activeProfile: string;
  setActiveProfile: (id: string) => void;
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  show,
  onClose,
  settings,
  setSettings,
  suggestions,
  setSuggestions,
  userProfiles,
  setUserProfiles,
  activeProfile,
  setActiveProfile,
  suggestionsEnabled,
  setSuggestionsEnabled
}) => {
  const [activeTab, setActiveTab] = useState<'elements' | 'page' | 'profile' | 'suggestions'>('profile');
  
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div
        className="my-8 bg-white rounded-lg shadow-xl w-[600px] max-w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              User Profile
            </button>
            <button
              onClick={() => setActiveTab('elements')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'elements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PenTool className="w-4 h-4" />
              Element Formatting
            </button>
            <button
              onClick={() => setActiveTab('page')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'page'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              Page Layout
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Suggestions
            </button>
          </nav>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'profile' && (
            <ProfileTab 
              userProfiles={userProfiles}
              setUserProfiles={setUserProfiles}
              activeProfile={activeProfile}
              setActiveProfile={setActiveProfile}
              settings={settings}
            />
          )}

          {activeTab === 'elements' && (
            <ElementsTab 
              settings={settings}
              setSettings={setSettings}
            />
          )}

          {activeTab === 'page' && (
            <PageLayoutTab 
              settings={settings}
              setSettings={setSettings}
            />
          )}

          {activeTab === 'suggestions' && (
            <SuggestionsTab 
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              suggestionsEnabled={suggestionsEnabled}
              setSuggestionsEnabled={setSuggestionsEnabled}
            />
          )}
        </div>

        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};