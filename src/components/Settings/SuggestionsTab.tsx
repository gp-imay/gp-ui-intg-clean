import React from 'react';
import { Lightbulb, ToggleLeft, ToggleRight } from 'lucide-react';
import { SceneSuggestions } from '../../types/screenplay';
import { AIFeatureToggle } from './AIFeatureToggle';

interface SuggestionsTabProps {
  suggestions: SceneSuggestions;
  setSuggestions: (suggestions: SceneSuggestions) => void;
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: (enabled: boolean) => void;
}

export const SuggestionsTab: React.FC<SuggestionsTabProps> = ({
  suggestions,
  setSuggestions,
  suggestionsEnabled,
  setSuggestionsEnabled
}) => {
  // These would be actual state variables in a real implementation
  const [writingSuggestions, setWritingSuggestions] = React.useState(true);
  const [sceneAnalysis, setSceneAnalysis] = React.useState(true);
  const [characterConsistency, setCharacterConsistency] = React.useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">AI Features</h3>
          <button
            onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 ${
              suggestionsEnabled 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <span className="text-sm font-medium">AI {suggestionsEnabled ? 'On' : 'Off'}</span>
            {suggestionsEnabled ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {!suggestionsEnabled ? (
          <AIDisabledState onEnable={() => setSuggestionsEnabled(true)} />
        ) : (
          <AIEnabledState 
            onDisable={() => setSuggestionsEnabled(false)}
            features={[
              {
                id: 'writing',
                label: 'Writing Suggestions',
                description: 'Get real-time suggestions as you write',
                enabled: writingSuggestions,
                onChange: setWritingSuggestions
              },
              {
                id: 'scene',
                label: 'Scene Analysis',
                description: 'Get feedback on scene structure and pacing',
                enabled: sceneAnalysis,
                onChange: setSceneAnalysis
              },
              {
                id: 'character',
                label: 'Character Consistency',
                description: 'Track and maintain consistent character voices',
                enabled: characterConsistency,
                onChange: setCharacterConsistency
              }
            ]}
          />
        )}
      </div>
    </div>
  );
};

interface AIDisabledStateProps {
  onEnable: () => void;
}

const AIDisabledState: React.FC<AIDisabledStateProps> = ({ onEnable }) => {
  return (
    <>
      <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <div className="flex items-start">
          <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700">
              AI features are currently disabled. Enable them to get writing suggestions, scene improvements, and more.
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center justify-center text-center">
        <Lightbulb className="w-12 h-12 text-gray-300 mb-3" />
        <h4 className="text-lg font-medium text-gray-500 mb-2">AI Features Disabled</h4>
        <p className="text-sm text-gray-500 max-w-md mb-4">
          Enable AI features to get writing suggestions, scene improvements, and more as you write your screenplay.
        </p>
        <button
          onClick={onEnable}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Enable AI Features
        </button>
      </div>
    </>
  );
};

interface AIFeature {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

interface AIEnabledStateProps {
  onDisable: () => void;
  features: AIFeature[];
}

const AIEnabledState: React.FC<AIEnabledStateProps> = ({ onDisable, features }) => {
  return (
    <>
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700">
              AI features are enabled. You'll receive writing suggestions and can use AI tools to improve your screenplay.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">AI Settings</h4>
          
          <div className="space-y-4">
            {features.map(feature => (
              <AIFeatureToggle
                key={feature.id}
                label={feature.label}
                description={feature.description}
                enabled={feature.enabled}
                onChange={feature.onChange}
              />
            ))}
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-end">
            <button
              onClick={onDisable}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Disable All AI Features
            </button>
          </div>
        </div>
      </div>
    </>
  );
};