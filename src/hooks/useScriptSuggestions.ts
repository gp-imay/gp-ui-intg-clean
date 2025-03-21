import { useState, useEffect, useCallback } from 'react';
import { ElementType, DEFAULT_SUGGESTIONS, parseSceneHeading, SceneSuggestions } from '../types/screenplay';

interface Suggestion {
  id: string;
  text: string;
  description?: string;
}

export const useScriptSuggestions = (
  type: ElementType,
  content: string,
  cursorPosition: number,
  elements: { type: ElementType; content: string }[],
  hasTextSelection: boolean,
  customSuggestions?: SceneSuggestions
) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<SceneSuggestions>(customSuggestions || DEFAULT_SUGGESTIONS);
  const [hasUsedElements, setHasUsedElements] = useState({
    locations: { INT: false, EXT: false },
    times: false,
    characters: false
  });
  const [lastProcessedCursor, setLastProcessedCursor] = useState<number>(-1);
  const [lastProcessedContent, setLastProcessedContent] = useState<string>('');
  const [lastProcessedType, setLastProcessedType] = useState<ElementType | null>(null);
  const [suggestionJustSelected, setSuggestionJustSelected] = useState(false);

  // Helper function to create a suggestion with unique ID
  const createSuggestion = (text: string, description?: string): Suggestion => ({
    id: `${text}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    description
  });

  // Helper function to strip HTML tags from content
  const stripHtml = (html: string): string => {
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  // Get characters used in the current scene
  const getUsedCharactersInCurrentScene = useCallback(() => {
    const usedCharacters = new Set<string>();
    let currentSceneStartIndex = -1;

    // Find the start of the current scene
    for (let i = elements.length - 1; i >= 0; i--) {
      if (elements[i].type === 'scene-heading') {
        currentSceneStartIndex = i;
        break;
      }
    }

    // If we found a scene heading, collect all characters after it
    if (currentSceneStartIndex !== -1) {
      for (let i = currentSceneStartIndex; i < elements.length; i++) {
        if (elements[i].type === 'character') {
          const characterName = stripHtml(elements[i].content).trim().toUpperCase();
          if (characterName) {
            usedCharacters.add(characterName);
          }
        }
      }
    }

    return usedCharacters;
  }, [elements]);

  const navigateSuggestions = useCallback((direction: 'up' | 'down') => {
    if (!suggestions.length) return;
    
    setSelectedIndex(prev => {
      if (direction === 'down') {
        return (prev + 1) % suggestions.length;
      } else {
        return prev > 0 ? prev - 1 : suggestions.length - 1;
      }
    });
  }, [suggestions.length]);

  const resetSuggestions = useCallback(() => {
    setIsVisible(false);
    setSelectedIndex(0);
    setSuggestions([]);
    // Force a cursor position change to prevent immediate reappearance
    setLastProcessedCursor(-1);
    setLastProcessedContent('');
  }, []);

  const markSuggestionSelected = useCallback(() => {
    setSuggestionJustSelected(true);
    resetSuggestions();
  }, [resetSuggestions]);

  // Always return empty suggestions since we're disabling them
  return {
    suggestions: [],
    selectedIndex: 0,
    isVisible: false,
    navigateSuggestions,
    resetSuggestions,
    setSelectedIndex,
    markSuggestionSelected
  };
};