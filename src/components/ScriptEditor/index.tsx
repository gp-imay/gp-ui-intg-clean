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
import { api, mapApiResponseToScriptMetadata, ExpansionType } from '../../services/api';
import { useParams } from 'react-router-dom';
import { ExpandComponentResponse } from '../../services/api';
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
  ComponentTypeFE,
  ScriptChangesRequest,
  ComponentChange,
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
const UNSAVED_REMINDER_INTERVAL = 5 * 60 * 1000;

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
  const [saveCycle, setSaveCycle] = useState(0); // Incremented after save or AI content load
  const [selectedElement, setSelectedElement] = useState(elements[0]?.id || '');
  const initialElementsRef = useRef<ScriptElementType[]>([]);

  const modifiedComponentIdsRef = useRef(new Set<string>());
  const deletedComponentIdsRef = useRef(new Set<string>()); 
  const deletedSegmentIdsRef = useRef(new Set<string>());   
  const loadedSegmentIdsRef = useRef<Set<string>>(new Set());

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
  
  // Effect to reset the baseline for changes after an initial load or a successful save/AI content load.
  useEffect(() => {
    if (!isLoadingScript && !isInitialLoadCompleteRef.current) { // Initial script load complete
        console.log("Initial script load complete. Resetting change tracking state baseline.");
        initialElementsRef.current = JSON.parse(JSON.stringify(elements));
        modifiedComponentIdsRef.current.clear();
        deletedComponentIdsRef.current.clear();
        deletedSegmentIdsRef.current.clear();
        setHasUnsavedChanges(false);
        isInitialLoadCompleteRef.current = true; 
    } else if (saveCycle > 0 && !isLoadingScript && isInitialLoadCompleteRef.current) { // Post-save or post-AI content load
        console.log(`Save cycle ${saveCycle}. Resetting change tracking state baseline.`);
        initialElementsRef.current = JSON.parse(JSON.stringify(elements)); // Use the latest elements from state
        modifiedComponentIdsRef.current.clear();
        deletedComponentIdsRef.current.clear();
        deletedSegmentIdsRef.current.clear();
        setHasUnsavedChanges(false);
    }
  }, [isLoadingScript, saveCycle, elements]); // `elements` is crucial here

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
      setIsLeftSidebarOpen(previousSidebarStates.left);
      setIsRightSidebarOpen(previousSidebarStates.right);
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
          const fetchedElements = api.convertSegmentsToScriptElements(initialSegmentsResponse.segments, [], generateFrontendElementId);
          // Mark fetched elements as not new, assign unique frontend ID
          const processedElements = fetchedElements.map(el => ({ ...el, isNew: false, id: generateFrontendElementId() }));
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
        } else { // WITH_AI but no segments yet (e.g. only beats exist)
          setElements([]); // Start empty, BeatSheetView will handle generating first script parts
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
  }, [scriptId, showAlert, hasAttemptedLoad, scriptState.context.scenesCount]); // Dependencies for initial load
  
  const handleGeneratedScriptElements = (generatedElements: ScriptElementType[], sceneSegmentId: string) => {
    setCurrentSceneSegmentId(sceneSegmentId);
    loadedSegmentIdsRef.current.add(sceneSegmentId);
    const processedGeneratedElements = generatedElements.map(el => ({
      ...el, isNew: false, id: generateFrontendElementId() // Mark as not new, ensure frontend ID
    }));
    
    const isEditorEffectivelyEmpty = elementsRef.current.length === 0 ||
      (elementsRef.current.length === 1 && elementsRef.current[0].type === 'scene-heading' && stripHtml(elementsRef.current[0].content).trim() === '' && isTemporaryId(elementsRef.current[0].sceneSegmentId));
    
    let finalElementsToSet: ScriptElementType[];
    if (isEditorEffectivelyEmpty) {
      finalElementsToSet = processedGeneratedElements;
    } else {
      // Merge new elements with existing, ensuring no duplicates by componentId
      const existingComponentIds = new Set(elementsRef.current.map(e => e.componentId));
      const uniqueNewElements = processedGeneratedElements.filter(ne => !ne.componentId || !existingComponentIds.has(ne.componentId));
      
      const combined = [...elementsRef.current, ...uniqueNewElements];
      const segmentGroups = new Map<string, ScriptElementType[]>();
      combined.forEach(element => {
        const segId = element.sceneSegmentId || `unsegmented-${element.id}`;
        if (!segmentGroups.has(segId)) segmentGroups.set(segId, []);
        segmentGroups.get(segId)?.push(element);
      });
      finalElementsToSet = [];
      Array.from(segmentGroups.keys())
        .sort((a, b) => {
          const aPos = segmentGroups.get(a)?.[0]?.segmentPosition ?? Infinity;
          const bPos = segmentGroups.get(b)?.[0]?.segmentPosition ?? Infinity;
          return aPos - bPos;
        })
        .forEach(sId => {
          const segmentElems = segmentGroups.get(sId) || [];
          segmentElems.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          finalElementsToSet.push(...segmentElems);
        });
    }
    
    setElements(finalElementsToSet); 
    if (processedGeneratedElements.length > 0) setSelectedElement(processedGeneratedElements[0].id);
    setHasCompletedFirstScene(true); 
    setActiveTab('scenes'); 
    
    console.log("Triggering saveCycle increment after handleGeneratedScriptElements");
    setSaveCycle(prev => prev + 1); // This resets the baseline via useEffect
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
            .map(el => ({ ...el, isNew: false, id: generateFrontendElementId() })); // Mark as not new
        
        setElements(prev => [...prev, ...newApiElements]);
        
        if (newApiElements.length > 0) setSelectedElement(newApiElements[0].id);
        showAlert('success', 'Next scene generated successfully');
        
        console.log("Triggering saveCycle increment after handleGenerateNextScene");
        setSaveCycle(prev => prev + 1); // This resets the baseline via useEffect
      } else { 
        throw new Error(result.error || 'No script components were generated or operation failed');
      }
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate next scene');
    } finally { 
      setIsGeneratingNextScene(false); 
    }
  };

  // This function is called from BeatSheetView, which then calls handleGeneratedScriptElements
  const handleGenerateScript = async () => { 
    if (!scriptId) { showAlert('error', 'Script ID is missing'); return; }
    // The actual generation and element setting is handled by BeatSheetView -> onGeneratedScriptElements -> handleGeneratedScriptElements
    // This function in ScriptEditor might be for a direct "Generate Script" button if one existed here.
    // For now, assuming BeatSheetView's flow is primary for this.
    // If called, it should likely also result in setSaveCycle being incremented after elements are set.
    // This is effectively handled if BeatSheetView calls onGeneratedScriptElements.
    console.log("handleGenerateScript in ScriptEditor called. Actual logic in BeatSheetView flow.");
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

    if (!afterElement && currentElements.length > 0) { // Should be rare if afterId is always valid
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
    } else if (!afterElement && currentElements.length === 0) { // Creating the very first element
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
      newSceneSegmentId = generateTemporaryId('seg');
      newSegmentPosition = Date.now(); 
      newComponentPosition = DEFAULT_COMPONENT_POSITION_INCREMENT; 
    } else {
      let segmentLeader = afterElement;
      if (afterElement.type !== 'scene-heading') {
        const afterElementIndexInCurrent = currentElements.findIndex(el => el.id === afterId);
        for (let i = afterElementIndexInCurrent -1; i >=0; i--) {
            if (currentElements[i].type === 'scene-heading') {
                segmentLeader = currentElements[i];
                break;
            }
        }
      }
      newSceneSegmentId = segmentLeader.sceneSegmentId;
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
      if (currentAfterIdx === -1 && prev.length > 0) { // afterId not found, append to current segment or as new
        const lastElem = prev[prev.length -1];
        newElement.sceneSegmentId = lastElem.sceneSegmentId; // Keep same segment
        newElement.segmentPosition = lastElem.segmentPosition;
        newElement.position = (lastElem.position || 0) + DEFAULT_COMPONENT_POSITION_INCREMENT;
        return [...prev, newElement];
      } else if (currentAfterIdx === -1 && prev.length === 0) { // list is empty
         return [newElement];
      }
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
            // Only mark as modified if it's an existing, persisted component
            if (!isTemporaryId(el.componentId) && el.componentId) {
              modifiedComponentIdsRef.current.add(el.componentId);
            }
            setHasUnsavedChanges(true);
          }
          // If it was temporary and content changed, it's still effectively "new" or needs to be treated as such by save.
          // The `isNew` flag helps `generateSavePayload`.
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
        setElements(prevElements => { // Ensure afterContent is set to the newly created element
            const finalElements = [...prevElements];
            const finalNewElementIndex = finalElements.findIndex(el => el.id === newElementId);
            if(finalNewElementIndex !== -1) {
              finalElements[finalNewElementIndex] = {...finalElements[finalNewElementIndex], content: splitData.afterContent };
            }
            return finalElements;
        });
      } else {
        newElementId = createNewElement(nextType, id);
      }
      if (newElementId) setSelectedElement(newElementId);
      setHasUnsavedChanges(true);
    } else if (event.key === 'Backspace' && options?.mergeUp) { // Handles Backspace at start of element to merge/delete
      event.preventDefault();
      if (currentIndex > 0) { // Cannot merge up if it's the first element
        const previousElement = currentElements[currentIndex - 1];
        if (!isTemporaryId(currentElement.componentId) && currentElement.componentId) {
          deletedComponentIdsRef.current.add(currentElement.componentId);
          console.log(`Marked component ${currentElement.componentId} for deletion (mergeUp).`);
          if (currentElement.type === 'scene-heading' && !isTemporaryId(currentElement.sceneSegmentId) && currentElement.sceneSegmentId) {
            deletedSegmentIdsRef.current.add(currentElement.sceneSegmentId);
            console.log(`Marked segment ${currentElement.sceneSegmentId} for deletion (mergeUp).`);
          }
        }
        // Merge content if previous element is not empty, otherwise just delete current
        const newContentForPrevious = previousElement.content + stripHtml(currentElement.content);
        setElements(prev => {
            const filtered = prev.filter(el => el.id !== id);
            return filtered.map(el => el.id === previousElement.id ? {...el, content: newContentForPrevious} : el);
        });
        
        setSelectedElement(previousElement.id);
        // Focus at the end of the merged content in the previous element
        requestAnimationFrame(() => elementRefs.current[previousElement.id]?.current?.focusEditorEnd());
        setHasUnsavedChanges(true);
      } else if (currentIndex === 0 && currentElements.length > 1) { // Trying to Backspace on first element but it's not the only one
        // This case should ideally not have mergeUp if it's the very first element
        // If it's empty, Tiptap's internal logic might delete it.
        // If it gets here, and it's not temporary, mark for deletion.
         if (!isTemporaryId(currentElement.componentId) && currentElement.componentId && stripHtml(currentElement.content).trim() === '') {
            deletedComponentIdsRef.current.add(currentElement.componentId);
            if (currentElement.type === 'scene-heading' && !isTemporaryId(currentElement.sceneSegmentId) && currentElement.sceneSegmentId) {
                deletedSegmentIdsRef.current.add(currentElement.sceneSegmentId);
            }
            setElements(prev => prev.filter(el => el.id !== id));
            if (currentElements.length > 1) setSelectedElement(currentElements[1].id); else {/* handle empty script */}
            setHasUnsavedChanges(true);
        }
      }
    } else if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      const nextType = getNextElementType(currentElement.type);
      const newId = createNewElement(nextType, id);
      setSelectedElement(newId);
      setHasUnsavedChanges(true);
    }
  }, [hasCompletedFirstScene, createNewElement, setActiveTab, getNextElementType, setHasUnsavedChanges]); // Removed elements from deps as elementsRef.current is used
  
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
    const currentElements = elementsRef.current; // Use the ref for the most current data
    const payload: ScriptChangesRequest = {
        changedSegments: {},
        deletedElements: Array.from(deletedComponentIdsRef.current).filter(id => !isTemporaryId(id)),
        deletedSegments: Array.from(deletedSegmentIdsRef.current).filter(id => !isTemporaryId(id)),
        newSegments: [],
        newComponentsInExistingSegments: []
    };
    const segmentMap = new Map<string, ScriptElementType[]>();
    currentElements.forEach(el => {
        const segId = el.sceneSegmentId || generateTemporaryId('seg'); // Ensure a segId
        if (!segmentMap.has(segId)) segmentMap.set(segId, []);
        segmentMap.get(segId)!.push({
            ...el,
            position: typeof el.position === 'number' && !isNaN(el.position) ? el.position : Date.now(),
            segmentPosition: typeof el.segmentPosition === 'number' && !isNaN(el.segmentPosition) ? el.segmentPosition : Date.now(),
        });
    });

    segmentMap.forEach((segmentElementsFromMap, segmentId) => {
        segmentElementsFromMap.sort((a, b) => (a.position || 0) - (b.position || 0));
        const apiComponentsForSegment: (Omit<ComponentChange, 'id'> & { id?: string, frontendId?: string } | any)[] = [];
        
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
                    const isNewEffective = el.isNew || isTemporaryId(el.componentId) || 
                                  (parenEl && (parenEl.isNew || isTemporaryId(parenEl.componentId))) || 
                                  (dialogueEl.isNew || isTemporaryId(dialogueEl.componentId));
                    // Use dialogueEl's componentId as the primary for the bundled backend component
                    const baseCompId = dialogueEl.componentId; 
                    const apiCompToAdd = {
                        component_type: ComponentTypeFE.DIALOGUE,
                        position: el.position!, 
                        content: stripHtml(dialogueEl.content),
                        character_name: charName,
                        parenthetical: parenText,
                        ...(isNewEffective || isTemporaryId(baseCompId) ? { frontendId: baseCompId } : { id: baseCompId })
                    };
                    apiComponentsForSegment.push(apiCompToAdd);
                    // If these parts were just bundled, don't also send them as individually modified.
                    if(!isTemporaryId(el.componentId) && el.componentId) modifiedComponentIdsRef.current.delete(el.componentId);
                    if(parenEl && !isTemporaryId(parenEl.componentId) && parenEl.componentId) modifiedComponentIdsRef.current.delete(parenEl.componentId);
                    if(!isTemporaryId(dialogueEl.componentId) && dialogueEl.componentId) modifiedComponentIdsRef.current.delete(dialogueEl.componentId);

                    i += (parenEl ? 2 : 1); // Advance past character, (optional parenthetical), and dialogue
                } else { // Standalone character, not part of a full dialogue block
                     apiComponentsForSegment.push({
                        component_type: mapElementTypeToComponentType(el.type),
                        position: el.position!, content: stripHtml(el.content),
                        character_name: charName,
                        ...(el.isNew || isTemporaryId(el.componentId) ? { frontendId: el.componentId } : { id: el.componentId })
                    });
                }
            } else { // Not a 'character' element
                 apiComponentsForSegment.push({
                    component_type: mapElementTypeToComponentType(el.type),
                    position: el.position!, content: stripHtml(el.content),
                    ...(el.isNew || isTemporaryId(el.componentId) ? { frontendId: el.componentId } : { id: el.componentId })
                });
            }
            i++;
        }
        
        if (isTemporaryId(segmentId)) { // This is a new segment
            const firstElement = segmentElementsFromMap[0];
            if (!firstElement || apiComponentsForSegment.length === 0) return; 
            payload.newSegments.push({
                frontendId: segmentId,
                // Use segmentPosition from the first element, ensuring it's a number
                segmentNumber: typeof firstElement.segmentPosition === 'number' ? firstElement.segmentPosition : Date.now(),
                components: apiComponentsForSegment
                                .filter(c => c.frontendId) // Only new components for new segments
                                .map(c => ({...c, component_type: c.component_type as ComponentTypeFE }))
            });
        } else { // This is an existing segment
            apiComponentsForSegment.forEach(apiComp => {
                if (apiComp.frontendId && !apiComp.id) { // It's a new component in an existing segment
                    payload.newComponentsInExistingSegments.push({
                        ...(apiComp), segment_id: segmentId, component_type: apiComp.component_type as ComponentTypeFE
                    });
                } else if (apiComp.id && modifiedComponentIdsRef.current.has(apiComp.id)) { // It's a changed component
                    if (!payload.changedSegments[segmentId]) payload.changedSegments[segmentId] = [];
                    payload.changedSegments[segmentId].push(apiComp as ComponentChange);
                }
            });
        }
    });
    console.log("Generated Save Payload:", JSON.stringify(payload, null, 2));
    console.log("DeletedComponentIds:", Array.from(deletedComponentIdsRef.current));
    console.log("DeletedSegmentIds:", Array.from(deletedSegmentIdsRef.current));
    return payload;
  };
  
  const handleSave = async () => {
    if (!scriptId) { showAlert('error', 'Script ID is missing. Cannot save.'); return; }
    // Recalculate hasAnyChanges based on current state of refs and elements
    const hasAnyRealChanges = elementsRef.current.some(el => el.isNew === true || isTemporaryId(el.componentId)) ||
                         modifiedComponentIdsRef.current.size > 0 ||
                         deletedComponentIdsRef.current.size > 0 ||
                         deletedSegmentIdsRef.current.size > 0;

    if (!hasAnyRealChanges && !hasUnsavedChanges) { // Check both explicit flag and calculated
      showAlert('info', 'No changes to save.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = generateSavePayload();
      if (Object.keys(payload.changedSegments).length === 0 && payload.deletedElements.length === 0 &&
          payload.deletedSegments.length === 0 && payload.newSegments.length === 0 &&
          payload.newComponentsInExistingSegments.length === 0) {
        showAlert('info', 'No effective changes to persist to backend.');
        // Still, reset frontend state as if saved, because user might have undone changes.
        setElements(prev => prev.map(el => ({ ...el, isNew: false }))); 
        setSaveCycle(prev => prev + 1); // Triggers baseline reset
        // setHasUnsavedChanges(false); // This will be set by the saveCycle useEffect
        setIsSaving(false);
        return;
      }

      const response = await api.saveScriptChanges(scriptId, payload);
      if (response.success) {
        // Update frontend elements with IDs from backend and mark as not new
        setElements(prevElements => {
          const idMappedElements = prevElements.map(el => {
            let updatedEl = { ...el, isNew: false }; // Assume all are now persisted
            const feSegmentId = el.sceneSegmentId;
            const feComponentId = el.componentId;

            if (feSegmentId && response.idMappings.segments[feSegmentId]) {
              updatedEl.sceneSegmentId = response.idMappings.segments[feSegmentId];
            }
            if (feComponentId && response.idMappings.components[feComponentId]) {
              updatedEl.componentId = response.idMappings.components[feComponentId];
            }
            return updatedEl;
          });
          // Filter out elements that might have been deleted locally but then the delete failed on backend (edge case)
          // For now, assume backend is source of truth for deletions if they were in payload.
          // The main thing is mapping new IDs.
          return idMappedElements;
        });
        
        showAlert('success', response.message || 'Script saved successfully!');
        setSaveCycle(prev => prev + 1); // Crucial: This triggers the useEffect to reset baseline and clear refs
      } else { 
        showAlert('error', response.message || 'Failed to save script changes.');
      }
    } catch (error) {
      showAlert('error', error instanceof Error ? error.message : 'An unexpected error occurred during save.');
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleTypeChange = useCallback(async (id: string, newType: ElementType) => {
    const currentElements = elementsRef.current;
    let newTempSegmentId: string | undefined = undefined;
    let newSegmentPosition: number | undefined = undefined; // This will be the timestamp for new segments
    let originalComponentIdToDeleteIfTypeChangesSignificantly: string | undefined = undefined;
    let newFeComponentId: string = generateTemporaryId('el'); // New temporary backend ID

    const currentElement = currentElements.find(el => el.id === id);
    if (!currentElement) return;
    const oldType = currentElement.type;

    // If changing TO a scene heading FROM something else, it starts a new segment
    if (newType === 'scene-heading' && oldType !== 'scene-heading') {
        newSegmentPosition = Date.now(); // Use timestamp for unique, sortable position for new segments
        newTempSegmentId = generateTemporaryId('seg'); // New temporary segment ID
        // If the old element was persisted, its component needs to be marked for deletion if we are essentially replacing it
        if (!isTemporaryId(currentElement.componentId) && currentElement.componentId) {
             originalComponentIdToDeleteIfTypeChangesSignificantly = currentElement.componentId;
        }
    }

    setElements(prev =>
        prev.map(el => {
            if (el.id === id) {
                let updatedElement = { ...el, type: newType, isNew: el.isNew || (oldType !== newType) }; // Mark as new if type changes

                if (newType === 'scene-heading' && oldType !== 'scene-heading') {
                    // This element becomes a new scene heading in a new segment
                    updatedElement.sceneSegmentId = newTempSegmentId;
                    updatedElement.segmentPosition = newSegmentPosition;
                    updatedElement.componentId = newFeComponentId; // Assign new temp backend ID
                    updatedElement.position = DEFAULT_COMPONENT_POSITION_INCREMENT; // Default position within new segment
                    updatedElement.isNew = true; // Definitely a new component for backend
                } else if (oldType === 'scene-heading' && newType !== 'scene-heading') {
                    // This element was a scene heading but is no longer. It needs to join the previous segment.
                    // Find the segment ID and position of the scene heading BEFORE this one (if any)
                    const currentElementIndex = prev.findIndex(pEl => pEl.id === el.id);
                    let newParentSegmentId = generateTemporaryId('seg'); // Fallback
                    let newParentSegmentPos = Date.now(); // Fallback
                    let foundPreviousSegment = false;
                    for (let i = currentElementIndex - 1; i >= 0; i--) {
                        if (prev[i].type === 'scene-heading') {
                            newParentSegmentId = prev[i].sceneSegmentId!;
                            newParentSegmentPos = prev[i].segmentPosition!;
                            foundPreviousSegment = true;
                            break;
                        }
                    }
                    updatedElement.sceneSegmentId = newParentSegmentId;
                    updatedElement.segmentPosition = newParentSegmentPos; 
                    // Position within this segment (needs recalc based on others in newParentSegmentId) - simplify for now
                    updatedElement.position = (updatedElement.position || 0) + DEFAULT_COMPONENT_POSITION_INCREMENT; // Placeholder
                    // The original scene segment ID (if it only contained this heading) might need to be marked for deletion.
                    // This is handled by `originalComponentIdToDeleteIfTypeChangesSignificantly` if the component itself is "replaced".
                }
                
                // If type changed and old component was persisted, mark old one as modified (or handle as delete+add by generateSavePayload)
                if (oldType !== newType && !isTemporaryId(el.componentId) && el.componentId) {
                    if (newType !== 'scene-heading' || oldType === 'scene-heading') { // If not becoming a new scene heading component
                        modifiedComponentIdsRef.current.add(el.componentId);
                    }
                }
                return updatedElement;
            }
            return el;
        })
    );

    // If we created a new scene heading component replacing a persisted non-scene heading, mark old for deletion.
    if (originalComponentIdToDeleteIfTypeChangesSignificantly) {
        deletedComponentIdsRef.current.add(originalComponentIdToDeleteIfTypeChangesSignificantly);
        console.log(`Marked component ${originalComponentIdToDeleteIfTypeChangesSignificantly} for deletion due to type change to scene-heading.`);
    }
    setHasUnsavedChanges(true);
  }, []); // Removed elements from deps as elementsRef.current is used
  
  // Global keydown for Delete/Backspace to mark empty elements for deletion
  useEffect(() => {
    const handleKeyboardDelete = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        const activeEl = document.activeElement;
        const isEditorActive = activeEl && activeEl.classList.contains('ProseMirror');

        if (isEditorActive) { // Only act if Tiptap editor has focus
            const elToDelete = elementsRef.current.find(el => el.id === selectedElement);
            if (elToDelete) {
                const editorInstance = elementRefs.current[elToDelete.id]?.current?.getEditor?.(); // Assuming getEditor is exposed
                const isContentEffectivelyEmpty = editorInstance ? editorInstance.isEmpty : (stripHtml(elToDelete.content).trim() === '');

                if (isContentEffectivelyEmpty) {
                    // This deletion path is for when an element is already empty and user hits delete/backspace.
                    // The more robust path is through ScriptElement's onKeyDown -> mergeUp.
                    // This global listener acts as a fallback.
                    if (!isTemporaryId(elToDelete.componentId) && elToDelete.componentId) {
                        if (!deletedComponentIdsRef.current.has(elToDelete.componentId)) {
                            deletedComponentIdsRef.current.add(elToDelete.componentId);
                            console.log(`Global delete: Marked component ${elToDelete.componentId} for deletion.`);
                            if (elToDelete.type === 'scene-heading' && !isTemporaryId(elToDelete.sceneSegmentId) && elToDelete.sceneSegmentId) {
                                if(!deletedSegmentIdsRef.current.has(elToDelete.sceneSegmentId)){
                                   deletedSegmentIdsRef.current.add(elToDelete.sceneSegmentId);
                                   console.log(`Global delete: Marked segment ${elToDelete.sceneSegmentId} for deletion.`);
                                }
                            }
                            setHasUnsavedChanges(true);
                            
                            // Actually remove the element from UI and state
                            const currentIndex = elementsRef.current.findIndex(e => e.id === elToDelete.id);
                            setElements(prevElements => prevElements.filter(e => e.id !== elToDelete.id));
                            
                            if (currentIndex > 0) {
                                setSelectedElement(elementsRef.current[currentIndex - 1].id);
                            } else if (elementsRef.current.length > 1) { // Was first, select next
                                setSelectedElement(elementsRef.current[0].id); // elementsRef is now one shorter
                            } else {
                                // TODO: Handle deleting the last element - perhaps create a new empty one
                                const newFirstId = createNewElement('scene-heading', ''); // Create a new default element
                                setSelectedElement(newFirstId);
                            }
                        }
                    }
                }
            }
        }
      }
    };
    document.addEventListener('keydown', handleKeyboardDelete);
    return () => document.removeEventListener('keydown', handleKeyboardDelete);
  }, [selectedElement, elements, createNewElement]); // Added elements and createNewElement
  
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
            handleElementChange(selectedElement, lines[0]);
            let lastId = selectedElement;
            for (let i = 1; i < lines.length; i++) {
              let newType: ElementType = 'action';
              const line = lines[i].trim();
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
    if ((targetElement && (targetElement.isNew || isTemporaryId(targetElement.componentId)) ) || hasUnsavedChanges) {
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
              if(!isTemporaryId(el.componentId)) { // Should always be true here if AI action was allowed
                modifiedComponentIdsRef.current.add(el.componentId); 
                // setHasUnsavedChanges(true); // This will be handled by saveCycle
              }
              return { ...el, content: response.component.content || '' };
            } return el;
          })
        );
        showAlert('success', response.message || 'Changes applied!');
        setExpansionResults(null); setActiveExpansionComponentId(null); setActiveExpansionActionType(null);
        
        console.log("Triggering saveCycle increment after handleApplyTransform");
        setSaveCycle(prev => prev + 1); // This resets the baseline via useEffect and marks as saved
      } else { throw new Error('API response missing updated component.'); }
    } catch (error) { showAlert('error', error instanceof Error ? error.message : 'Failed to apply changes.');
    } finally { setIsLoadingExpansion(false); }
  };

  // ---- Render Logic ----
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
  
  const isScriptEffectivelyEmpty = elementsRef.current.length === 0 || (elementsRef.current.length === 1 && elementsRef.current[0].type === 'scene-heading' && stripHtml(elementsRef.current[0].content).trim() === '' && isTemporaryId(elementsRef.current[0].sceneSegmentId));
  
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
        scriptCreationMethod={scriptMetadata?.creationMethod}
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
            <BeatSheetView 
                title={title} 
                onSwitchToScript={() => setViewMode('script')}
                onGeneratedScriptElements={handleGeneratedScriptElements}
                currentSceneSegmentId={currentSceneSegmentId} 
                beatsAvailable={beatsAvailable}
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
                  <ScriptContentLoader // Handles initial loading and shows empty state if needed
                    scriptId={scriptId} creationMethod={scriptMetadata?.creationMethod || 'FROM_SCRATCH'}
                    initialElements={elementsRef.current} // Pass current elements for it to decide if it needs to load
                    onElementsLoaded={(loadedElements) => { // Callback when it loads new elements
                        const processed = loadedElements.map(el => ({...el, isNew: false, id: generateFrontendElementId() }));
                        setElements(processed); 
                        if (processed.length > 0) {
                            setSelectedElement(processed[0].id);
                            const lastSeg = processed.reduce((latest, current) => (current.segmentPosition || 0) > (latest.segmentPosition || 0) ? current : latest, processed[0]);
                            if(lastSeg?.sceneSegmentId) setCurrentSceneSegmentId(lastSeg.sceneSegmentId);
                        }
                        // Initial load is handled by isLoadingScript, no explicit saveCycle++ here,
                        // as this is part of the initial setup.
                    }}
                    onSceneSegmentIdUpdate={setCurrentSceneSegmentId} showAlert={showAlert}
                    isGeneratingFirstScene={isGeneratingFirstScene} 
                    onGenerateScript={handleGenerateScript} 
                  />
                  {/* Render elements only if not effectively empty, or if ScriptContentLoader decided not to show empty state */}
                  {(!isScriptEffectivelyEmpty || (scriptMetadata?.creationMethod === 'WITH_AI' && elementsRef.current.length > 0)) && elementsRef.current.map((element, index) => ( 
                    <div key={element.id} className="element-wrapper" data-type={element.type} style={{
                       textAlign: formatSettings.elements[element.type]?.alignment || 'left',
                       marginTop: `var(--${element.type}-spacing-before, ${formatSettings.elements[element.type]?.spacingBefore || 0}rem)`,
                       marginBottom: `var(--${element.type}-spacing-after, ${formatSettings.elements[element.type]?.spacingAfter || 0}rem)`
                    }}>
                      {pages.includes(index) && (<div className="page-break"><div className="page-number">Page {pages.findIndex(p => p === index) + 2}</div></div>)}
                      <MemoizedScriptElement
                        id={element.id} 
                        type={element.type} content={element.content}
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
                <GenerateNextSceneButton 
                  onClick={handleGenerateNextScene} visible={true} isLoading={isGeneratingNextScene} />
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
          <RightSidebar 
            isOpen={isRightSidebarOpen} setIsOpen={setIsRightSidebarOpen} onApplySuggestion={handleApplySuggestion}
            selectedElementId={selectedElement} expansionResults={expansionResults}
            isLoadingExpansion={isLoadingExpansion} onApplyTransformRequest={handleApplyTransform}
            activeExpansionComponentId={activeExpansionComponentId} activeExpansionActionType={activeExpansionActionType}
          />
        )}
      </div>
      <TitlePageModal show={showTitlePageModal} onClose={() => setShowTitlePageModal(false)} titlePage={titlePage} setTitlePage={setTitlePage} setTitle={setTitle} />
      <SettingsModal 
        show={showSettingsModal} onClose={() => setShowSettingsModal(false)} settings={formatSettings} setSettings={setFormatSettings}
        suggestions={suggestions} setSuggestions={setSuggestions} userProfiles={userProfiles} setUserProfiles={setUserProfiles}
        activeProfile={activeProfile} setActiveProfile={setActiveProfile} suggestionsEnabled={suggestionsEnabled} setSuggestionsEnabled={setSuggestionsEnabled}
      />
      <AccountSettingsModal 
        isOpen={showAccountSettingsModal} onClose={() => setShowAccountSettingsModal(false)}
        displayName={user?.user_metadata?.full_name || user?.email || 'User'} email={user?.email || ''}
        onChangeDisplayName={handleChangeDisplayName} onChangeEmail={handleChangeEmail}
      />
    </div>
  );
}