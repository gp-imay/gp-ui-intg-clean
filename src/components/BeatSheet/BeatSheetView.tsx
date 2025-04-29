import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCcw, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { BeatCard } from './BeatCard';
import { ScenePanel } from './ScenePanel';
import { BeatArrows } from './BeatArrows';
import { useStoryStore } from '../../store/storyStore';
import { Beat, GeneratedScenesResponse } from '../../types/beats';
import { api } from '../../services/api';
import { useAlert } from '../Alert';
import { ScriptElement } from '../../types/screenplay';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';

const ACTS = ['Act 1', 'Act 2A', 'Act 2B', 'Act 3'] as const;

type ScriptState = 'empty' | 'beatsLoaded' | 'firstSceneGenerated' | 'scriptGenerated';

interface BeatSheetViewProps {
  title?: string;
  onSwitchToScript?: () => void;
  onGeneratedScriptElements?: (elements: ScriptElement[], sceneSegmentId: string) => void;
  currentSceneSegmentId?: string | null;
  beatsAvailable?: boolean;
}

export function BeatSheetView({ 
  title = "Untitled Screenplay", 
  onSwitchToScript,
  onGeneratedScriptElements,
  currentSceneSegmentId,
  beatsAvailable = false
}: BeatSheetViewProps) {
  const { scriptId } = useParams<{ scriptId: string }>();
  const canvasRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [sceneSegmentIdState, setSceneSegmentIdState] = useState<string | null>(null);
  const [scriptState, setScriptState] = useState<ScriptState>('empty');
  const { showAlert } = useAlert();
  const [hasAttemptedBeatsLoad, setHasAttemptedBeatsLoad] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Tour guide steps
  const tourSteps = [
    {
      target: '.p-4.flex.justify-center',
      content: '🎬 Welcome to Your Story Structure! This is your command center for turning ideas into screenplays.',
      placement: 'center' as const,
      disableBeacon: true
    },
    {
      target: '.w-\\[200px\\].flex-shrink-0.border-r',
      content: '📚 Your Story Acts - The screenplay is divided into four acts. Each act contains story beats that drive your narrative forward.',
      placement: 'right' as const
    },
    {
      target: '.min-w-24',
      content: '⚡ Generate entire act at once! Click this to automatically create scene descriptions for all beats in this act.',
      placement: 'right' as const
    },
    {
      target: '.rounded-lg.shadow-lg',
      content: '🎯 Story Beats - Each card represents a pivotal moment. Click the edit button to modify the description, then generate scenes.',
      placement: 'bottom' as const
    },
    {
      target: '.text-blue-600.hover\\:bg-blue-50.rounded-md.border.border-blue-200',
      content: '🤖 AI Scene Generation - Click to transform this beat into detailed scene descriptions. The AI creates scene headings and one-line summaries.',
      placement: 'left' as const
    },
    {
      target: '.flex.items-center.justify-center.gap-1',
      content: '👁️ View Scenes - Click to see generated scenes for this beat. You can edit and refine each scene description.',
      placement: 'left' as const
    },
    {
      target: '.inline-flex.items-center.px-4.py-2.border.border-transparent.text-sm.font-medium.rounded-md.shadow-sm.text-white.bg-green-600',
      content: '🚀 Ready to Write! Click "Generate Script" to transform your first scene into screenplay format. After that, use "Generate Next Scene" in the script editor.',
      placement: 'bottom' as const
    },
    // {
    //   target: '.drag-handle',
    //   content: '↔️ Drag & Drop - Reorder beats by dragging them horizontally within their act.',
    //   placement: 'bottom' as const
    // },
    {
      target: 'body',
      content: '💡 Pro Tip: Start with beats → Generate Scenes → Review & edit Scenes → Generate script. You\'re always in control - AI assists, you decide!',
      placement: 'center' as const
    }
  ];

  // Ref to track if beats have been fetched to prevent duplicate API calls
  const beatsLoadedRef = useRef(false);
  // Ref to track if script generation is in progress
  const scriptGenerationInProgressRef = useRef(false);
  
  const { 
    premise, 
    beats, 
    fetchBeats, 
    updateBeat, 
    updateBeatPosition, 
    validateBeat, 
    generateScenes, 
    generateScenesForAct,
    isGeneratingActScenes,
    actGenerationErrors
  } = useStoryStore();

  // Debug logging for component lifecycle
  useEffect(() => {
    console.log("BeatSheetView mounted");
    
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('beatsheet_tour_completed');
    if (!hasSeenTour && beats.length > 0) {
      // Small delay to ensure elements are rendered
      setTimeout(() => {
        setRunTour(true);
      }, 500);
    }
    
    return () => {
      console.log("BeatSheetView unmounted");
      // Reset fetching refs on unmount
      beatsLoadedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentSceneSegmentId) {
      setSceneSegmentIdState(currentSceneSegmentId);
      setScriptState('firstSceneGenerated');
      console.log("currentSceneSegmentId updated:", currentSceneSegmentId);
    }
  }, [currentSceneSegmentId]);

  // Initial setup - only run once
  useEffect(() => {
    // Set scriptId in the store
    if (scriptId) {
      useStoryStore.getState().setScriptId(scriptId);
    }
    
    // Only set premise if not already set
    if (!premise) {
      useStoryStore.getState().setPremise(title || "Untitled Screenplay");
    }
    
    // Only fetch beats if not already loaded, not currently fetching, and beats are available
    if (beats.length === 0 && !beatsLoadedRef.current && scriptId && beatsAvailable) {
      console.log("Fetching beats for script:", scriptId);
      console.log("Fetching beats...");
      beatsLoadedRef.current = true; // Mark as fetching to prevent duplicate calls
      
      fetchBeats().then(() => {
        console.log("Beats fetched successfully");
        setScriptState('beatsLoaded');
        setHasAttemptedBeatsLoad(true);
      }).catch(error => {
        console.error("Error fetching beats:", error);
        beatsLoadedRef.current = false; // Reset flag on error to allow retry
        showAlert('error', 'Failed to load beats. Please try again.');
        setHasAttemptedBeatsLoad(true);
      });
    } else if (beats.length > 0 && scriptState === 'empty') {
      console.log("Beats already loaded, updating state");
      setScriptState('beatsLoaded');
      setHasAttemptedBeatsLoad(true);
    } else if (!beatsAvailable && !hasAttemptedBeatsLoad) {
      // Mark as attempted if beats are not available
      setHasAttemptedBeatsLoad(true);
    }
  }, [premise, fetchBeats, title, scriptState, showAlert, beats.length, scriptId, beatsAvailable, hasAttemptedBeatsLoad]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height);
    }
  }, []);

  const handleGenerateScript = async () => {
    if (!scriptId) {
      showAlert('error', 'Script ID is missing.');
      return;
    }
    
    // Prevent multiple simultaneous script generation requests
    if (scriptGenerationInProgressRef.current) {
      console.log("Script generation already in progress, ignoring request");
      return;
    }
    
    scriptGenerationInProgressRef.current = true;
    setIsGeneratingScript(true);
    
    try {
      console.log("Generating script for ID:", scriptId);
      const response = await api.generateScript(scriptId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate script');
      }
      
      console.log("Script generation response:", response);
      
      if (response.scene_segment_id && response.scene_segment_id === sceneSegmentIdState) {
        showAlert('info', 'This scene is already in your script. You can generate the next scene once this one is complete.');
        if (onSwitchToScript) {
          onSwitchToScript();
        }
        return;
      }
      
      if (response.generated_segment?.components) {
        const scriptElements = api.convertSceneComponentsToElements(
          response.generated_segment.components
        );
        
        console.log("Converted script elements:", scriptElements.length);
        
        if (!sceneSegmentIdState && response.scene_segment_id) {
          setSceneSegmentIdState(response.scene_segment_id);
          setScriptState('firstSceneGenerated');
        } else if (response.scene_segment_id) {
          setSceneSegmentIdState(response.scene_segment_id);
          setScriptState('scriptGenerated');
        }
        
        if (onGeneratedScriptElements && response.scene_segment_id) {
          onGeneratedScriptElements(scriptElements, response.scene_segment_id);
        } else if (onGeneratedScriptElements) {
          const fallbackId = `generated-${Date.now()}`;
          console.warn('Missing scene_segment_id in response, using fallback:', fallbackId);
          onGeneratedScriptElements(scriptElements, fallbackId);
        }
        
        if (onSwitchToScript) {
          onSwitchToScript();
        }
        
        showAlert('success', 'Script generated successfully!');
      } else {
        throw new Error('No script components were generated');
      }
    } catch (error) {
      console.error('Error generating script:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to generate script');
    } finally {
      setIsGeneratingScript(false);
      scriptGenerationInProgressRef.current = false;
    }
  };

  const handleGenerateScenes = async (beatId: string): Promise<GeneratedScenesResponse> => {
    try {
      console.log("Generating scenes for beat:", beatId);
      return await generateScenes(beatId);
    } catch (error) {
      console.error("Error generating scenes:", error);
      throw error;
    }
  };

  const handleShowScenes = (beat: Beat) => {
    console.log("Toggle scenes for beat:", beat.id);
    setSelectedBeat(selectedBeat?.id === beat.id ? null : beat);
  };

  const handleGenerateScenesForAct = (act: Beat['act']) => {
    console.log("Generating scenes for act:", act);
    generateScenesForAct(act);
  };

  const beatsByAct = ACTS.map(act => ({
    act,
    beats: beats.filter(beat => beat.act === act)
  }));
  
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('beatsheet_tour_completed', 'true');
    }
  };

  console.log("Rendering BeatSheetView with state:", {
    beatsCount: beats.length,
    scriptState,
    isGeneratingScript,
    selectedBeat: selectedBeat?.id,
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Joyride
        steps={tourSteps}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        run={runTour && beats.length > 0}
        styles={{
          options: {
            primaryColor: '#2563eb',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 8,
            padding: 20
          },
          tooltipContent: {
            fontSize: '14px',
            lineHeight: '1.5'
          }
        }}
        callback={handleJoyrideCallback}
      />

      {/* Generate Script button on top */}
      <div ref={headerRef} className="p-4 flex justify-center bg-white border-b">
        <div className="relative">
          <button
            data-event-name="generate_script_beatsheet_page"
            onClick={handleGenerateScript}
            disabled={isGeneratingScript || !beatsAvailable}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
              isGeneratingScript || !beatsAvailable
                ? 'text-gray-500 bg-gray-200 cursor-not-allowed'
                : 'text-white bg-green-600 hover:bg-green-700'
            }`}
            title={!beatsAvailable ? "AI generation is not available for this script type" : ""}
          >
            {isGeneratingScript ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {scriptState === 'firstSceneGenerated' || scriptState === 'scriptGenerated'
                  ? 'Generate Next Scene'
                  : 'Generate Script'}
              </>
            )}
          </button>
        </div>
      </div>

      {!beatsAvailable ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="text-center max-w-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">AI Beats Not Available</h2>
            <p className="text-gray-600 mb-4">
              AI beats are not available for manually created scripts. Please use the script editor to write your screenplay.
            </p>
            <button
              onClick={() => onSwitchToScript?.()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Script Editor
            </button>
          </div>
        </div>
      ) : beats.length === 0 && hasAttemptedBeatsLoad ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="text-center max-w-lg">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Beats Found</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any story beats for this script. You can switch to the script editor to start writing.
            </p>
            <button
              onClick={() => onSwitchToScript?.()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Script Editor
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto relative">
          <div className="flex min-h-full">
            {/* Acts sidebar - increased z-index to ensure it stays on top */}
            <div className="w-[200px] flex-shrink-0 border-r bg-gray-50 sticky left-0 z-10">
              {beatsByAct.map(({ act }) => (
                <div 
                  key={act} 
                  className="h-[220px] flex items-center justify-center border-b last:border-b-0 font-medium text-gray-600 relative"
                >
                  <div className="text-center">
                    {act}
                    {actGenerationErrors[act] && (
                      <div className="absolute top-2 left-2 right-2 p-2 text-xs text-red-600 bg-red-50 rounded-md flex items-center">
                        <AlertCircle className="w-3 h-3 flex-shrink-0 mr-1" />
                        <span className="truncate">{actGenerationErrors[act]}</span>
                      </div>
                    )}
                    <button
                      data-event-name="generate_scenes_for_act_beatsheet_page"
                      onClick={() => handleGenerateScenesForAct(act)}
                      disabled={isGeneratingActScenes[act]}
                      className={`absolute bottom-2 left-1/2 -translate-x-1/2 text-xs ${
                        isGeneratingActScenes[act] 
                          ? 'text-gray-500 bg-gray-100' 
                          : 'text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50'
                      } whitespace-nowrap px-2 py-1 rounded-full shadow-sm border border-blue-100 flex items-center justify-center gap-1 min-w-24`}
                    >
                      {isGeneratingActScenes[act] ? (
                        <>
                          <RefreshCcw className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Scenes For Act'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Beats canvas - set lower z-index to ensure it goes behind sidebar */}
            <div
              ref={canvasRef}
              className={`flex-1 z-0 ${selectedBeat ? 'pr-96' : ''}`}
            >
              {beatsByAct.map(({ act, beats: actBeats }) => (
                <div 
                  key={act} 
                  className="h-[220px] relative border-b last:border-b-0 flex overflow-x-auto"
                  style={{ minWidth: actBeats.length * 320 + 40 }}
                >
                  {actBeats.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 flex-1">
                      No beats for {act}
                    </div>
                  ) : (
                    <>
                      {actBeats.map((beat) => (
                        <BeatCard
                          key={beat.id}
                          beat={beat}
                          onUpdate={updateBeat}
                          onPositionChange={updateBeatPosition}
                          onValidate={validateBeat}
                          onGenerateScenes={handleGenerateScenes}
                          onShowScenes={() => handleShowScenes(beat)}
                          isSelected={selectedBeat?.id === beat.id}
                        />
                      ))}
                      <BeatArrows beats={actBeats} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scene Panel (Fixed Right Sidebar) - high z-index to be on top of everything */}
          {selectedBeat && (
            <div
              className="w-96 border-l bg-white overflow-y-auto fixed right-0 z-20"
              style={{
                top: `${headerHeight}px`,
                height: `calc(100vh - ${headerHeight}px)`,
              }}
            >
              <ScenePanel
                beat={selectedBeat}
                onClose={() => setSelectedBeat(null)}
                onUpdate={(scenes) => {
                  updateBeat(selectedBeat.id, { scenes });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}