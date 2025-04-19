// src/components/ScriptEditor/index.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ScriptEmptyState } from './ScriptEmptyState';
import { ScriptContentLoader } from './ScriptContentLoader';
import { ScrollPositionManager } from './ScrollPositionManager';
import { MemoizedScriptElement } from './MemoizedScriptElement';
import { ScriptElement } from '../ScriptElement';
import { Header } from '../Header';
import { LeftSidebar } from '../LeftSidebar';
import { RightSidebar } from '../RightSidebar';
import { TitlePageModal } from '../TitlePageModal';
import { SettingsModal } from '../Settings';
import { BeatSheetView } from '../BeatSheet/BeatSheetView';
import { AlertProvider, useAlert } from '../Alert';
import { GenerateNextSceneButton } from '../GenerateNextSceneButton';
import { api, mapApiResponseToScriptMetadata } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';

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
  ScriptChangesRequest
} from '../../types/screenplay';
import { AccountSettingsModal } from '../Dashboard/AccountSettingsModal';
import { useAuth } from '../../contexts/AuthContext';

interface ScriptEditorProps {
  scriptId: string;
  initialViewMode?: ViewMode;
  scriptState: ScriptStateValues;
}

export function ScriptEditor({ scriptId, initialViewMode = 'script', scriptState }: ScriptEditorProps) {
  // This ref helps us prevent multiple API calls for the same script ID
  const loadedScriptIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState('Untitled Screenplay');
  // const navigate = useNavigate();
  const [elements, setElements] = useState<ScriptElementType[]>([
    { id: '1', type: 'scene-heading', content: '', componentId: '79c8fb7a-94f1-4829-a98f-7f5739700249', segmentPosition: 100999 }
  ]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveCycle, setSaveCycle] = useState(0); // Add this state
  const [selectedElement, setSelectedElement] = useState('1');
  const initialElementsRef = useRef<ScriptElementType[]>([]);
// Store the mapping from frontend ID to backend ID after save
  // const idMappingsRef = useRef<{ segments: Record<string, string>, components: Record<string, string> }>({ segments: {}, components: {} });

  const modifiedElementsRef = useRef(new Set<string>());
  const deletedElementsRef = useRef(new Set<string>());
  const deletedSegmentsRef = useRef(new Set<string>());

  const modifiedComponentIdsRef = useRef(new Set<string>());
const deletedComponentIdsRef = useRef(new Set<string>());
const deletedSegmentIdsRef = useRef(new Set<string>());

  // Sidebar state preservation when switching views
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [hasOpenedAIAssistant, setHasOpenedAIAssistant] = useState(false);
  const [currentSceneSegmentId, setCurrentSceneSegmentId] = useState<string | null>(
    scriptState.context.currentSceneSegmentId || null
  );
  const [isLoadingScript, setIsLoadingScript] = useState(false);
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

  // Sidebar state preservation when switching views
  const [previousSidebarStates, setPreviousSidebarStates] = useState<{
    left: boolean;
    right: boolean;
  } | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [showTitlePageModal, setShowTitlePageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  // const [titlePage, setTitlePage] = useState<TitlePage>({
  //   title: 'Untitled Screenplay',
  //   author: '',
  //   contact: '',
  //   date: new Date().toLocaleDateString(),
  //   draft: '1st Draft',
  //   copyright: `Copyright © ${new Date().getFullYear()}`,
  //   coverImage: ''
  // });
  const [titlePage, setTitlePage] = useState<TitlePage>({
    title: '', // Will be updated by useEffect below
    author: '', // Will be updated by useEffect below
    contact: '', // Keep existing default or load from user profile if available
    date: new Date().toLocaleDateString(),
   draft: '1st Draft',
  copyright: `Copyright © ${new Date().getFullYear()}`,
    // Remove date, draft, copyright - they aren't standard / editable here
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

  const previousElementsRef = useRef<ScriptElementType[]>([]);
  const loadedSegmentIdsRef = useRef<Set<string>>(new Set());
  const { user } = useAuth(); 

  const generateTemporaryId = (prefix: 'el' | 'seg'): string => {
    return `temp-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };
  const isTemporaryId = (id: string | undefined): boolean => {
    return !!id && id.startsWith('temp-');
};

useEffect(() => {
  initialElementsRef.current = JSON.parse(JSON.stringify(elements)); // Deep copy
  // Clear modification tracking after load/save
  modifiedComponentIdsRef.current.clear();
  deletedComponentIdsRef.current.clear();
  deletedSegmentIdsRef.current.clear();
  setHasUnsavedChanges(false);
}, [isLoadingScript, saveCycle]);

  // Handle view mode changes
  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === 'beats' && !beatsAvailable) {
      // Show informative alert but still allow the tab switch
      showAlert('info', 'AI beats are not available for manually created scripts. You can still switch to the beats view to see this message.');
    }

    if (mode === 'beats' && viewMode !== 'beats') {
      // Store current sidebar states before switching to beats mode
      setPreviousSidebarStates({
        left: isLeftSidebarOpen,
        right: isRightSidebarOpen
      });
      // Hide sidebars in beats mode
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    } else if (mode !== 'beats' && viewMode === 'beats' && previousSidebarStates) {
      // Restore sidebar states when leaving beats mode
      setIsLeftSidebarOpen(previousSidebarStates.left);
      setIsRightSidebarOpen(previousSidebarStates.right);
    }
    setViewMode(mode);
  };

  useEffect(() => {
    // Set beats availability based on creation method
    if (scriptState.context.creationMethod === 'WITH_AI') {
      setBeatsAvailable(true);
    } else {
      setBeatsAvailable(false);
    }
  }, [scriptState.context.creationMethod]);


  useEffect(() => {
    // Only proceed if we have a scene segment ID that we haven't processed yet
    if (
      currentSceneSegmentId &&
      !isLoadingScript &&
      !processedSceneIdsRef.current.has(currentSceneSegmentId)
    ) {
      console.log('Updating script state due to scene segment change:', currentSceneSegmentId);

      // Mark this scene ID as processed to prevent loops
      processedSceneIdsRef.current.add(currentSceneSegmentId);

      // Now it's safe to update script state without causing a loop
      scriptState.actions.generateFirstScene();
    }
  }, [currentSceneSegmentId, scriptState.actions, isLoadingScript]);


  // Fetch script metadata when the component mounts
  useEffect(() => {
    if (!scriptId || hasAttemptedLoad || loadedScriptIdRef.current === scriptId) {
        // If already loaded or no scriptId, set loading to false if it wasn't already
        if(isLoadingScript) setIsLoadingScript(false);
        return;
    }
    loadedScriptIdRef.current = scriptId;

    async function initializeEditor() { // Renamed for clarity
      setIsLoadingScript(true);
      setLoadError(null);
      try {
        const metadata = await api.getScriptMetadata(scriptId);
        setTitle(metadata.title || `Script ${scriptId.slice(0, 8)}`);
        setScriptMetadata(mapApiResponseToScriptMetadata(metadata)); // Assuming this helper exists

        // Check if script content already exists (e.g., from backend segments)
        const initialSegments = await api.getScriptSegments(scriptId, 0, 1); // Check if any segments exist

        if (initialSegments && initialSegments.segments.length > 0) {
            // If content exists, let ScriptContentLoader handle loading it
            console.log("Existing script content found, letting ScriptContentLoader handle loading.");
             // Ensure elements state is empty so loader fetches
            setElements([]);
        }
        // --- Handle FROM_SCRATCH Initialization ---
        else if (metadata.creation_method === 'FROM_SCRATCH') {
            console.log("Initializing FROM_SCRATCH script with default heading.");
            // Fetch the starting segment number
            const startSegmentNumber = await api.getNextSegmentNumber(scriptId);
            const tempSegId = generateTemporaryId('seg');
            const tempCompId = generateTemporaryId('el');

            const initialElement: ScriptElementType = {
                id: tempCompId, // Use temp ID for React key too
                type: 'scene-heading',
                content: '', // Start empty
                componentId: tempCompId, // Temporary component ID
                sceneSegmentId: tempSegId, // Temporary segment ID
                segmentPosition: startSegmentNumber, // Fetched position
                position: 1000, // Default component position for first element
                isNew: true
            };
            setElements([initialElement]); // Set the initial state
             // Manually set the initial ref baseline after setting state
            initialElementsRef.current = JSON.parse(JSON.stringify([initialElement]));
        }
        // --- End FROM_SCRATCH Handling ---
        else {
             // For WITH_AI or UPLOAD with no segments yet, start empty and let loader/beats view handle it
             setElements([]);
             console.log("Script method is not FROM_SCRATCH and no segments found, starting empty.");
        }

         // Update completion status etc. based on metadata/context
        if (scriptState.context.scenesCount > 0) { /* ... */ }

      } catch (error) {
        console.error('Failed to initialize script editor:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load script');
        showAlert('error', error instanceof Error ? error.message : 'Failed to load script');
        setElements([]); // Ensure elements is empty on error
      } finally {
        setIsLoadingScript(false);
        setHasAttemptedLoad(true);
      }
    }
    initializeEditor();
// Removed scriptState dependencies to prevent re-running on minor state changes
// }, [scriptId, showAlert, hasAttemptedLoad, scriptState.context.scenesCount, scriptState.context.creationMethod, scriptState.context.hasBeats]);
}, [scriptId, showAlert, hasAttemptedLoad]); // Depend only on scriptId and flags controlling the load itself
  // Handle generated script elements from the BeatSheetView
  const handleGeneratedScriptElements = (generatedElements: ScriptElementType[], sceneSegmentId: string) => {
    // Save the scene segment ID
    setCurrentSceneSegmentId(sceneSegmentId);
    // Add this segment ID to our tracking set
    loadedSegmentIdsRef.current.add(sceneSegmentId);

    // Check if we already have this segment
    const hasSegment = elements.some(el => el.sceneSegmentId === sceneSegmentId);

    if (hasSegment) {
      console.log(`Segment ${sceneSegmentId} already exists, not adding duplicate content`);
      return;
    }

    // Replace empty elements with generated ones, or append them if there's content
    if (elements.length === 1 && elements[0].content === '') {
      setElements(generatedElements);
    } else {
      // Add new elements and sort by position
      const combinedElements = [...elements, ...generatedElements];

      // Group by segment and sort
      const segmentGroups = new Map<string, ScriptElementType[]>();

      combinedElements.forEach(element => {
        const segId = element.sceneSegmentId || 'unsegmented';
        if (!segmentGroups.has(segId)) {
          segmentGroups.set(segId, []);
        }
        segmentGroups.get(segId)?.push(element);
      });

      // Sort segments by position
      const sortedSegmentIds = Array.from(segmentGroups.keys())
        .filter(id => id !== 'unsegmented')
        .sort((a, b) => {
          const aPosition = combinedElements.find(el => el.sceneSegmentId === a)?.position || 0;
          const bPosition = combinedElements.find(el => el.sceneSegmentId === b)?.position || 0;
          return aPosition - bPosition;
        });

      // Add unsegmented elements at the end if they exist
      if (segmentGroups.has('unsegmented')) {
        sortedSegmentIds.push('unsegmented');
      }

      // Flatten the sorted groups
      const sortedElements: ScriptElementType[] = [];
      sortedSegmentIds.forEach(segmentId => {
        const segmentElements = segmentGroups.get(segmentId) || [];
        sortedElements.push(...segmentElements);
      });

      setElements(sortedElements);
    }

    // Select the first element of the generated script
    if (generatedElements.length > 0) {
      setSelectedElement(generatedElements[0].id);
    }

    // Update application state
    setHasCompletedFirstScene(true);
    setActiveTab('scenes');

    // Save current elements for comparison in future updates
    previousElementsRef.current = [...elements];

    // if (scriptId) {
    //   navigate(`/editor/${scriptId}?view=script&generated=true`);
    // } else {
    //   // Fallback to local view change
    //   handleViewModeChange('script');
    // }

  };
  const handleChangeDisplayName = () => {
    showAlert('info', 'Change display name functionality coming soon.');
  };

  const handleChangeEmail = () => {
    showAlert('info', 'Change email functionality coming soon.');
  };


  // Generate next scene handler
  const handleGenerateNextScene = async () => {
    if (!scriptId) {
      showAlert('error', 'Script ID is missing');
      return;
    }

    try {
      setIsGeneratingNextScene(true);

      // Call the API to generate the next scene
      const result = await api.generateNextScene(scriptId, currentSceneSegmentId || '');

      if (result.success) {
        // Update the scene segment ID
        setCurrentSceneSegmentId(result.scene_segment_id || null);

        if (result.generated_segment?.components) {
          // Convert the components to script elements
          const newElements = api.convertSceneComponentsToElements(result.generated_segment.components);

          // Append the new elements to the existing script
          setElements(prev => [...prev, ...newElements]);

          // Select the first element of the new scene
          if (newElements.length > 0) {
            setSelectedElement(newElements[0].id);

            // Let the ScrollPositionManager handle scrolling to the selected element
            // This ensures scroll position is maintained correctly
          }

          showAlert('success', 'Next scene generated successfully');
        } else {
          throw new Error('No script components were generated');
        }
      } else {
        throw new Error(result.error || 'Failed to generate next scene');
      }
    } catch (error) {
      console.error('Error generating next scene:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate next scene');
    } finally {
      setIsGeneratingNextScene(false);
    }
  };

  // Generate first script from beats
  const handleGenerateScript = async () => {
    if (!scriptId) {
      showAlert('error', 'Script ID is missing');
      return;
    }

    try {
      setIsGeneratingFirstScene(true);

      // Call the API directly to generate the script
      const result = await api.generateScript(scriptId);

      if (result.success) {
        // Set the scene segment ID
        setCurrentSceneSegmentId(result.scene_segment_id || null);

        if (result.generated_segment?.components) {
          // Convert the components to script elements
          const scriptElements = api.convertSceneComponentsToElements(result.generated_segment.components);

          // Update elements
          setElements(scriptElements);

          // Select the first element
          if (scriptElements.length > 0) {
            setSelectedElement(scriptElements[0].id);
          }

          // Update state
          setHasCompletedFirstScene(true);
          setActiveTab('scenes');

          // Switch to script view
          handleViewModeChange('script');
          showAlert('success', 'Script generated successfully');
        } else {
          throw new Error('No script components were generated');
        }
      } else {
        throw new Error(result.error || 'Failed to generate script');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate script');
    } finally {
      setIsGeneratingFirstScene(false);
    }
  };

  const getSceneText = (content: string) => {
    return content
      .replace(/<[^>]+>/g, '')
      .replace(/&[^;]+;/g, match => {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = match;
        return textarea.value;
      })
      .trim();
  };

  const createNewElement = useCallback(async (type: ElementType, afterId: string): Promise<string> => {
    const afterElementIndex = elements.findIndex(el => el.id === afterId);
    const afterElement = afterElementIndex >= 0 ? elements[afterElementIndex] : null;
    const currentSegmentId = afterElement?.sceneSegmentId; // Get segment ID from the element it follows

    const newFrontendId = generateTemporaryId('el');
    let newSegmentId = currentSegmentId;
    let segmentNumber: number | undefined = undefined; // Use segmentNumber for API consistency
    let componentPosition: number | undefined = undefined;

    try {
        // If creating a scene heading, it starts a new segment - get next segment number
        if (type === 'scene-heading') {
            newSegmentId = generateTemporaryId('seg');
            segmentNumber = await api.getNextSegmentNumber(scriptId); // Fetch segment number
            // Component position within a new segment usually starts at a default (e.g., 1000)
            componentPosition = 1000; // Or fetch if API supports it for new segments?
            console.log(`Fetched next segment number: ${segmentNumber}`);
        }
        // Otherwise, get next component position within the current segment
        else {
            if (!currentSegmentId) {
                console.error("Cannot determine current segment ID to fetch next component position.");
                // Fallback: Use local calculation based on previous element or timestamp
                componentPosition = (afterElement?.position ?? 0) + 1000;
            } else {
                // This will use local calculation if currentSegmentId is temporary
                componentPosition = await api.getNextComponentPosition(currentSegmentId);
                console.log(`Fetched next component position for segment ${currentSegmentId}: ${componentPosition}`);
            }
        }
    } catch (error) {
        showAlert('error', `Failed to get next position: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fallback to local calculation on API error
        if (type === 'scene-heading') {
            segmentNumber = (afterElement?.segmentPosition ?? Date.now()); // Fallback
            componentPosition = 1000; // Fallback
        } else {
            componentPosition = (afterElement?.position ?? 0) + 1000; // Fallback
        }
        console.error("Falling back to local position calculation due to API error.");
    }


    const newElement: ScriptElementType = {
        id: newFrontendId, // Frontend unique key
        componentId: newFrontendId, // Temporary ID for backend linking
        type,
        content: '',
        sceneSegmentId: newSegmentId, // Can be temp or existing backend ID
        position: componentPosition, // Use fetched or fallback position
        segmentPosition: segmentNumber || 100999, // Use fetched or fallback segment number (only for headings)
        isNew: true // Flag to indicate this hasn't been saved
    };

    setElements(prev => {
        // Find index again in case state changed during async operation
        const currentAfterIndex = prev.findIndex(el => el.id === afterId);
        const newElements = [...prev];
        newElements.splice(currentAfterIndex + 1, 0, newElement);
        // NOTE: Consider if full re-sorting/re-positioning is needed after adding
        return newElements;
    });
    setHasUnsavedChanges(true);
    return newElement.id; // Return frontend ID
}, [elements, scriptId, showAlert, setElements, setHasUnsavedChanges]); 

  const handleNavigateElement = useCallback((currentId: string, direction: 'up' | 'down') => {
    const currentIndex = elements.findIndex(el => el.id === currentId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex >= 0 && targetIndex < elements.length) {
      setSelectedElement(elements[targetIndex].id);
      // Optional: Add a slight delay before focusing might help ensure state update
      // setTimeout(() => {
      //   elementRefs.current[elements[targetIndex].id]?.current?.focusEditorEnd(); // Or a more specific focus method if needed
      // }, 10);
    }
  }, [elements]); // Add elements as a dependency


  const handleElementChange = (id: string, content: string) => {
    setElements(prev =>
        prev.map(el => {
            if (el.id === id) {
                // If it's an existing element (has a non-temporary componentId), mark it as modified
                if (!isTemporaryId(el.componentId) && el.componentId) {
                     modifiedComponentIdsRef.current.add(el.componentId);
                }
                return { ...el, content };
            }
            return el;
        })
    );
    setHasUnsavedChanges(true);
};

const handleKeyDown = useCallback(async ( // Make the handler async
  event: React.KeyboardEvent, // The original React KeyboardEvent
  id: string, // Frontend ID of the element where the event occurred
  splitData?: { beforeContent: string; afterContent: string }, // Data if Enter caused a split
  options?: { mergeUp?: boolean; isFirstElement?: boolean } // Options passed from child (e.g., for Backspace handling)
) => {
  console.log(`ScriptEditor handleKeyDown received: Key='${event.key}', ID='${id}', Options=`, options);

  const currentIndex = elements.findIndex(el => el.id === id);
  if (currentIndex === -1) {
      console.error(`Element with id ${id} not found in handleKeyDown`);
      return;
  }
  const currentElement = elements[currentIndex];

  // --- Enter Key Handling ---
  if (event.key === 'Enter' && !event.shiftKey) {
      // Prevent default is handled in child, but double-check if needed
      // event.preventDefault();

      // Specific logic for completing the first scene heading
      if (currentElement.type === 'scene-heading' && stripHtml(currentElement.content).trim() !== '' && !hasCompletedFirstScene) {
          setHasCompletedFirstScene(true);
          setActiveTab('scenes'); // Assuming setActiveTab is defined
      }

      if (splitData) {
          // Update the current element with the content before the split
          // Use functional update to ensure we work with the latest state
          let newElementId: string | null = null; // To store the ID after creation
          setElements(prevElements => {
              const updatedElements = [...prevElements];
              const currentIdx = updatedElements.findIndex(el => el.id === id);
              if (currentIdx === -1) return prevElements; // Element might have been deleted

              const elementToUpdate = updatedElements[currentIdx];
              const updatedCurrentElement = {
                  ...elementToUpdate,
                  content: splitData.beforeContent
              };
              updatedElements[currentIdx] = updatedCurrentElement;

               // If the original element was existing, mark it as modified
               if (!isTemporaryId(updatedCurrentElement.componentId) && updatedCurrentElement.componentId) {
                  modifiedComponentIdsRef.current.add(updatedCurrentElement.componentId);
               }
               return updatedElements; // Return state without the new element yet
          });

          // Determine the type of the new element AFTER updating the current one
          const nextType = currentElement.type === 'action' ? 'action' : getNextElementType(currentElement.type);

          // ----> AWAIT the creation of the new element <----
          newElementId = await createNewElement(nextType, id);

          // ----> Update the content of the newly created element <----
          // Use functional update again to ensure we target the correct element array
          setElements(prevElements => {
               const finalElements = [...prevElements];
               const finalNewElementIndex = finalElements.findIndex(el => el.id === newElementId);
               if(finalNewElementIndex !== -1) {
                   finalElements[finalNewElementIndex] = {
                       ...finalElements[finalNewElementIndex],
                       content: splitData.afterContent // Set content for the new element
                   };
               } else {
                    console.error("Could not find newly created element after async creation!");
               }
               return finalElements;
           });

           if (newElementId) {
              setSelectedElement(newElementId);
           } else {
                console.error("Failed to get ID for the new element after split!");
                // Fallback? Maybe create a synchronous non-API positioned element?
           }

      } else {
          // Regular Enter: Create a new element of the next type
          const nextType = currentElement.type === 'action' ? 'action' : getNextElementType(currentElement.type);
           // ----> AWAIT the creation <----
          const newId = await createNewElement(nextType, id);
          setSelectedElement(newId);
      }
      setHasUnsavedChanges(true);
      // Assuming resetSuggestions() is defined and necessary
      // resetSuggestions();
  }

  // --- Backspace Key Handling (Merge Up / Delete Empty) ---
  // This relies on the child ScriptElement detecting the empty+start condition and calling this parent handler
  else if (event.key === 'Backspace' && options) { // Check for options passed from child
       event.preventDefault(); // Prevent double handling

       if (options.mergeUp && currentIndex > 0) {
          console.log(`Handling mergeUp request for element ID: ${id}`);
          const previousElement = elements[currentIndex - 1];

          // 1. Track deletion for API save IF it's an existing element from backend
          if (!isTemporaryId(currentElement.componentId) && currentElement.componentId) {
              deletedComponentIdsRef.current.add(currentElement.componentId);
              setHasUnsavedChanges(true);
              // Track segment deletion if it was a non-temporary scene heading
              if (currentElement.type === 'scene-heading' && !isTemporaryId(currentElement.sceneSegmentId) && currentElement.sceneSegmentId) {
                  deletedSegmentIdsRef.current.add(currentElement.sceneSegmentId);
              }
          } // Don't track deletion if it was only a temporary element

          // 2. Remove the current (empty) element from state
          setElements(prev => prev.filter(el => el.id !== id));

          // 3. Set selected element state to the previous element
          setSelectedElement(previousElement.id);

          // 4. Set focus and cursor to the END of the previous element
          requestAnimationFrame(() => {
               const prevElementRef = elementRefs.current[previousElement.id];
               prevElementRef?.current?.focusEditorEnd(); // Ensure ScriptElement exposes focusEditorEnd via useImperativeHandle
          });

       } else if (options.isFirstElement) {
           // Handle backspace on the *first* empty element (prevent deletion)
           console.log("Preventing deletion of the first empty element.");
           // Optionally show an alert
           // showAlert('info', 'Cannot delete the first element.');
       } else {
          // This case might be less common if the child handles most Backspace scenarios internally
          console.warn("Parent Backspace handler called without specific options (mergeUp/isFirstElement). Review logic if needed.");
           // Fallback deletion logic (similar to mergeUp, but without merging focus)
          if (currentIndex > 0 && currentElement.content.trim() === '') {
               if (!isTemporaryId(currentElement.componentId) && currentElement.componentId) {
                   deletedComponentIdsRef.current.add(currentElement.componentId);
                   if (currentElement.type === 'scene-heading' && !isTemporaryId(currentElement.sceneSegmentId) && currentElement.sceneSegmentId) {
                       deletedSegmentIdsRef.current.add(currentElement.sceneSegmentId);
                   }
                   setHasUnsavedChanges(true);
               }
               setElements(prev => prev.filter(el => el.id !== id));
               setSelectedElement(elements[currentIndex - 1].id); // Select previous
               requestAnimationFrame(() => {
                   elementRefs.current[elements[currentIndex - 1].id]?.current?.focusEditorEnd();
               });
          }
       }
  }

  // --- Tab Key Handling ---
  else if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      // Prevent default browser tab behavior
      event.preventDefault();

      // Determine the next logical element type
      const nextType = getNextElementType(currentElement.type);

      // ----> AWAIT the creation <----
      const newId = await createNewElement(nextType, id);

      // Select the newly created element
      setSelectedElement(newId);
      setHasUnsavedChanges(true);
  }

  // Add other key handling logic as needed

}, [elements, hasCompletedFirstScene, createNewElement, setSelectedElement, setHasUnsavedChanges, setActiveTab, getNextElementType, isTemporaryId, modifiedComponentIdsRef, deletedComponentIdsRef, deletedSegmentIdsRef, elementRefs, scriptId]); // Added scriptId because createNewElement uses it

const mapElementTypeToComponentType = (elementType: ElementType): ComponentTypeFE => {
  switch (elementType) {
    case 'scene-heading': return ComponentTypeFE.HEADING;
    case 'action': return ComponentTypeFE.ACTION;
    case 'character': return ComponentTypeFE.CHARACTER;
    case 'dialogue': return ComponentTypeFE.DIALOGUE;
    case 'parenthetical': return ComponentTypeFE.PARENTHETICAL;
    case 'transition': return ComponentTypeFE.TRANSITION;
    default: return ComponentTypeFE.ACTION; // Or throw error
  }
};

  const stripHtml = (html: string): string => {
    // Remove HTML tags
    let text = html.replace(/<[^>]+>/g, '');
    // Replace HTML entities
    text = text.replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    return text;
  };


  const handleSaveOld = async () => {
    if (!scriptId) {
      showAlert('error', 'Script ID is missing');
      return;
    }

    try {
      setIsSaving(true);

      // Group by segment ID (this part is correct)
      const changedSegments: Record<string, any[]> = {};

      // Get modified elements
      const changedElements = elements.filter(el =>
        modifiedElementsRef.current.has(el.id)
      );

      // For each changed element, we need to map back to the original component ID
      changedElements.forEach(el => {
        if (!el.sceneSegmentId) return;

        if (!changedSegments[el.sceneSegmentId]) {
          changedSegments[el.sceneSegmentId] = [];
        }

        // Find original component ID from metadata or use a mapping
        // This is where the problem is - we need to maintain component_id
        const originalComponentId = el.componentId;


        // Convert to backend component format
        changedSegments[el.sceneSegmentId].push({
          id: originalComponentId, // Use the original ID from backend
          component_type: mapElementTypeToComponentType(el.type),
          position: el.position || 0,
          content: stripHtml(el.content), // Remove HTML tags (see next fix)
          character_name: el.type === 'character' ? stripHtml(el.content) : null,
          parenthetical: el.type === 'parenthetical' ? stripHtml(el.content) : null,
        });
      });

      // Handle deleted elements
      const deletedIds = Array.from(deletedElementsRef.current);
      const deletedSegmentIds = Array.from(deletedSegmentsRef.current);

      // Call API to save changes
      // const success = await api.saveScriptChanges(scriptId, {
      //   changedSegments,
      //   deletedElements: deletedIds,
      //   deletedSegments: deletedSegmentIds

      // });
      const success = true

      if (success) {
        // Reset tracking
        modifiedElementsRef.current.clear();
        deletedElementsRef.current.clear();
        deletedSegmentsRef.current.clear();
        setHasUnsavedChanges(false);
        showAlert('success', 'Script saved successfully');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to save script');
    } finally {
      setIsSaving(false);
    }
  };
  const generateSavePayload = (): ScriptChangesRequest => {
    const payload: ScriptChangesRequest = {
        changedSegments: {},
        deletedElements: Array.from(deletedComponentIdsRef.current),
        deletedSegments: Array.from(deletedSegmentIdsRef.current),
        newSegments: [],
        newComponentsInExistingSegments: []
    };

    const currentSegments = new Map<string, ScriptElementType[]>(); // Group elements by segmentId (temp or real)

    // 1. Group elements by their segment ID
    elements.forEach(el => {
        const segId = el.sceneSegmentId || `no-segment-${el.id}`; // Handle elements potentially missing segmentId
        if (!currentSegments.has(segId)) {
            currentSegments.set(segId, []);
        }
        currentSegments.get(segId)!.push(el);
    });

    // 2. Iterate through the grouped segments
    currentSegments.forEach((segmentElements, segmentId) => {
        // Ensure elements within a segment are sorted by position
        segmentElements.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        // Case A: New Segment (temporary segment ID)
        if (isTemporaryId(segmentId)) {
          const newSegment: NewSegment = {
            frontendId: segmentId,
            // Use segmentPosition from the element (fetched/fallback from createNewElement)
            segmentNumber: segmentElements[0]?.segmentPosition ?? Date.now(), // RENAME HERE
            components: segmentElements.map(el => ({
                frontendId: el.componentId,
                component_type: mapElementTypeToComponentType(el.type),
                position: el.position ?? Date.now(), // Use fetched/fallback position
                content: stripHtml(el.content),
    
                    character_name: el.type === 'character' || el.type === 'dialogue' ? stripHtml(el.content) : undefined, // Adjust based on actual parsing
                    parenthetical: el.type === 'parenthetical' ? stripHtml(el.content.replace(/^\(|\)$/g, '')) : undefined,
                }))
            };
            payload.newSegments.push(newSegment);
        }
        // Case B: Existing Segment (backend UUID segment ID)
        else {
            segmentElements.forEach(el => {
                // B.1: New component added to this existing segment?
                if (isTemporaryId(el.componentId)) {
                  console.log('Adding to newComponentsInExistingSegments:', JSON.stringify({
                    el_id: el.id, // Log frontend key
                    el_componentId: el.componentId, // Log the value being assigned
                    el_type: el.type,
                    el_content_snippet: stripHtml(el.content).substring(0, 20), // Log snippet
                    segment_id: segmentId
                }, null, 2));
            
                      payload.newComponentsInExistingSegments.push({
                        frontendId: el.componentId ,
                        segment_id: segmentId,
                        component_type: mapElementTypeToComponentType(el.type),
                        position: el.position ?? Date.now(), // Use fetched/fallback position
                        content: stripHtml(el.content),
                            character_name: el.type === 'character' || el.type === 'dialogue' ? stripHtml(el.content) : undefined, // Adjust parsing
                         parenthetical: el.type === 'parenthetical' ? stripHtml(el.content.replace(/^\(|\)$/g, '')) : undefined,
                     });
                }
                // B.2: Existing component modified?
                else if (modifiedComponentIdsRef.current.has(el.componentId)) {
                    if (!payload.changedSegments[segmentId]) {
                        payload.changedSegments[segmentId] = [];
                    }
                    payload.changedSegments[segmentId].push({
                        id: el.componentId, // Backend Component ID
                        component_type: mapElementTypeToComponentType(el.type),
                        position: el.position ?? 0,
                        content: stripHtml(el.content),
                        character_name: el.type === 'character' || el.type === 'dialogue' ? stripHtml(el.content) : undefined, // Adjust parsing
                        parenthetical: el.type === 'parenthetical' ? stripHtml(el.content.replace(/^\(|\)$/g, '')) : undefined,
                    });
                }
            });
        }
    });

    // Ensure deleted elements/segments that were *only* temporary are not included
    payload.deletedElements = payload.deletedElements.filter(id => !isTemporaryId(id));
    payload.deletedSegments = payload.deletedSegments.filter(id => !isTemporaryId(id));


    console.log("Generated Save Payload:", JSON.stringify(payload, null, 2)); // For debugging
    return payload;
};

  const handleSave = async () => {
    // ... (checks for scriptId, hasUnsavedChanges) ...
    setIsSaving(true);
    try {
      const payload = generateSavePayload();
      // ... (check if payload is empty) ...

      const response = await api.saveScriptChanges(scriptId, payload);

      if (response.success) {
        // Update elements state with new IDs from response.idMappings
        setElements(prevElements => {
             const newElements = prevElements.map(el => {
                 let updatedEl = { ...el };
                 // Update segment ID if it was temporary
                 if (isTemporaryId(el.sceneSegmentId) && response.idMappings.segments[el.sceneSegmentId!]) {
                     updatedEl.sceneSegmentId = response.idMappings.segments[el.sceneSegmentId!];
                 }
                 // Update component ID if it was temporary
                 if (isTemporaryId(el.componentId) && response.idMappings.components[el.componentId]) {
                     updatedEl.componentId = response.idMappings.components[el.componentId];
                 }
                 // Reset the isNew flag if it existed
                 delete updatedEl.isNew;
                 return updatedEl;
             });
             // Don't update initialElementsRef here, let the useEffect handle it
             return newElements;
         });


        // Reset tracking states IMMEDIATELY (before triggering the effect)
        // Although the effect will also clear them, doing it here ensures
        // the state is clean before any potential rapid subsequent actions.
        modifiedComponentIdsRef.current.clear();
        deletedComponentIdsRef.current.clear();
        deletedSegmentIdsRef.current.clear();
        setHasUnsavedChanges(false); // Reset unsaved changes flag

        showAlert('success', response.message || 'Script saved successfully!');
        console.log('Save successful:', response);

        // ----> Increment saveCycle AFTER all state updates <----
        setSaveCycle(prev => prev + 1);

      } else {
        showAlert('error', response.message || 'Failed to save script changes.');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      showAlert('error', error instanceof Error ? error.message : 'An unexpected error occurred during save.');
    } finally {
      setIsSaving(false);
    }
  };


  const handleTypeChangeOld = (id: string, type: ElementType) => {
    setElements(prev =>
        prev.map(el => {
            if (el.id === id) {
                 if (!isTemporaryId(el.componentId) && el.componentId) {
                     modifiedComponentIdsRef.current.add(el.componentId);
                 }
                // Handle potential segment changes if type becomes/stops being scene-heading
                // This might involve creating/removing temporary segment IDs or merging segments
                // (More complex logic needed here depending on desired behavior)
                return { ...el, type };
            }
            return el;
        })
    );
    setHasUnsavedChanges(true);
};

const handleTypeChange = useCallback(async (id: string, newType: ElementType) => { // Make async
  let segmentNumber: number | undefined = undefined;
  let newTempSegmentId: string | undefined = undefined;
  let originalComponentIdToDelete: string | undefined = undefined;
  let newTempComponentId: string | undefined = undefined;

  // --- Logic for changing TO Scene Heading ---
  if (newType === 'scene-heading') {
      try {
          segmentNumber = await api.getNextSegmentNumber(scriptId); // Fetch next segment number
          newTempSegmentId = generateTemporaryId('seg'); // Create temp ID for the new segment
          newTempComponentId = generateTemporaryId('el'); // Create temp ID for the new heading component itself
          console.log(`Changing type to Scene Heading. New Temp Segment ID: ${newTempSegmentId}, Fetched Segment Number: ${segmentNumber}`);
      } catch (error) {
          showAlert('error', `Failed to get next segment number: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Fallback if API fails
          segmentNumber = Date.now();
          newTempSegmentId = generateTemporaryId('seg');
          newTempComponentId = generateTemporaryId('el');
          console.error("Falling back to local segment position calculation.");
      }
  }
  // --- End Logic for Scene Heading ---

  setElements(prev =>
      prev.map(el => {
          if (el.id === id) {
              const originalType = el.type;
              // If changing *to* scene heading
              if (newType === 'scene-heading' && originalType !== 'scene-heading') {
                  // If the original element had a backend ID, mark it for deletion
                  if (!isTemporaryId(el.componentId) && el.componentId) {
                      originalComponentIdToDelete = el.componentId;
                  }
                  // Return the new heading element configuration
                  return {
                      ...el,
                      type: newType,
                      sceneSegmentId: newTempSegmentId, // Assign new temp segment ID
                      segmentPosition: segmentNumber, // Assign fetched segment number
                      componentId: newTempComponentId || el.componentId, // Assign new temp component ID
                      position: 1000, // Reset component position within the new segment
                      isNew: true // Treat this effectively as a new component/segment start
                  };
              }
              // If changing *from* scene heading or just a regular type change
              else {
                   // Mark as modified if it's an existing component
                   if (!isTemporaryId(el.componentId) && el.componentId) {
                      modifiedComponentIdsRef.current.add(el.componentId);
                   }
                   // If changing *from* scene heading, nullify segment-specific info?
                   // This depends on desired behavior - maybe keep segmentPosition?
                   const segmentPosition = newType === 'scene-heading' ? el.segmentPosition : undefined;

                   return {
                       ...el,
                       type: newType,
                       segmentPosition // Keep if still heading, clear otherwise (or adjust as needed)
                      };
              }
          }
          return el;
      })
  );

  // Add the original component ID to the delete list if necessary
  if (originalComponentIdToDelete) {
      deletedComponentIdsRef.current.add(originalComponentIdToDelete);
      console.log(`Marked original component ${originalComponentIdToDelete} for deletion.`);
  }

  setHasUnsavedChanges(true);
}, [scriptId, elements, setElements, setHasUnsavedChanges, showAlert]); 



  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setActiveCommentId(null);
  };

  const handleAddComment = (comment: Comment) => {
    setComments(prev => [...prev, comment]);
    setActiveCommentId(comment.id);
  };

  const handleCommentClick = (comment: Comment) => {
    const elementId = elements.find(el => {
      const elementRef = elementRefs.current[el.id];
      return elementRef?.current?.containsCommentRange?.(comment.from, comment.to);
    })?.id;
    if (elementId) {
      setSelectedElement(elementId);
      setActiveCommentId(comment.id);
      const elementRef = elementRefs.current[elementId];
      elementRef.current?.focusCommentRange?.(comment.from, comment.to);
    }
  };

  const formatFountainContent = () => {
    const titlePageContent = `Title: ${titlePage.title}
Author: ${titlePage.author}
Contact: ${titlePage.contact}
Date: ${titlePage.date}
Draft: ${titlePage.draft}
Copyright: ${titlePage.copyright}

===

`;
    const content = elements.map(el => {
      switch (el.type) {
        case 'scene-heading':
          return `${el.content.toUpperCase()}\n\n`;
        case 'action':
          return `${el.content}\n\n`;
        case 'character':
          return `${el.content.toUpperCase()}\n`;
        case 'parenthetical':
          return `(${el.content.replace(/^\(|\)$/g, '')})\n`;
        case 'dialogue':
          return `${el.content}\n\n`;
        case 'transition':
          return `> ${el.content.toUpperCase()}${!el.content.endsWith(':') ? ':' : ''}\n\n`;
        default:
          return `${el.content}\n\n`;
      }
    }).join('');
    return titlePageContent + content;
  };

  const handleExport = () => {
    const content = formatFountainContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.fountain`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAIAssistClick = () => {
    if (!suggestionsEnabled) {
      setSuggestionsEnabled(true);
    }
    if (!hasOpenedAIAssistant) {
      setIsRightSidebarOpen(true);
      setHasOpenedAIAssistant(true);
    }
  };

  const handleApplySuggestion = (content: string) => {
    if (selectedElement) {
      const currentElement = elements.find(el => el.id === selectedElement);
      if (currentElement) {
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          if (lines.length > 1) {
            const firstLine = lines[0];
            handleElementChange(selectedElement, firstLine);
            let lastId = selectedElement;
            for (let i = 1; i < lines.length; i++) {
              let newType: ElementType = 'action';
              const line = lines[i].trim();
              if (line.toUpperCase() === line && !line.includes('.') && line.length > 0) {
                newType = 'character';
              } else if (line.startsWith('(') && line.endsWith(')')) {
                newType = 'parenthetical';
              } else if (i > 0 && lines[i - 1].toUpperCase() === lines[i - 1] && !lines[i - 1].includes('.')) {
                newType = 'dialogue';
              } else if (line.startsWith('INT.') || line.startsWith('EXT.') || line.includes(' - ')) {
                newType = 'scene-heading';
              } else if (line.toUpperCase() === line && line.includes('TO:')) {
                newType = 'transition';
              }
              lastId = createNewElement(newType, lastId);
              handleElementChange(lastId, line);
            }
            setSelectedElement(lastId);
          } else {
            handleElementChange(selectedElement, content);
          }
        }
      }
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(formatSettings.elements).forEach(([type, format]) => {
      root.style.setProperty(`--${type}-alignment`, format.alignment);
      root.style.setProperty(`--${type}-width`, `${format.width}in`);
      root.style.setProperty(`--${type}-spacing-before`, `${format.spacingBefore}rem`);
      root.style.setProperty(`--${type}-spacing-after`, `${format.spacingAfter}rem`);
    });
    root.style.setProperty('--page-width', `${formatSettings.pageLayout.width}in`);
    root.style.setProperty('--page-height', `${formatSettings.pageLayout.height}in`);
    root.style.setProperty('--page-margin-top', `${formatSettings.pageLayout.marginTop}in`);
    root.style.setProperty('--page-margin-right', `${formatSettings.pageLayout.marginRight}in`);
    root.style.setProperty('--page-margin-bottom', `${formatSettings.pageLayout.marginBottom}in`);
    root.style.setProperty('--page-margin-left', `${formatSettings.pageLayout.marginLeft}in`);
  }, [formatSettings]);

  // Add handler for keyboard events to catch delete operations
  useEffect(() => {
    const handleKeyboardDelete = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement) {
        // Only if element is actually being deleted
        if (elements.find(el => el.id === selectedElement)?.content === '') {
          deletedElementsRef.current.add(selectedElement);
          setHasUnsavedChanges(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyboardDelete);
    return () => document.removeEventListener('keydown', handleKeyboardDelete);
  }, [selectedElement, elements]);

  useEffect(() => {
    const calculatePages = () => {
      if (!contentRef.current) return;
      const pageHeight = formatSettings.pageLayout.height * 72; // Convert inches to points
      const pageBreaks: number[] = [];
      let currentHeight = 0;
      let currentPage = 1;
      const elements = contentRef.current.children;
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        const elementHeight = element.offsetHeight;
        if (currentHeight + elementHeight > pageHeight) {
          pageBreaks.push(i);
          currentHeight = elementHeight;
          currentPage++;
        } else {
          currentHeight += elementHeight;
        }
      }
      setPages(pageBreaks);
    };
    calculatePages();
    const resizeObserver = new ResizeObserver(calculatePages);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [elements, formatSettings]);

  useEffect(() => {
    elements.forEach(element => {
      if (!elementRefs.current[element.id]) {
        elementRefs.current[element.id] = React.createRef();
      }
    });
  }, [elements]);

  useEffect(() => {
    const profile = userProfiles.find(p => p.id === activeProfile);
    if (profile) {
      setFormatSettings(profile.preferences.formatSettings);
    }
  }, [activeProfile, userProfiles]);

  useEffect(() => {
    if (!suggestionsEnabled && isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
    }
  }, [suggestionsEnabled, isRightSidebarOpen]);
  useEffect(() => {
    const fetchMeta = async () => {
      if (scriptId) {
        try {
          const meta = await api.getScriptMetadata(scriptId);
          setScriptMetadata(mapApiResponseToScriptMetadata(meta)); 
          // Map response if needed (like in ScriptEditorPage)
          // setScriptMetadata({
          //     id: meta.id,
          //     title: meta.title || `Script ${scriptId.slice(0, 8)}`,
          //     // genre: meta.genre, // Make sure your interface/mapping includes genre
          //     creationMethod: meta.creation_method,
          //     createdAt: meta.created_at,
          //     updatedAt: meta.updated_at,
          //     isAiGenerated: meta.creation_method === 'WITH_AI',
              
          //     // ... other fields if needed
          // });
          setTitle(meta.title || `Script ${scriptId.slice(0, 8)}`); // Update main title state
        } catch (err) {
          console.error("Error fetching metadata in ScriptEditor:", err);
          // Handle error appropriately
        }
      }
    };
    fetchMeta();
  }, [scriptId, setTitle]);
  useEffect(() => {
    setTitlePage(prev => ({
      ...prev, // Keep existing contact info
      title: (scriptMetadata?.title || 'UNTITLED SCRIPT').toUpperCase(),
      author: user?.user_metadata?.full_name || user?.email || '', // Use user's full name or email as author
      // genre: scriptMetadata?.genre || '', // If you want to store genre, add it to TitlePage interface
    }));
  }, [scriptMetadata, user]);
  

  const handleRetry = () => {
    setHasAttemptedLoad(false);
    setLoadError(null);
  };

  if (isLoadingScript) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading script...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to Load Script</h2>
          <p className="text-gray-600 mb-6">{loadError}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleRequestExpansion = async (componentId: string, actionType: AIActionType ) => {
    if (!componentId) {
    showAlert('error', 'Cannot expand: Missing component ID');
    return;
  }
  console.log("11111", "aa",actionType)
  try {
    // Show loading state
    setIsLoadingExpansion(true);
    
    // Ensure right sidebar is open to show results
    setIsRightSidebarOpen(true);
    
    // Clear any previous results
    setExpansionResults(null);
    setActiveExpansionComponentId(null); // Clear previous active component
    setActiveExpansionActionType(null); // Clear previous action type

    
    console.log("010",actionType)
    if (actionType === "expand") {
      console.log("010",actionType)
      const results = await api.expandComponent(componentId);
      setExpansionResults(results);
      setActiveExpansionComponentId(componentId); // Should be set here
      setActiveExpansionActionType(actionType);   // Should be set here  
    }

    if (actionType === "shorten") {
      const results = await api.shortenComponent(componentId);
      setExpansionResults(results);
      setActiveExpansionComponentId(componentId); // Should be set here
      setActiveExpansionActionType(actionType);   // Should be set here
    }

    if (actionType === "continue") {
      console.log("11111", "aa",actionType)
      const results = await api.continueComponent(componentId);
      setExpansionResults(results);
      setActiveExpansionComponentId(componentId); // Should be set here
      setActiveExpansionActionType(actionType);   // Should be set here
    }

    if (actionType === "rewrite") {
      const results = await api.rewriteComponent(componentId);
      setExpansionResults(results);
      setActiveExpansionComponentId(componentId); // Should be set here
      setActiveExpansionActionType(actionType);   // Should be set here
    }
    
  } catch (error) {
    console.error('Failed to expand content:', error);
    showAlert('error', error instanceof Error ? error.message : 'Failed to expand text');
  } finally {
    setIsLoadingExpansion(false);
  }
};
const handleApplyTransform = async (alternativeText: string, expansionKey: ExpansionType) => {
  // expansionKey might be needed if API requires specific transform type like 'concise' instead of original action 'expand'
  // Using activeExpansionActionType based on user's curl example for 'transform_type'

  if (!activeExpansionComponentId || !activeExpansionActionType) {
      showAlert('error', 'Cannot apply changes: No active transformation context.');
      return;
  }

  console.log(`Applying transform ${activeExpansionActionType} to ${activeExpansionComponentId} with text:`, alternativeText);

  try {
    setIsLoadingExpansion(true); // Show loading indicator while applying

    const response = await api.applyTransform(
      activeExpansionComponentId,
      activeExpansionActionType, // Using the original action type here based on curl example
      alternativeText
    );

    if (response.component) {
      // Update the specific element in the state
      setElements(prevElements =>
        prevElements.map(el => {
          // Find the element matching the component ID from the response
          if (el.componentId === response.component.id) {
            console.log(`Updating element content for componentId: ${el.componentId}`);
            // Create a new object with updated content
            return {
              ...el,
              content: response.component.content || '' // Update content
              // Potentially update type if component_type changed, though unlikely for transforms
              // type: mapComponentTypeToElementType(response.component.component_type) || el.type,
            };
          }
          return el; // Return unchanged elements
        })
      );

      showAlert('success', response.message || 'Changes applied successfully!');

      // Clear expansion state after applying
      setExpansionResults(null);
      setActiveExpansionComponentId(null);
      setActiveExpansionActionType(null);
      setIsRightSidebarOpen(false); // Optionally close sidebar

    } else {
      throw new Error('API response did not contain the updated component.');
    }
  } catch (error) {
    console.error('Failed to apply transform:', error);
    showAlert('error', error instanceof Error ? error.message : 'Failed to apply changes.');
  } finally {
    setIsLoadingExpansion(false);
  }
};

  // Handle empty script state - when elements are empty but script should have content
  const isScriptEmpty = elements.length === 1 && elements[0].content === '';
  const showEmptyStateMessage = isScriptEmpty &&
    scriptState.context.creationMethod === 'WITH_AI' &&
    scriptState.context.hasBeats;

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header
        title={title}
        viewMode={viewMode}
        setViewMode={handleViewModeChange}
        setShowTitlePageModal={setShowTitlePageModal}
        handleExport={handleExport}
        openSettings={() => setShowSettingsModal(true)}
        openAccountSettings={() => setShowAccountSettingsModal(true)}
        userProfiles={userProfiles}
        activeProfile={activeProfile}
        setActiveProfile={setActiveProfile}
        suggestionsEnabled={suggestionsEnabled}
        setSuggestionsEnabled={setSuggestionsEnabled}
        onGenerateScript={handleGenerateScript}
        scriptState={scriptState.state}
        beatsAvailable={beatsAvailable}
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <div className="flex-1 flex overflow-hidden">
        {viewMode !== 'beats' && !isLeftSidebarOpen && (
          <div className="absolute left-0 top-0 w-8 h-full z-20 flex items-center">
            <button
              onClick={() => setIsLeftSidebarOpen(true)}
              className="absolute left-2 text-gray-400 p-2 rounded-full transition-all duration-200 hover:bg-white hover:shadow-lg hover:text-gray-600"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {viewMode !== 'beats' && (
          <LeftSidebar
            isOpen={isLeftSidebarOpen}
            setIsOpen={setIsLeftSidebarOpen}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            elements={elements}
            getSceneText={getSceneText}
            totalWords={elements.reduce((count, el) =>
              count + (el.content.trim() ? el.content.trim().split(/\s+/).length : 0), 0
            )}
            totalPages={pages.length + 1}
            comments={comments}
            onDeleteComment={handleDeleteComment}
            onCommentClick={handleCommentClick}
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
            <div className="text-center p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Boards View</h2>
              <p className="text-gray-600">This feature is coming soon.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="screenplay-container py-8" style={{
              width: `var(--page-width, ${formatSettings.pageLayout.width}in)`,
              margin: '0 auto'
            }}>
              <ScrollPositionManager
                elements={elements}
                selectedElementId={selectedElement}
                contentRef={contentRef}
                elementRefs={elementRefs}
              >
                <div ref={contentRef} className="screenplay-content" style={{
                  padding: `var(--page-margin-top, ${formatSettings.pageLayout.marginTop}in) var(--page-margin-right, ${formatSettings.pageLayout.marginRight}in) var(--page-margin-bottom, ${formatSettings.pageLayout.marginBottom}in) var(--page-margin-left, ${formatSettings.pageLayout.marginLeft}in)`,
                  minHeight: `var(--page-height, ${formatSettings.pageLayout.height}in)`
                }}>
                  {/* Content Loader Component for Progressive Loading */}
                  <ScriptContentLoader
                    scriptId={scriptId}
                    creationMethod={scriptState.context.creationMethod}
                    initialElements={elements}
                    onElementsLoaded={setElements}
                    onSceneSegmentIdUpdate={setCurrentSceneSegmentId}
                    showAlert={showAlert}
                    isGeneratingFirstScene={isGeneratingFirstScene}
                    onGenerateScript={handleGenerateScript}
                  />

                  {/* Script Elements */}
                  {elements.map((element, index) => (
                    <div
                      key={element.id}
                      className="element-wrapper"
                      data-type={element.type}
                      style={{
                        textAlign: formatSettings.elements[element.type].alignment,
                        marginTop: `var(--${element.type}-spacing-before, ${formatSettings.elements[element.type].spacingBefore}rem)`,
                        marginBottom: `var(--${element.type}-spacing-after, ${formatSettings.elements[element.type].spacingAfter}rem)`
                      }}
                    >
                      {pages.includes(index) && (
                        <div className="page-break">
                          <div className="page-number">Page {pages.findIndex(p => p === index) + 2}</div>
                        </div>
                      )}
                      <MemoizedScriptElement
                        id={element.id}
                        type={element.type}
                        content={element.content}
                        isSelected={selectedElement === element.id}
                        onChange={handleElementChange}
                        onKeyDown={handleKeyDown}
                        onFocus={setSelectedElement}
                        onTypeChange={handleTypeChange}
                        autoFocus={element.id === elements[elements.length - 1].id}
                        onAIAssistClick={handleAIAssistClick}
                        elements={elements}
                        onAddComment={handleAddComment}
                        activeCommentId={activeCommentId}
                        comments={comments.filter(c =>
                          elementRefs.current[element.id]?.current?.containsCommentRange?.(c.from, c.to)
                        )}
                        formatSettings={formatSettings.elements[element.type]}
                        suggestions={suggestionsEnabled ? suggestions : undefined}
                        showAITools={suggestionsEnabled}
                        elementRef={elementRefs.current[element.id]}
                        onRequestExpansion={handleRequestExpansion}
                        componentId={element.componentId} // Pass the componentId
                        onNavigateElement={handleNavigateElement}
                      />
                    </div>
                  ))}
                </div>
              </ScrollPositionManager>

              {scriptState.showGenerateNextSceneButton && (
                <GenerateNextSceneButton
                  onClick={handleGenerateNextScene}
                  visible={true}
                  isLoading={isGeneratingNextScene}
                />
              )}
            </div>
          </div>
        )}

        {viewMode !== 'beats' && !isRightSidebarOpen && suggestionsEnabled && (
          <div className="absolute right-0 top-0 w-8 h-full z-20 flex items-center">
            <button
              onClick={() => setIsRightSidebarOpen(true)}
              className="absolute right-2 text-gray-400 p-2 rounded-full transition-all duration-200 hover:bg-white hover:shadow-lg hover:text-gray-600"
            >
              <div className="relative">
                <ChevronLeft className="h-5 w-5" />
                <div className="ai-icon-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75">
                  <div className="ai-icon-pulse"></div>
                  <Sparkles className="ai-icon-sparkle text-blue-500" />
                </div>
              </div>
            </button>
          </div>
        )}

        {viewMode !== 'beats' && (
          <RightSidebar
            isOpen={isRightSidebarOpen}
            setIsOpen={setIsRightSidebarOpen}
            onApplySuggestion={handleApplySuggestion}
            selectedElementId={selectedElement}
            expansionResults={expansionResults}
            isLoadingExpansion={isLoadingExpansion}
            onApplyTransformRequest={handleApplyTransform} // Pass the new handler
            activeExpansionComponentId={activeExpansionComponentId} // Pass the ID
            activeExpansionActionType={activeExpansionActionType} // Pass the action type

          />
        )}
      </div>

      <TitlePageModal
        show={showTitlePageModal}
        onClose={() => setShowTitlePageModal(false)}
        titlePage={titlePage}
        setTitlePage={setTitlePage}
        setTitle={setTitle}
      />

      <SettingsModal
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={formatSettings}
        setSettings={setFormatSettings}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        userProfiles={userProfiles}
        setUserProfiles={setUserProfiles}
        activeProfile={activeProfile}
        setActiveProfile={setActiveProfile}
        suggestionsEnabled={suggestionsEnabled}
        setSuggestionsEnabled={setSuggestionsEnabled}
      />
    <AccountSettingsModal
      isOpen={showAccountSettingsModal}
      onClose={() => setShowAccountSettingsModal(false)}
      displayName={user?.user_metadata?.full_name || user?.email || 'User'}
      email={user?.email || ''}
      onChangeDisplayName={handleChangeDisplayName}
      onChangeEmail={handleChangeEmail}
    />

    </div>
  );
}