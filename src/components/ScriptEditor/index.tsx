// src/components/ScriptEditor/index.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ScriptElement } from '../ScriptElement';
import { Header } from '../Header';
import { LeftSidebar } from '../LeftSidebar';
import { RightSidebar } from '../RightSidebar';
import { TitlePageModal } from '../TitlePageModal';
import { SettingsModal } from '../Settings';
import { BeatSheetView } from '../BeatSheet/BeatSheetView';
import { AlertProvider, useAlert } from '../Alert';
import { GenerateNextSceneButton } from '../GenerateNextSceneButton';
import { api } from '../../services/api';

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
  ScriptStateValues
} from '../../types/screenplay';

interface ScriptEditorProps {
  scriptId: string;
  initialViewMode?: ViewMode;
  scriptState: ScriptStateValues;
}

export function ScriptEditor({ scriptId, initialViewMode = 'script', scriptState }: ScriptEditorProps) {
  // This ref helps us prevent multiple API calls for the same script ID
  const loadedScriptIdRef = useRef<string | null>(null);
  const [title, setTitle] = useState('Untitled Screenplay');
  const [elements, setElements] = useState<ScriptElementType[]>([
    { id: '1', type: 'scene-heading', content: '' }
  ]);
  const [selectedElement, setSelectedElement] = useState('1');
  // Sidebar state preservation when switching views
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [hasOpenedAIAssistant, setHasOpenedAIAssistant] = useState(false);
  const [currentSceneSegmentId, setCurrentSceneSegmentId] = useState<string | null>(
    scriptState.context.currentSceneSegmentId || null
  );
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const { showAlert } = useAlert();

  // Sidebar state preservation when switching views
  const [previousSidebarStates, setPreviousSidebarStates] = useState<{
    left: boolean;
    right: boolean;
  } | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [showTitlePageModal, setShowTitlePageModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [titlePage, setTitlePage] = useState<TitlePage>({
    title: 'Untitled Screenplay',
    author: '',
    contact: '',
    date: new Date().toLocaleDateString(),
    draft: '1st Draft',
    copyright: `Copyright © ${new Date().getFullYear()}`,
    coverImage: ''
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
  const [suggestionsEnabled, setSuggestionsEnabled] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<{ [key: string]: React.RefObject<any> }>({});
  // const [beatsDisabled, setBeatsDisabled] = useState(false);
  const [beatsAvailable, setBeatsAvailable] = useState(true);



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
  


  // Fetch script segments when the component mounts
  useEffect(() => {
    // Skip if we've already attempted to load or scriptId is missing or already loaded this specific script
    if (!scriptId || hasAttemptedLoad || loadedScriptIdRef.current === scriptId) {
      setIsLoadingScript(false);
      return;
    }

    // Remember this script ID to prevent duplicate loads
    loadedScriptIdRef.current = scriptId;

    async function fetchScriptSegments() {
      try {
        setIsLoadingScript(true);
        setLoadError(null);

        // Get script metadata first to set title and other properties
        const metadata = await api.getScriptMetadata(scriptId);
        setTitle(metadata.title || `Script ${scriptId.slice(0, 8)}`);

        // If script has scenes, fetch the segments
        if (scriptState.context.scenesCount > 0) {
          const data = await api.getScriptSegments(scriptId);

          if (data.segments && data.segments.length > 0) {
            // Convert segments to script elements
            const scriptElements = api.convertSegmentsToScriptElements(data.segments);

            // Only update if we got some elements
            if (scriptElements.length > 0) {
              setElements(scriptElements);
              setSelectedElement(scriptElements[0].id);
              setHasCompletedFirstScene(true);
              setActiveTab('scenes');
            }
          } else {
            console.log('No segments returned from API, but request was successful');
          }
        }
        showAlert('success', 'Script loaded successfully');
      } catch (error) {
        console.error('Failed to fetch script segments:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load script');
        showAlert('error', error instanceof Error ? error.message : 'Failed to load script');
      } finally {
        setIsLoadingScript(false);
        setHasAttemptedLoad(true);
      }
    }
    fetchScriptSegments();
  }, [scriptId, showAlert, hasAttemptedLoad, scriptState.context.scenesCount]);

  // Handle generated script elements from the BeatSheetView
  const handleGeneratedScriptElements = (generatedElements: ScriptElementType[], sceneSegmentId: string) => {
    // Save the scene segment ID
    setCurrentSceneSegmentId(sceneSegmentId);
    // Replace empty elements with generated ones, or append them if there's content
    if (elements.length === 1 && elements[0].content === '') {
      setElements(generatedElements);
    } else {
      setElements([...elements, ...generatedElements]);
    }
    // Select the first element of the generated script
    if (generatedElements.length > 0) {
      setSelectedElement(generatedElements[0].id);
    }
    // Update application state
    setHasCompletedFirstScene(true);
    setActiveTab('scenes');
    // Switch to script view
    handleViewModeChange('script');
  };

  // Generate next scene handler
  const handleGenerateNextScene = async () => {
    if (!currentSceneSegmentId) {
      showAlert('error', 'No current scene found to continue from');
      return;
    }
    try {
      // Call the API directly to generate the next scene
      const result = await api.generateNextScene(scriptId, currentSceneSegmentId);
      if (result.success) {
        // Update the scene segment ID
        setCurrentSceneSegmentId(result.scene_segment_id || null);
        // Fetch the new scene content
        const data = await api.getScriptSegments(scriptId);
        if (data.segments && data.segments.length > 0) {
          // Get only the newest segment (the generated one)
          const newSegment = data.segments[data.segments.length - 1];
          const newElements = api.convertSceneComponentsToElements(newSegment.components);
          // Append the new elements to the existing script
          setElements(prev => [...prev, ...newElements]);
          // Select the first element of the new scene and scroll into view
          if (newElements.length > 0) {
            setSelectedElement(newElements[0].id);
            setTimeout(() => {
              const elementRef = elementRefs.current[newElements[0].id];
              if (elementRef?.current) {
                elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 100);
          }
          showAlert('success', 'Next scene generated successfully');
        }
      } else {
        throw new Error('Failed to generate next scene');
      }
    } catch (error) {
      console.error('Error generating next scene:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate next scene');
    }
  };

  // Generate first script from beats
  const handleGenerateScript = async () => {
    try {
      // Call the API directly to generate the script
      const result = await api.generateScript(scriptId);
      if (result.success) {
        // Set the scene segment ID
        setCurrentSceneSegmentId(result.scene_segment_id || null);
        // Fetch the new scene content
        const data = await api.getScriptSegments(scriptId);
        if (data.segments && data.segments.length > 0) {
          const scriptElements = api.convertSegmentsToScriptElements(data.segments);
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
        }
      } else {
        throw new Error('Failed to generate script');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate script');
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

  const createNewElement = (type: ElementType, afterId: string) => {
    const newElement: ScriptElementType = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: ''
    };
    setElements(prev => {
      const index = prev.findIndex(el => el.id === afterId);
      const newElements = [...prev];
      newElements.splice(index + 1, 0, newElement);
      return newElements;
    });
    return newElement.id;
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string, splitData?: { beforeContent: string; afterContent: string }) => {
    const currentElement = elements.find(el => el.id === id);
    if (!currentElement) return;
    const currentIndex = elements.findIndex(el => el.id === id);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const targetIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex >= 0 && targetIndex < elements.length) {
        setSelectedElement(elements[targetIndex].id);
      }
      return;
    }
    if (e.key === 'Backspace') {
      if (currentIndex > 0 && currentElement.content.trim() === '') {
        e.preventDefault();
        const previousElement = elements[currentIndex - 1];
        const updatedElements = elements.filter(el => el.id !== id);
        setElements(updatedElements);
        setSelectedElement(previousElement.id);
        return;
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextType = getNextElementType(currentElement.type);
      const newId = createNewElement(nextType, id);
      setSelectedElement(newId);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentElement.type === 'scene-heading' &&
        currentElement.content.trim() !== '' &&
        !hasCompletedFirstScene) {
        setHasCompletedFirstScene(true);
        setActiveTab('scenes');
      }
      if (splitData) {
        const updatedElements = [...elements];
        updatedElements[currentIndex] = {
          ...currentElement,
          content: splitData.beforeContent.trim()
        };
        const nextType = currentElement.type === 'action' ? 'action' : getNextElementType(currentElement.type);
        const newElement: ScriptElementType = {
          id: Math.random().toString(36).substr(2, 9),
          type: nextType,
          content: splitData.afterContent.trim()
        };
        updatedElements.splice(currentIndex + 1, 0, newElement);
        setElements(updatedElements);
        setSelectedElement(newElement.id);
      } else {
        const nextType = currentElement.type === 'action' ? 'action' : getNextElementType(currentElement.type);
        const newId = createNewElement(nextType, id);
        setSelectedElement(newId);
      }
    }
  }, [elements, hasCompletedFirstScene]);

  const handleElementChange = (id: string, content: string) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, content } : el
    ));
  };

  const handleTypeChange = (id: string, type: ElementType) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, type } : el
    ));
  };

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

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      <Header
        title={title}
        viewMode={viewMode}
        setViewMode={handleViewModeChange}
        setShowTitlePageModal={setShowTitlePageModal}
        handleExport={handleExport}
        openSettings={() => setShowSettingsModal(true)}
        userProfiles={userProfiles}
        activeProfile={activeProfile}
        setActiveProfile={setActiveProfile}
        suggestionsEnabled={suggestionsEnabled}
        setSuggestionsEnabled={setSuggestionsEnabled}
        onGenerateScript={handleGenerateScript}
        scriptState={scriptState.state}
        beatsAvailable={beatsAvailable}

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
              // beatsDisabled={beatsDisabled} // Pass the beatsDisabled state
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
              <div ref={contentRef} className="screenplay-content" style={{
                padding: `var(--page-margin-top, ${formatSettings.pageLayout.marginTop}in) var(--page-margin-right, ${formatSettings.pageLayout.marginRight}in) var(--page-margin-bottom, ${formatSettings.pageLayout.marginBottom}in) var(--page-margin-left, ${formatSettings.pageLayout.marginLeft}in)`,
                minHeight: `var(--page-height, ${formatSettings.pageLayout.height}in)`
              }}>
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
                    <ScriptElement
                      ref={elementRefs.current[element.id]}
                      {...element}
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
                    />
                  </div>
                ))}
              </div>

              {scriptState.showGenerateNextSceneButton && (
                <GenerateNextSceneButton
                  onClick={handleGenerateNextScene}
                  visible={true}
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
    </div>
  );
}
