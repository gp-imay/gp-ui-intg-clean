// src/components/ScriptEditor/index.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ScriptEmptyState } from './ScriptEmptyState';
import { ScriptContentLoader } from './ScriptContentLoader';
import { ScrollPositionManager } from './ScrollPositionManager';
import { MemoizedScriptElement } from './MemoizedScriptElement';
import { Header } from '../Header';
import { LeftSidebar } from '../LeftSidebar';
import { RightSidebar } from '../RightSidebar';
import { TitlePageModal } from '../TitlePageModal';
import { SettingsModal } from '../Settings';
import { BeatSheetView } from '../BeatSheet/BeatSheetView';
import { useAlert } from '../Alert';
import { GenerateNextSceneButton } from '../GenerateNextSceneButton';
import { api, mapApiResponseToScriptMetadata } from '../../services/api';
import { useParams } from 'react-router-dom';
import { ExpandComponentResponse, ExpansionType } from '../../services/api';


import {
  ViewMode,
  SidebarTab,
  TitlePage,
  ElementType,
  ScriptElement as ScriptElementType,
  getNextElementType,
  Comment,
  FormatSettings,
  DEFAULT_FORMAT_SETTINGS,
  SceneSuggestions,
  DEFAULT_SUGGESTIONS,
  UserProfile,
  DEFAULT_USER_PROFILES,
  ScriptStateValues,
  AIActionType,
  ScriptMetadata,
  NewSegment,
  ComponentTypeFE,
  ScriptChangesRequest,
  ComponentChange,
  NewComponentForExistingSegment,
  NewComponentForSegment
} from '../../types/screenplay';
import { AccountSettingsModal } from '../Dashboard/AccountSettingsModal';
import { useAuth } from '../../contexts/AuthContext';

interface ScriptEditorProps {
  scriptId: string;
  initialViewMode?: ViewMode;
  scriptState: ScriptStateValues;
}

const DEFAULT_SEGMENT_POSITION_INCREMENT = 1000;
const DEFAULT_COMPONENT_POSITION_INCREMENT = 1000;
const UNSAVED_REMINDER_INTERVAL = 5 * 60 * 1000; // 5 minutes for a less intrusive reminder

export function ScriptEditor({ scriptId, initialViewMode = 'script', scriptState }: ScriptEditorProps) {
  const loadedScriptIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState('Untitled Screenplay');
  
  const generateTemporaryId = (prefix: 'el' | 'seg'): string => {
    return `temp-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };
  
  const generateFrontendElementId = () => `fe-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;


  const [elements, setElements] = useState<ScriptElementType[]>([
    { 
      id: generateFrontendElementId(), 
      type: 'scene-heading', 
      content: '', 
      componentId: generateTemporaryId('el'), 
      sceneSegmentId: generateTemporaryId('seg'),
      segmentPosition: DEFAULT_SEGMENT_POSITION_INCREMENT, 
      position: DEFAULT_COMPONENT_POSITION_INCREMENT, 
      isNew: true 
    }
  ]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveCycle, setSaveCycle] = useState(0);
  const [selectedElement, setSelectedElement] = useState(elements[0]?.id || '');
  const initialElementsRef = useRef<ScriptElementType[]>([]);

  const modifiedComponentIdsRef = useRef(new Set<string>());
  const deletedComponentIdsRef = useRef(new Set<string>()); 
  const deletedSegmentIdsRef = useRef(new Set<string>());   
  const loadedSegmentIdsRef = useRef<Set<string>>(new Set()); // Declaration for loadedSegmentIdsRef

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [hasOpenedAIAssistant, setHasOpenedAIAssistant] = useState(false);
  const [currentSceneSegmentId, setCurrentSceneSegmentId] = useState<string | null>(
    scriptState.context.currentSceneSegmentId || null
  );
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [isGeneratingNextScene, setIsGeneratingNextScene] = useState(false);
  const [isGeneratingFirstScene, setIsGeneratingFirstScene] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const { showAlert } = useAlert();
  const processedSceneIdsRef = useRef<Set<string>>(new Set());
  const [expansionResults, setExpansionResults] = useState<ExpandComponentResponse | null>(null);
  const [isLoadingExpansion, setIsLoadingExpansion] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);

  const [activeExpansionComponentId, setActiveExpansionComponentId] = useState<string | null>(null);
  const [activeExpansionActionType, setActiveExpansionActionType] = useState<AIActionType | null>(null);
  const [previousSidebarStates, setPreviousSidebarStates] = useState<{
    left: boolean;
    right: boolean;
  } | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [showTitlePageModal, setShowTitlePageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [titlePage, setTitlePage] = useState<TitlePage>({
    title: '', author: '', contact: '',
    date: new Date().toLocaleDateString(), draft: '1st Draft',
    copyright: `Copyright © ${new Date().getFullYear()}`,
  });
  const [formatSettings, setFormatSettings] = useState<FormatSettings>(DEFAULT_FORMAT_SETTINGS);
  const [suggestions, setSuggestions] = useState<SceneSuggestions>(DEFAULT_SUGGESTIONS);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(DEFAULT_USER_PROFILES);
  const [activeProfile, setActiveProfile] = useState<string>('user1');
  const [activeTab, setActiveTab] = useState<SidebarTab>('inputs');
  const [hasCompletedFirstScene, setHasCompletedFirstScene] = useState(
    scriptState.context.scenesCount > 0
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<{ [key: string]: React.RefObject<any> }>({});
  const [beatsAvailable, setBeatsAvailable] = useState(true);
  const [scriptMetadata, setScriptMetadata] = useState<ScriptMetadata | null>(null);
  const { user } = useAuth();
  const unsavedChangesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadCompleteRef = useRef(false);


  const isTemporaryId = (id: string | undefined): boolean => {
    return !!id && id.startsWith('temp-');
  };
  
  // useEffect(() => {
  //   console.log("Updating initialElementsRef. Current elements count:", elements.length, "Triggered by isLoadingScript or saveCycle or elements array change.");
  //   initialElementsRef.current = JSON.parse(JSON.stringify(elements)); 
  //   modifiedComponentIdsRef.current.clear();
  //   deletedComponentIdsRef.current.clear();
  //   deletedSegmentIdsRef.current.clear();
  //   setHasUnsavedChanges(false); 
  // }, [isLoadingScript, saveCycle, elements]); 

  useEffect(() => {
    // This effect is for resetting the 'baseline' for changes after an initial load or a successful save.

    // Check if initial loading is just finishing
    if (!isLoadingScript && !isInitialLoadCompleteRef.current) {
        console.log("Initial script load complete. Resetting change tracking state.");
        initialElementsRef.current = JSON.parse(JSON.stringify(elements));
        modifiedComponentIdsRef.current.clear();
        deletedComponentIdsRef.current.clear();
        deletedSegmentIdsRef.current.clear();
        setHasUnsavedChanges(false);
        isInitialLoadCompleteRef.current = true; // Mark initial load as complete
    } else if (saveCycle > 0 && !isLoadingScript && isInitialLoadCompleteRef.current) {
        // This condition checks if saveCycle has incremented (meaning a save occurred)
        // and we are not in a loading state.
        // We also check isInitialLoadCompleteRef to ensure this only runs after initial load.
        console.log("Save cycle incremented. Resetting change tracking state post-save.");
        initialElementsRef.current = JSON.parse(JSON.stringify(elements));
        modifiedComponentIdsRef.current.clear();
        deletedComponentIdsRef.current.clear();
        deletedSegmentIdsRef.current.clear();
        setHasUnsavedChanges(false);
    }
}, [isLoadingScript, saveCycle, elements]); // `elements` is needed to correctly snapshot initialElementsRef after changes.
  // Effect for "beforeunload" prompt
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Effect for periodic unsaved changes reminder
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (unsavedChangesTimerRef.current) {
        clearTimeout(unsavedChangesTimerRef.current);
      }
      unsavedChangesTimerRef.current = setTimeout(() => {
        showAlert('info', 'You have unsaved changes. Remember to save your work!');
      }, UNSAVED_REMINDER_INTERVAL);
    } else {
      if (unsavedChangesTimerRef.current) {
        clearTimeout(unsavedChangesTimerRef.current);
        unsavedChangesTimerRef.current = null;
      }
    }
    return () => {
      if (unsavedChangesTimerRef.current) {
        clearTimeout(unsavedChangesTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, showAlert]);


  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === 'beats' && !beatsAvailable) {
      showAlert('info', 'AI beats are not available for manually created scripts. You can still switch to the beats view to see this message.');
    }
    if (mode === 'beats' && viewMode !== 'beats') {
      setPreviousSidebarStates({ left: isLeftSidebarOpen, right: isRightSidebarOpen });
      setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false);
    } else if (mode !== 'beats' && viewMode === 'beats' && previousSidebarStates) {
      setIsLeftSidebarOpen(previousSidebarStates.left); setIsRightSidebarOpen(previousSidebarStates.right);
    }
    setViewMode(mode);
  };

  useEffect(() => {
    setBeatsAvailable(scriptState.context.creationMethod === 'WITH_AI');
  }, [scriptState.context.creationMethod]);

  useEffect(() => {
    if (currentSceneSegmentId && !isLoadingScript && !processedSceneIdsRef.current.has(currentSceneSegmentId)) {
      processedSceneIdsRef.current.add(currentSceneSegmentId);
      scriptState.actions.generateFirstScene();
    }
  }, [currentSceneSegmentId, scriptState.actions, isLoadingScript]);

  useEffect(() => {
    if (!scriptId || hasAttemptedLoad) {
      if (isLoadingScript) setIsLoadingScript(false);
      return;
    }
    loadedScriptIdRef.current = scriptId;

    async function initializeEditor() {
      setIsLoadingScript(true); setLoadError(null);
      try {
        const metadata = await api.getScriptMetadata(scriptId);
        setTitle(metadata.title || `Script ${scriptId.slice(0, 8)}`);
        const mappedMeta = mapApiResponseToScriptMetadata(metadata);
        setScriptMetadata(mappedMeta); 
        setBeatsAvailable(mappedMeta.creationMethod === 'WITH_AI');

        const initialSegmentsResponse = await api.getScriptSegments(scriptId, 0, 20);
        if (initialSegmentsResponse && initialSegmentsResponse.segments.length > 0) {
          // IMPORTANT: Ensure api.ts's convertSegmentsToScriptElements accepts and uses generateFrontendElementId
          // If it does not, this call will cause a TypeScript error.
          // You MUST update api.ts for this to work as intended for unique frontend keys.
          const fetchedElements = api.convertSegmentsToScriptElements(initialSegmentsResponse.segments, [], generateFrontendElementId);
          const processedElements = fetchedElements.map(el => ({ ...el, isNew: false }));
          setElements(processedElements); 
          if (processedElements.length > 0) {
            setSelectedElement(processedElements[0].id);
            const lastSegment = initialSegmentsResponse.segments[initialSegmentsResponse.segments.length - 1];
            if (lastSegment?.id) setCurrentSceneSegmentId(lastSegment.id);
          }
        } else if (metadata.creation_method === 'FROM_SCRATCH') {
          const tempSegId = generateTemporaryId('seg');
          const tempCompId = generateTemporaryId('el'); 
          const initialElement: ScriptElementType = {
            id: generateFrontendElementId(), 
            type: 'scene-heading', content: '', componentId: tempCompId,
            sceneSegmentId: tempSegId, segmentPosition: DEFAULT_SEGMENT_POSITION_INCREMENT,
            position: DEFAULT_COMPONENT_POSITION_INCREMENT, isNew: true
          };
          setElements([initialElement]);
          setSelectedElement(initialElement.id);
        } else {
          setElements([]); 
        }
        if (scriptState.context.scenesCount > 0) setHasCompletedFirstScene(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load script';
        setLoadError(message); showAlert('error', message); setElements([]);
      } finally {
        setIsLoadingScript(false); setHasAttemptedLoad(true);
      }
    }
    initializeEditor();
  }, [scriptId, showAlert, hasAttemptedLoad, scriptState.context.scenesCount]);

  const handleGeneratedScriptElements = (generatedElements: ScriptElementType[], sceneSegmentId: string) => {
    setCurrentSceneSegmentId(sceneSegmentId);
    loadedSegmentIdsRef.current.add(sceneSegmentId); // Use the correctly declared ref
    const processedGeneratedElements = generatedElements.map(el => ({
      ...el, isNew: false, id: generateFrontendElementId() 
    }));
    const isEditorEffectivelyEmpty = elements.length === 0 ||
      (elements.length === 1 && elements[0].type === 'scene-heading' && elements[0].content === '' && isTemporaryId(elements[0].sceneSegmentId));
    let finalElementsToSet: ScriptElementType[];
    if (isEditorEffectivelyEmpty) {
      finalElementsToSet = processedGeneratedElements;
    } else {
      const existingComponentIds = new Set(elements.map(e => e.componentId));
      const uniqueNewElements = processedGeneratedElements.filter(ne => !existingComponentIds.has(ne.componentId));
      const combined = [...elements, ...uniqueNewElements];
      const segmentGroups = new Map<string, ScriptElementType[]>();
      combined.forEach(element => {
        const segId = element.sceneSegmentId || `unsegmented-${element.id}`;
        if (!segmentGroups.has(segId)) segmentGroups.set(segId, []);
        segmentGroups.get(segId)?.push(element);
      });
      const sortedSegmentIds = Array.from(segmentGroups.keys()).sort((a, b) => {
        const aPos = segmentGroups.get(a)?.[0]?.segmentPosition ?? Infinity;
        const bPos = segmentGroups.get(b)?.[0]?.segmentPosition ?? Infinity;
        return aPos - bPos;
      });
      finalElementsToSet = [];
      sortedSegmentIds.forEach(sId => {
        const segmentElems = segmentGroups.get(sId) || [];
        segmentElems.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        finalElementsToSet.push(...segmentElems);
      });
    }
    setElements(finalElementsToSet); 
    if (processedGeneratedElements.length > 0) setSelectedElement(processedGeneratedElements[0].id);
    setHasCompletedFirstScene(true); setActiveTab('scenes'); setHasUnsavedChanges(false); 
  };

  const handleChangeDisplayName = () => showAlert('info', 'Change display name functionality coming soon.');
  const handleChangeEmail = () => showAlert('info', 'Change email functionality coming soon.');

  const handleGenerateNextScene = async () => {
    if (!scriptId) { showAlert('error', 'Script ID is missing'); return; }
    try {
      setIsGeneratingNextScene(true);
      const result = await api.generateNextScene(scriptId, currentSceneSegmentId || '');
      if (result.success && result.generated_segment?.components) {
        setCurrentSceneSegmentId(result.scene_segment_id || null);
        const newApiElements = api.convertSceneComponentsToElements(result.generated_segment.components)
            .map(el => ({ ...el, isNew: false }));
        setElements(prev => [...prev, ...newApiElements]);
        if (newApiElements.length > 0) setSelectedElement(newApiElements[0].id);
        showAlert('success', 'Next scene generated successfully'); setHasUnsavedChanges(false);
      } else { throw new Error(result.error || 'No script components were generated or operation failed'); }
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate next scene');
    } finally { setIsGeneratingNextScene(false); }
  };

  const handleGenerateScript = async () => {
    if (!scriptId) { showAlert('error', 'Script ID is missing'); return; }
    try {
      setIsGeneratingFirstScene(true);
      const result = await api.generateScript(scriptId);
      if (result.success && result.generated_segment?.components) {
        setCurrentSceneSegmentId(result.scene_segment_id || null);
        const scriptApiElements = api.convertSceneComponentsToElements(result.generated_segment.components)
            .map(el => ({ ...el, isNew: false }));
        setElements(scriptApiElements);
        if (scriptApiElements.length > 0) setSelectedElement(scriptApiElements[0].id);
        setHasCompletedFirstScene(true); setActiveTab('scenes'); handleViewModeChange('script');
        showAlert('success', 'Script generated successfully'); setHasUnsavedChanges(false);
      } else { throw new Error(result.error || 'No script components were generated or operation failed'); }
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate script');
    } finally { setIsGeneratingFirstScene(false); }
  };
  
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };
  const getSceneText = (content: string) => stripHtml(content).trim();

  const elementsRef = useRef(elements);
  useEffect(() => {
      elementsRef.current = elements;
  }, [elements]);

  const createNewElement = useCallback((type: ElementType, afterId: string): string => {
    const currentElements = elementsRef.current; 
    const afterElementIndex = currentElements.findIndex(el => el.id === afterId);
    const afterElement = afterElementIndex !== -1 ? currentElements[afterElementIndex] : currentElements[currentElements.length - 1];

    if (!afterElement && currentElements.length > 0) {
        const newIdFallback = generateFrontendElementId();
        const fallbackElement: ScriptElementType = {
            id: newIdFallback, componentId: generateTemporaryId('el'), type, content: '',
            sceneSegmentId: currentElements[0]?.sceneSegmentId || generateTemporaryId('seg'),
            segmentPosition: currentElements[0]?.segmentPosition || DEFAULT_SEGMENT_POSITION_INCREMENT,
            position: (currentElements[currentElements.length -1]?.position || 0) + DEFAULT_COMPONENT_POSITION_INCREMENT, isNew: true,
        };
        setElements(prev => [...prev, fallbackElement]);
        setHasUnsavedChanges(true);
        return newIdFallback;
    } else if (!afterElement && currentElements.length === 0) {
        const newId = generateFrontendElementId();
        const firstElement: ScriptElementType = {
            id: newId, componentId: generateTemporaryId('el'), type: type, content: '',
            sceneSegmentId: generateTemporaryId('seg'),
            segmentPosition: DEFAULT_SEGMENT_POSITION_INCREMENT,
            position: DEFAULT_COMPONENT_POSITION_INCREMENT, isNew: true,
        };
        setElements([firstElement]);
        setHasUnsavedChanges(true);
        return newId;
    }

    const newFeId = generateFrontendElementId();
    const newTempComponentId = generateTemporaryId('el');
    let newSceneSegmentId = afterElement.sceneSegmentId;
    let newSegmentPosition = afterElement.segmentPosition;
    let newComponentPosition: number;

    if (type === 'scene-heading') {
      newSceneSegmentId = generateTemporaryId('seg'); // Keep this for the new segment's temporary ID

      // Assign a Unix timestamp (milliseconds since epoch) as the segment position.
      // This ensures uniqueness and a natural sort order for new segments.
      newSegmentPosition = Date.now(); 

      // The first component (the scene heading itself) in a new segment can still start at a default position.
      newComponentPosition = DEFAULT_COMPONENT_POSITION_INCREMENT; // This is for components *within* the segment

    } else {
      // Logic for other element types (components within an existing segment)
      // This part should use the logic for component positioning we discussed previously.
      let segmentLeader = afterElement;
      if (afterElement.type !== 'scene-heading') {
        // Find the actual scene heading this component belongs to
        const afterElementIndexInCurrent = currentElements.findIndex(el => el.id === afterId);
        for (let i = afterElementIndexInCurrent -1; i >=0; i--) {
            if (currentElements[i].type === 'scene-heading') {
                segmentLeader = currentElements[i]; 
                break;
            }
        }
      }
      newSceneSegmentId = segmentLeader.sceneSegmentId;
      // Important: The newSegmentPosition for a non-scene-heading element
      // should be the segmentPosition of its parent scene heading.
      newSegmentPosition = segmentLeader.segmentPosition; 

      const elementsInSameSegment = currentElements.filter(el => el.sceneSegmentId === newSceneSegmentId);
      const maxComponentPosInSegment = elementsInSameSegment.reduce((max, el) => Math.max(max, el.position || 0), 0);
      newComponentPosition = (maxComponentPosInSegment || 0) + DEFAULT_COMPONENT_POSITION_INCREMENT;
    }

    const newElement: ScriptElementType = {
      id: newFeId, componentId: newTempComponentId, type, content: '',
      sceneSegmentId: newSceneSegmentId, position: newComponentPosition,
      segmentPosition: newSegmentPosition, isNew: true
    };

    setElements(prev => {
      const currentAfterIdx = prev.findIndex(el => el.id === afterId);
      if (currentAfterIdx === -1) return [...prev, newElement];
      const newArray = [...prev];
      newArray.splice(currentAfterIdx + 1, 0, newElement);
      return newArray;
    });
    setHasUnsavedChanges(true);
    return newFeId;
  }, []); 

  const handleNavigateElement = useCallback((currentId: string, direction: 'up' | 'down') => {
    const currentElements = elementsRef.current;
    const currentIndex = currentElements.findIndex(el => el.id === currentId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex >= 0 && targetIndex < currentElements.length) {
      setSelectedElement(currentElements[targetIndex].id);
    }
  }, []);

  const handleElementChange = (id: string, content: string) => {
    setElements(prev =>
      prev.map(el => {
        if (el.id === id) {
          const contentChanged = el.content !== content;
          if (contentChanged) {
            if (!isTemporaryId(el.componentId) && el.componentId) {
              modifiedComponentIdsRef.current.add(el.componentId);
            }
            setHasUnsavedChanges(true);
          }
          return { ...el, content, isNew: el.isNew || (isTemporaryId(el.componentId) && contentChanged) };
        }
        return el;
      })
    );
  };

  const handleKeyDown = useCallback((
    event: React.KeyboardEvent,
    id: string,
    splitData?: { beforeContent: string; afterContent: string },
    options?: { mergeUp?: boolean }
  ) => {
    const currentElements = elementsRef.current;
    const currentIndex = currentElements.findIndex(el => el.id === id);
    if (currentIndex === -1) return;
    const currentElement = currentElements[currentIndex];

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (currentElement.type === 'scene-heading' && stripHtml(currentElement.content).trim() !== '' && !hasCompletedFirstScene) {
        setHasCompletedFirstScene(true); setActiveTab('scenes');
      }
      const nextType = currentElement.type === 'action' ? 'action' : getNextElementType(currentElement.type);
      let newElementId: string | null = null;
      if (splitData) {
        setElements(prevElements => {
          const updatedElements = [...prevElements];
          const currentIdx = updatedElements.findIndex(el => el.id === id);
          if (currentIdx === -1) return prevElements;
          const originalElement = updatedElements[currentIdx];
          updatedElements[currentIdx] = { ...originalElement, content: splitData.beforeContent, isNew: originalElement.isNew || (isTemporaryId(originalElement.componentId) && originalElement.content !== splitData.beforeContent) };
          if (!isTemporaryId(originalElement.componentId) && originalElement.componentId && originalElement.content !== splitData.beforeContent) {
            modifiedComponentIdsRef.current.add(originalElement.componentId);
          }
          return updatedElements;
        });
        newElementId = createNewElement(nextType, id);
        setElements(prevElements => {
            const finalElements = [...prevElements];
            const finalNewElementIndex = finalElements.findIndex(el => el.id === newElementId);
            if(finalNewElementIndex !== -1) finalElements[finalNewElementIndex] = {...finalElements[finalNewElementIndex], content: splitData.afterContent };
            return finalElements;
        });
      } else {
        newElementId = createNewElement(nextType, id);
      }
      if (newElementId) setSelectedElement(newElementId);
      setHasUnsavedChanges(true);
    } else if (event.key === 'Backspace' && options?.mergeUp) {
      event.preventDefault();
      if (currentIndex > 0) {
        const previousElement = currentElements[currentIndex - 1];
        if (!isTemporaryId(currentElement.componentId) && currentElement.componentId) {
          deletedComponentIdsRef.current.add(currentElement.componentId);
          if (currentElement.type === 'scene-heading' && !isTemporaryId(currentElement.sceneSegmentId) && currentElement.sceneSegmentId) {
            deletedSegmentIdsRef.current.add(currentElement.sceneSegmentId);
          }
        }
        setElements(prev => prev.filter(el => el.id !== id));
        setSelectedElement(previousElement.id);
        requestAnimationFrame(() => elementRefs.current[previousElement.id]?.current?.focusEditorEnd());
        setHasUnsavedChanges(true);
      }
    } else if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const nextType = getNextElementType(currentElement.type);
      const newId = createNewElement(nextType, id);
      setSelectedElement(newId);
      setHasUnsavedChanges(true);
    }
  }, [hasCompletedFirstScene, createNewElement, setActiveTab, getNextElementType, setHasUnsavedChanges]);
  
  const mapElementTypeToComponentType = (elementType: ElementType): ComponentTypeFE => {
    switch (elementType) {
      case 'scene-heading': return ComponentTypeFE.HEADING;
      case 'action': return ComponentTypeFE.ACTION;
      case 'character': return ComponentTypeFE.CHARACTER;
      case 'dialogue': return ComponentTypeFE.DIALOGUE;
      case 'parenthetical': return ComponentTypeFE.PARENTHETICAL;
      case 'transition': return ComponentTypeFE.TRANSITION;
      default: console.warn(`Unknown element type: ${elementType}`); return ComponentTypeFE.ACTION;
    }
  };

  const generateSavePayload = (): ScriptChangesRequest => {
    const currentElements = elementsRef.current;
    const payload: ScriptChangesRequest = {
        changedSegments: {},
        deletedElements: Array.from(deletedComponentIdsRef.current).filter(id => !isTemporaryId(id)),
        deletedSegments: Array.from(deletedSegmentIdsRef.current).filter(id => !isTemporaryId(id)),
        newSegments: [],
        newComponentsInExistingSegments: []
    };

    const segmentMap = new Map<string, ScriptElementType[]>();
    currentElements.forEach(el => {
        const segId = el.sceneSegmentId || generateTemporaryId('seg'); 
        if (!segmentMap.has(segId)) segmentMap.set(segId, []);
        segmentMap.get(segId)!.push({
            ...el,
            position: typeof el.position === 'number' ? el.position : Date.now(),
            segmentPosition: typeof el.segmentPosition === 'number' ? el.segmentPosition : Date.now(),
        });
    });

    segmentMap.forEach((segmentElementsFromMap, segmentId) => {
        segmentElementsFromMap.sort((a, b) => (a.position || 0) - (b.position || 0));
        const apiComponentsForSegment: (Omit<ComponentChange, 'id'> & { id?: string, frontendId?: string } | Omit<NewComponentForSegment, 'frontendId'> & { frontendId: string } | Omit<NewComponentForExistingSegment, 'frontendId' | 'segment_id'> & { frontendId: string, segment_id: string })[] = [];
        let i = 0;
        while (i < segmentElementsFromMap.length) {
            const el = segmentElementsFromMap[i];
            let charName: string | undefined = undefined;
            let parenText: string | undefined = undefined;

            if (el.type === 'character') {
                charName = stripHtml(el.content);
                let dialogueEl: ScriptElementType | undefined = undefined;
                let parenEl: ScriptElementType | undefined = undefined;
                if (i + 1 < segmentElementsFromMap.length) {
                    if (segmentElementsFromMap[i+1].type === 'parenthetical') {
                        parenEl = segmentElementsFromMap[i+1];
                        parenText = stripHtml(parenEl.content.replace(/^\(|\)$/g, ''));
                        if (i + 2 < segmentElementsFromMap.length && segmentElementsFromMap[i+2].type === 'dialogue') {
                            dialogueEl = segmentElementsFromMap[i+2];
                        }
                    } else if (segmentElementsFromMap[i+1].type === 'dialogue') {
                        dialogueEl = segmentElementsFromMap[i+1];
                    }
                }
                if (dialogueEl) { 
                    const isNew = el.isNew || isTemporaryId(el.componentId) || (parenEl && (parenEl.isNew || isTemporaryId(parenEl.componentId))) || (dialogueEl.isNew || isTemporaryId(dialogueEl.componentId));
                    const baseCompId = dialogueEl.componentId; 
                    const apiCompToAdd = {
                        component_type: ComponentTypeFE.DIALOGUE,
                        position: el.position!, 
                        content: stripHtml(dialogueEl.content),
                        character_name: charName,
                        parenthetical: parenText,
                        ...(isNew || isTemporaryId(baseCompId) ? { frontendId: baseCompId } : { id: baseCompId })
                    };
                    apiComponentsForSegment.push(apiCompToAdd);
                    if(!isTemporaryId(el.componentId)) modifiedComponentIdsRef.current.delete(el.componentId);
                    if(parenEl && !isTemporaryId(parenEl.componentId)) modifiedComponentIdsRef.current.delete(parenEl.componentId);
                    i += (parenEl ? 2 : 1); 
                } else { 
                     apiComponentsForSegment.push({
                        component_type: mapElementTypeToComponentType(el.type),
                        position: el.position!, content: stripHtml(el.content),
                        character_name: charName,
                        ...(el.isNew || isTemporaryId(el.componentId) ? { frontendId: el.componentId } : { id: el.componentId })
                    });
                }
            } else { 
                 apiComponentsForSegment.push({
                    component_type: mapElementTypeToComponentType(el.type),
                    position: el.position!, content: stripHtml(el.content),
                    ...(el.isNew || isTemporaryId(el.componentId) ? { frontendId: el.componentId } : { id: el.componentId })
                });
            }
            i++;
        }
        
        if (isTemporaryId(segmentId)) {
            const firstElement = segmentElementsFromMap[0];
            if (!firstElement || apiComponentsForSegment.length === 0) return;
            payload.newSegments.push({
                frontendId: segmentId,
                segmentNumber: Date.now(),
                components: apiComponentsForSegment.filter(c => c.frontendId).map(c => ({...c, component_type: c.component_type as ComponentTypeFE } as NewComponentForSegment))
            });
        } else { 
            apiComponentsForSegment.forEach(apiComp => {
                if (apiComp.frontendId) { 
                    payload.newComponentsInExistingSegments.push({
                        ...(apiComp as NewComponentForSegment), segment_id: segmentId,
                    });
                } else if (apiComp.id && modifiedComponentIdsRef.current.has(apiComp.id)) { 
                    if (!payload.changedSegments[segmentId]) payload.changedSegments[segmentId] = [];
                    payload.changedSegments[segmentId].push(apiComp as ComponentChange);
                }
            });
        }
    });
    console.log("Generated Save Payload:", JSON.stringify(payload, null, 2));
    return payload;
  };

  const handleSave = async () => {
    if (!scriptId) { showAlert('error', 'Script ID is missing. Cannot save.'); return; }
    const hasAnyChanges = elementsRef.current.some(el => el.isNew) ||
                         modifiedComponentIdsRef.current.size > 0 ||
                         deletedComponentIdsRef.current.size > 0 ||
                         deletedSegmentIdsRef.current.size > 0;
    if (!hasAnyChanges && !hasUnsavedChanges) { showAlert('info', 'No changes to save.'); return; }

    setIsSaving(true);
    try {
      const payload = generateSavePayload();
      if (Object.keys(payload.changedSegments).length === 0 && payload.deletedElements.length === 0 &&
          payload.deletedSegments.length === 0 && payload.newSegments.length === 0 &&
          payload.newComponentsInExistingSegments.length === 0) {
        showAlert('info', 'No effective changes to persist.');
        setHasUnsavedChanges(false); setIsSaving(false);
        setElements(prev => prev.map(el => ({ ...el, isNew: false })));
        setSaveCycle(prev => prev + 1); 
        return;
      }

      const response = await api.saveScriptChanges(scriptId, payload);
      if (response.success) {
        setElements(prevElements => prevElements.map(el => {
            let updatedEl = { ...el, isNew: false };
            if (isTemporaryId(el.sceneSegmentId) && response.idMappings.segments[el.sceneSegmentId!]) {
              updatedEl.sceneSegmentId = response.idMappings.segments[el.sceneSegmentId!];
            }
            const originalComponentIdForMapping = el.componentId; 
            if (isTemporaryId(originalComponentIdForMapping) && response.idMappings.components[originalComponentIdForMapping]) {
              updatedEl.componentId = response.idMappings.components[originalComponentIdForMapping];
            }
            return updatedEl;
          }).filter(el => el != null) 
        );
        modifiedComponentIdsRef.current.clear(); deletedComponentIdsRef.current.clear(); deletedSegmentIdsRef.current.clear();
        setHasUnsavedChanges(false);
        showAlert('success', response.message || 'Script saved successfully!');
        setSaveCycle(prev => prev + 1);
      } else { showAlert('error', response.message || 'Failed to save script changes.'); }
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'An unexpected error occurred during save.');
    } finally { setIsSaving(false); }
  };

  const handleTypeChange = useCallback(async (id: string, newType: ElementType) => {
    const currentElements = elementsRef.current;
    let newTempSegmentId: string | undefined = undefined;
    let newSegmentPosition: number | undefined = undefined;
    let originalComponentIdToDelete: string | undefined = undefined;
    let newFeComponentId: string = generateTemporaryId('el');

    const currentElement = currentElements.find(el => el.id === id);
    if (!currentElement) return;
    const oldType = currentElement.type;

    if (newType === 'scene-heading' && oldType !== 'scene-heading') {
        const maxSegmentPos = currentElements
            .filter(el => el.type === 'scene-heading' && typeof el.segmentPosition === 'number')
            .reduce((max, el) => Math.max(max, el.segmentPosition!), 0);
        newSegmentPosition = (maxSegmentPos || 0) + DEFAULT_SEGMENT_POSITION_INCREMENT;
        newTempSegmentId = generateTemporaryId('seg');
        if (!isTemporaryId(currentElement.componentId) && currentElement.componentId) {
             originalComponentIdToDelete = currentElement.componentId;
        }
    }

    setElements(prev =>
        prev.map(el => {
            if (el.id === id) {
                if (newType === 'scene-heading' && oldType !== 'scene-heading') {
                    return {
                        ...el, type: newType, sceneSegmentId: newTempSegmentId,
                        segmentPosition: newSegmentPosition, componentId: newFeComponentId,
                        position: DEFAULT_COMPONENT_POSITION_INCREMENT, isNew: true,
                        id: generateFrontendElementId() 
                    };
                } else {
                    const changingToNonHeadingFromHeading = oldType === 'scene-heading' && newType !== 'scene-heading';
                    let finalSegmentId = el.sceneSegmentId;
                    let finalSegmentPos = newType === 'scene-heading' ? el.segmentPosition : undefined;
                    if (changingToNonHeadingFromHeading) {
                        const currentElementIndex = prev.findIndex(pEl => pEl.id === el.id);
                        for (let i = currentElementIndex - 1; i >= 0; i--) {
                            if (prev[i].type === 'scene-heading') {
                                finalSegmentId = prev[i].sceneSegmentId; break;
                            }
                        }
                    }
                    if (!isTemporaryId(el.componentId) && el.componentId && oldType !== newType) {
                        modifiedComponentIdsRef.current.add(el.componentId);
                    }
                    return { ...el, type: newType, sceneSegmentId: finalSegmentId, segmentPosition: finalSegmentPos, isNew: el.isNew || (oldType !== newType) };
                }
            }
            return el;
        })
    );
    if (originalComponentIdToDelete) deletedComponentIdsRef.current.add(originalComponentIdToDelete);
    setHasUnsavedChanges(true);
  }, []); 

  const handleDeleteComment = (commentId: string) => { setComments(prev => prev.filter(c => c.id !== commentId)); setActiveCommentId(null); };
  const handleAddComment = (comment: Comment) => { setComments(prev => [...prev, comment]); setActiveCommentId(comment.id); };
  const handleCommentClick = (comment: Comment) => {
    const elementId = elementsRef.current.find(el => elementRefs.current[el.id]?.current?.containsCommentRange?.(comment.from, comment.to))?.id;
    if (elementId) { setSelectedElement(elementId); setActiveCommentId(comment.id); elementRefs.current[elementId].current?.focusCommentRange?.(comment.from, comment.to); }
  };

  const formatFountainContent = () => {
    const titlePg = `Title: ${titlePage.title}\nAuthor: ${titlePage.author}\nContact: ${titlePage.contact}\nDate: ${titlePage.date}\nDraft: ${titlePage.draft}\nCopyright: ${titlePage.copyright}\n\n===\n\n`;
    return titlePg + elementsRef.current.map(el => {
      const clean = stripHtml(el.content);
      switch (el.type) {
        case 'scene-heading': return `${clean.toUpperCase()}\n\n`;
        case 'action': return `${clean}\n\n`;
        case 'character': return `\t${clean.toUpperCase()}\n`;
        case 'parenthetical': return `\t(${clean.replace(/^\(|\)$/g, '')})\n`;
        case 'dialogue': return `\t${clean}\n\n`;
        case 'transition': return `> ${clean.toUpperCase()}${!clean.endsWith(':') ? ':' : ''}\n\n`;
        default: return `${clean}\n\n`;
      }
    }).join('');
  };

  const handleExport = () => {
    const content = formatFountainContent(); const blob = new Blob([content],{type:'text/plain'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=`${titlePage.title||'Untitled'}.fountain`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleAIAssistClick = () => {
    if (!suggestionsEnabled) setSuggestionsEnabled(true);
    if (!hasOpenedAIAssistant) { setIsRightSidebarOpen(true); setHasOpenedAIAssistant(true); }
  };

  const handleApplySuggestion = (content: string) => {
    if (selectedElement) {
      const currentElement = elementsRef.current.find(el => el.id === selectedElement);
      if (currentElement) {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          if (lines.length > 1) {
            handleElementChange(selectedElement, lines[0]); let lastId = selectedElement;
            for (let i = 1; i < lines.length; i++) {
              let newType: ElementType = 'action'; const line = lines[i].trim();
              if (line.toUpperCase() === line && !line.includes('.') && line.length > 0) newType = 'character';
              else if (line.startsWith('(') && line.endsWith(')')) newType = 'parenthetical';
              else if (i > 0 && lines[i - 1].toUpperCase() === lines[i - 1] && !lines[i - 1].includes('.')) newType = 'dialogue';
              else if (line.startsWith('INT.') || line.startsWith('EXT.') || line.includes(' - ')) newType = 'scene-heading';
              else if (line.toUpperCase() === line && line.includes('TO:')) newType = 'transition';
              lastId = createNewElement(newType, lastId); handleElementChange(lastId, line);
            } setSelectedElement(lastId);
          } else handleElementChange(selectedElement, content);
          setHasUnsavedChanges(true);
        }
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(formatSettings.elements).forEach(([type, format]) => {
      root.style.setProperty(`--${type}-alignment`, format.alignment); root.style.setProperty(`--${type}-width`, `${format.width}in`);
      root.style.setProperty(`--${type}-spacing-before`, `${format.spacingBefore}rem`); root.style.setProperty(`--${type}-spacing-after`, `${format.spacingAfter}rem`);
    });
    root.style.setProperty('--page-width', `${formatSettings.pageLayout.width}in`); root.style.setProperty('--page-height', `${formatSettings.pageLayout.height}in`);
    root.style.setProperty('--page-margin-top', `${formatSettings.pageLayout.marginTop}in`); root.style.setProperty('--page-margin-right', `${formatSettings.pageLayout.marginRight}in`);
    root.style.setProperty('--page-margin-bottom', `${formatSettings.pageLayout.marginBottom}in`); root.style.setProperty('--page-margin-left', `${formatSettings.pageLayout.marginLeft}in`);
  }, [formatSettings]);

  useEffect(() => {
    const handleKeyboardDelete = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        const elToDelete = elementsRef.current.find(el => el.id === selectedElement);
        if (elToDelete?.content === '' && !isTemporaryId(elToDelete.componentId) && elToDelete.componentId) {
          deletedComponentIdsRef.current.add(elToDelete.componentId);
          if (elToDelete.type === 'scene-heading' && !isTemporaryId(elToDelete.sceneSegmentId) && elToDelete.sceneSegmentId) {
            deletedSegmentIdsRef.current.add(elToDelete.sceneSegmentId);
          } setHasUnsavedChanges(true);
        }
      }
    };
    document.addEventListener('keydown', handleKeyboardDelete);
    return () => document.removeEventListener('keydown', handleKeyboardDelete);
  }, [selectedElement]); 

  useEffect(() => {
    const calculatePgs = () => {
      if (!contentRef.current) return; const pageH = formatSettings.pageLayout.height * 72;
      const breaks: number[] = []; let currentH = 0; const editorEls = contentRef.current.children;
      for (let i = 0; i < editorEls.length; i++) {
        const el = editorEls[i] as HTMLElement; const elH = el.offsetHeight;
        if (currentH + elH > pageH) { breaks.push(i); currentH = elH; } else { currentH += elH; }
      } setPages(breaks);
    }; calculatePgs(); const resObs = new ResizeObserver(calculatePgs);
    if (contentRef.current) resObs.observe(contentRef.current);
    return () => resObs.disconnect();
  }, [elements, formatSettings]); 

  useEffect(() => {
    elementsRef.current.forEach(element => { 
      if (!elementRefs.current[element.id]) elementRefs.current[element.id] = React.createRef();
    });
  }, [elements]); 

  useEffect(() => {
    const prof = userProfiles.find(p => p.id === activeProfile);
    if (prof) setFormatSettings(prof.preferences.formatSettings);
  }, [activeProfile, userProfiles]);

  useEffect(() => {
    if (!suggestionsEnabled && isRightSidebarOpen) setIsRightSidebarOpen(false);
  }, [suggestionsEnabled, isRightSidebarOpen]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (scriptId) {
        try {
          const meta = await api.getScriptMetadata(scriptId);
          setScriptMetadata(mapApiResponseToScriptMetadata(meta));
          setTitle(meta.title || `Script ${scriptId.slice(0, 8)}`);
        } catch (err) { console.error("Error fetching metadata:", err); }
      }
    };
    if (scriptId && !hasAttemptedLoad) fetchMeta();
  }, [scriptId, hasAttemptedLoad]);

  useEffect(() => {
    setTitlePage(prev => ({ ...prev, title: (scriptMetadata?.title || 'UNTITLED SCRIPT').toUpperCase(), author: user?.user_metadata?.full_name || user?.email || '' }));
  }, [scriptMetadata, user]);

  const handleRetry = () => { setHasAttemptedLoad(false); setLoadError(null); loadedScriptIdRef.current = null; };

  const handleRequestExpansion = async (componentIdToExpand: string, actionType: AIActionType) => {
    if (!componentIdToExpand) {
      showAlert('error', 'Cannot perform AI action: Missing component ID.');
      setIsRightSidebarOpen(false); 
      return;
    }
    const targetElement = elementsRef.current.find(el => el.componentId === componentIdToExpand);
    if ((targetElement && targetElement.isNew) || isTemporaryId(componentIdToExpand) || hasUnsavedChanges) {
      showAlert('warning', 'Please save your script before using AI actions to ensure all content is processed.');
      setIsRightSidebarOpen(false); 
      return;
    }
    console.log("Requesting AI action for:", componentIdToExpand, "Action:", actionType);
    try {
      setIsLoadingExpansion(true); setIsRightSidebarOpen(true); 
      setExpansionResults(null); setActiveExpansionComponentId(null); setActiveExpansionActionType(null);
      let results: ExpandComponentResponse | null = null;
      if (actionType === "expand") results = await api.expandComponent(componentIdToExpand);
      else if (actionType === "shorten") results = await api.shortenComponent(componentIdToExpand);
      else if (actionType === "continue") results = await api.continueComponent(componentIdToExpand);
      else if (actionType === "rewrite") results = await api.rewriteComponent(componentIdToExpand);
      if (results) { setExpansionResults(results); setActiveExpansionComponentId(componentIdToExpand); setActiveExpansionActionType(actionType); } 
      else { showAlert('info', `AI action '${actionType}' did not return specific suggestions for this content.`); }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform AI action.';
      if (errorMessage.includes("Invalid request parameters") || (error as any)?.response?.status === 422) {
         showAlert('error', 'AI Assistant could not process the request. Please ensure the content is saved and try again.');
      } else { showAlert('error', errorMessage); }
      setIsRightSidebarOpen(false); 
    } finally { setIsLoadingExpansion(false); }
  };

  const handleApplyTransform = async (alternativeText: string, expansionKey: ExpansionType) => {
    if (!activeExpansionComponentId || !activeExpansionActionType) { showAlert('error', 'Cannot apply: No active transformation.'); return; }
    try {
      setIsLoadingExpansion(true);
      const response = await api.applyTransform(activeExpansionComponentId, activeExpansionActionType, alternativeText); 
      if (response.component) {
        setElements(prevElements =>
          prevElements.map(el => {
            if (el.componentId === response.component.id) {
              if(!isTemporaryId(el.componentId)) { modifiedComponentIdsRef.current.add(el.componentId); setHasUnsavedChanges(true); }
              return { ...el, content: response.component.content || '' };
            } return el;
          })
        );
        showAlert('success', response.message || 'Changes applied!');
        setExpansionResults(null); setActiveExpansionComponentId(null); setActiveExpansionActionType(null);
      } else { throw new Error('API response missing updated component.'); }
    } catch (error) { showAlert('error', error instanceof Error ? error.message : 'Failed to apply changes.');
    } finally { setIsLoadingExpansion(false); }
  };

  if (isLoadingScript && !hasAttemptedLoad) {
    return (<div className="h-screen bg-gray-100 flex items-center justify-center"><div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <RefreshCw className="animate-spin rounded-full h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading script...</p></div></div>);
  }
  if (loadError) {
    return (<div className="h-screen bg-gray-100 flex items-center justify-center"><div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" /><h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Script</h2>
          <p className="text-gray-600 mb-6">{loadError}</p><div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={handleRetry} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry</button>
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Back to Home</button></div></div></div>);
  }
  const isScriptEffectivelyEmpty = elementsRef.current.length === 1 && elementsRef.current[0].type === 'scene-heading' && elementsRef.current[0].content === '' && isTemporaryId(elementsRef.current[0].sceneSegmentId);
  const showGenNextSceneButton = scriptMetadata?.creationMethod === 'WITH_AI' &&
                                 (scriptState.state === 'firstSceneGenerated' || scriptState.state === 'multipleScenes') &&
                                 !scriptState.context.isComplete;


  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header
        title={title} viewMode={viewMode} setViewMode={handleViewModeChange}
        setShowTitlePageModal={setShowTitlePageModal} handleExport={handleExport}
        openSettings={() => setShowSettingsModal(true)} openAccountSettings={() => setShowAccountSettingsModal(true)}
        userProfiles={userProfiles} activeProfile={activeProfile} setActiveProfile={setActiveProfile}
        suggestionsEnabled={suggestionsEnabled} setSuggestionsEnabled={setSuggestionsEnabled}
        onGenerateScript={handleGenerateScript} scriptState={scriptState.state}
        beatsAvailable={beatsAvailable} hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave} isSaving={isSaving}
        scriptCreationMethod={scriptMetadata?.creationMethod} // Pass creation method to Header
      />
      <div className="flex-1 flex overflow-hidden">
        {viewMode !== 'beats' && !isLeftSidebarOpen && (
          <div className="absolute left-0 top-0 w-8 h-full z-20 flex items-center">
            <button onClick={() => setIsLeftSidebarOpen(true)} className="absolute left-2 text-gray-400 p-2 rounded-full transition-all duration-200 hover:bg-white hover:shadow-lg hover:text-gray-600">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
        {viewMode !== 'beats' && (
          <LeftSidebar
            isOpen={isLeftSidebarOpen} setIsOpen={setIsLeftSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab}
            elements={elementsRef.current} getSceneText={getSceneText}
            totalWords={elementsRef.current.reduce((count, el) => count + (stripHtml(el.content).trim() ? stripHtml(el.content).trim().split(/\s+/).length : 0), 0)}
            totalPages={pages.length + 1} comments={comments}
            onDeleteComment={handleDeleteComment} onCommentClick={handleCommentClick}
          />
        )}
        {viewMode === 'beats' ? (
          <div className="flex-1 overflow-hidden">
            <BeatSheetView title={title} onSwitchToScript={() => setViewMode('script')}
              onGeneratedScriptElements={handleGeneratedScriptElements}
              currentSceneSegmentId={currentSceneSegmentId} beatsAvailable={beatsAvailable}
            />
          </div>
        ) : viewMode === 'boards' ? (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <div className="text-center p-8"><h2 className="text-xl font-semibold text-gray-800 mb-4">Boards View</h2><p className="text-gray-600">This feature is coming soon.</p></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="screenplay-container py-8" style={{ width: `var(--page-width, ${formatSettings.pageLayout.width}in)`, margin: '0 auto' }}>
              <ScrollPositionManager elements={elementsRef.current} selectedElementId={selectedElement} contentRef={contentRef} elementRefs={elementRefs}>
                <div ref={contentRef} className="screenplay-content" style={{
                  padding: `var(--page-margin-top, ${formatSettings.pageLayout.marginTop}in) var(--page-margin-right, ${formatSettings.pageLayout.marginRight}in) var(--page-margin-bottom, ${formatSettings.pageLayout.marginBottom}in) var(--page-margin-left, ${formatSettings.pageLayout.marginLeft}in)`,
                  minHeight: `var(--page-height, ${formatSettings.pageLayout.height}in)`
                }}>
                  <ScriptContentLoader
                    scriptId={scriptId} creationMethod={scriptMetadata?.creationMethod || 'FROM_SCRATCH'}
                    initialElements={elementsRef.current} 
                    onElementsLoaded={(loadedElements) => {
                        const processed = loadedElements.map(el => ({...el, isNew: false, id: generateFrontendElementId() })); 
                        setElements(processed); 
                        if (processed.length > 0) {
                            setSelectedElement(processed[0].id);
                            const lastSeg = processed.reduce((latest, current) => (current.segmentPosition || 0) > (latest.segmentPosition || 0) ? current : latest, processed[0]);
                            if(lastSeg?.sceneSegmentId) setCurrentSceneSegmentId(lastSeg.sceneSegmentId);
                        }
                    }}
                    onSceneSegmentIdUpdate={setCurrentSceneSegmentId} showAlert={showAlert}
                    isGeneratingFirstScene={isGeneratingFirstScene} onGenerateScript={handleGenerateScript}
                  />
                  {isScriptEffectivelyEmpty && scriptMetadata?.creationMethod === 'FROM_SCRATCH' && !isLoadingScript && (
                      <ScriptEmptyState scriptType="MANUAL" onGenerateScript={() => {}} isGenerating={false} />
                   )}
                  {elementsRef.current.map((element, index) => ( 
                    <div key={element.id} className="element-wrapper" data-type={element.type} style={{
                      textAlign: formatSettings.elements[element.type]?.alignment || 'left',
                      marginTop: `var(--${element.type}-spacing-before, ${formatSettings.elements[element.type]?.spacingBefore || 0}rem)`,
                      marginBottom: `var(--${element.type}-spacing-after, ${formatSettings.elements[element.type]?.spacingAfter || 0}rem)`
                    }}>
                      {pages.includes(index) && (<div className="page-break"><div className="page-number">Page {pages.findIndex(p => p === index) + 2}</div></div>)}
                      <MemoizedScriptElement
                        id={element.id} type={element.type} content={element.content}
                        isSelected={selectedElement === element.id}
                        onChange={handleElementChange} onKeyDown={handleKeyDown} onFocus={setSelectedElement}
                        onTypeChange={handleTypeChange}
                        autoFocus={element.id === elementsRef.current[elementsRef.current.length - 1]?.id && elementsRef.current.length > 1 && element.isNew === true}
                        onAIAssistClick={handleAIAssistClick} elements={elementsRef.current} onAddComment={handleAddComment}
                        activeCommentId={activeCommentId}
                        comments={comments.filter(c => elementRefs.current[element.id]?.current?.containsCommentRange?.(c.from, c.to))}
                        formatSettings={formatSettings.elements[element.type]}
                        suggestions={suggestionsEnabled ? suggestions : undefined}
                        showAITools={suggestionsEnabled} elementRef={elementRefs.current[element.id]}
                        onRequestExpansion={handleRequestExpansion} componentId={element.componentId}
                        onNavigateElement={handleNavigateElement}
                      />
                    </div>
                  ))}
                </div>
              </ScrollPositionManager>
              {showGenNextSceneButton && ( 
                <GenerateNextSceneButton onClick={handleGenerateNextScene} visible={true} isLoading={isGeneratingNextScene} />
              )}
            </div>
          </div>
        )}
        {viewMode !== 'beats' && !isRightSidebarOpen && suggestionsEnabled && (
          <div className="absolute right-0 top-0 w-8 h-full z-20 flex items-center">
            <button onClick={() => setIsRightSidebarOpen(true)} className="absolute right-2 text-gray-400 p-2 rounded-full transition-all duration-200 hover:bg-white hover:shadow-lg hover:text-gray-600">
              <div className="relative"><ChevronLeft className="h-5 w-5" /><div className="ai-icon-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75">
                  <div className="ai-icon-pulse"></div><Sparkles className="ai-icon-sparkle text-blue-500" /></div></div>
            </button>
          </div>
        )}
        {viewMode !== 'beats' && (
          <RightSidebar isOpen={isRightSidebarOpen} setIsOpen={setIsRightSidebarOpen} onApplySuggestion={handleApplySuggestion}
            selectedElementId={selectedElement} expansionResults={expansionResults}
            isLoadingExpansion={isLoadingExpansion} onApplyTransformRequest={handleApplyTransform}
            activeExpansionComponentId={activeExpansionComponentId} activeExpansionActionType={activeExpansionActionType}
          />
        )}
      </div>
      <TitlePageModal show={showTitlePageModal} onClose={() => setShowTitlePageModal(false)} titlePage={titlePage} setTitlePage={setTitlePage} setTitle={setTitle} />
      <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)} settings={formatSettings} setSettings={setFormatSettings}
        suggestions={suggestions} setSuggestions={setSuggestions} userProfiles={userProfiles} setUserProfiles={setUserProfiles}
        activeProfile={activeProfile} setActiveProfile={setActiveProfile} suggestionsEnabled={suggestionsEnabled} setSuggestionsEnabled={setSuggestionsEnabled}
      />
      <AccountSettingsModal isOpen={showAccountSettingsModal} onClose={() => setShowAccountSettingsModal(false)}
        displayName={user?.user_metadata?.full_name || user?.email || 'User'} email={user?.email || ''}
        onChangeDisplayName={handleChangeDisplayName} onChangeEmail={handleChangeEmail}
      />
    </div>
  );
}
