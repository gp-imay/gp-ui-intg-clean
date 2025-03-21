import { create } from 'zustand';
import { StoryState, Beat, ApiBeat, GeneratedScenesResponse, Scenes } from '../types/beats';
import {api} from "../services/api";

const mapActFromApi = (apiAct: string): Beat['act'] => {
  const actMap: Record<string, Beat['act']> = {
    'act_1': 'Act 1',
    'act_2a': 'Act 2A',
    'act_2b': 'Act 2B',
    'act_3': 'Act 3'
  };
  return actMap[apiAct.toLowerCase()] || 'Act 1';
};

// Convert from UI format (Act 1) to API format (act_1)
const mapActToApi = (act: Beat['act']): string => {
  const actMap: Record<Beat['act'], string> = {
    'Act 1': 'act_1',
    'Act 2A': 'act_2a',
    'Act 2B': 'act_2b',
    'Act 3': 'act_3'
  };
  return actMap[act];
};

const calculatePosition = (beats: ApiBeat[], currentBeat: ApiBeat): { x: number; y: number } => {
  try {
    const actBeats = beats.filter(b => b.beat_act === currentBeat.beat_act);
    const positionInAct = actBeats.findIndex(b => b.beat_id === currentBeat.beat_id);
    
    // Return default position if calculation would result in NaN
    if (positionInAct === -1) return { x: 20, y: 20 };
    
    return {
      x: positionInAct * 320 + 20,
      y: 20
    };
  } catch (error) {
    console.error("Error calculating position:", error);
    return { x: 0, y: 0 }; // Safe fallback
  }
};

// Mock API response for local development to avoid API calls
const createMockApiResponse = (beatId: string): GeneratedScenesResponse => {
  return {
    success: true,
    context: {
      script_title: "Mock Script",
      // genre: "Drama",
      beat_position: 1,
      template_beat: {
        name: "Mock Beat",
        position: 1,
        description: "A mock beat description",
        number_of_scenes: 2
      },
      source: "mock"
    },
    generated_scenes: [
      {
        id: `scene-${Date.now()}-1`,
        beat_id: beatId,
        position: 1,
        scene_heading: "INT. LIVING ROOM - DAY",
        scene_description: "A mock scene description",
        scene_detail_for_ui: "INT. LIVING ROOM - DAY: A well-lit living room with modern furniture",
        created_at: new Date().toISOString(),
        updated_at: null,
        is_deleted: false,
        deleted_at: null
      },
      {
        id: `scene-${Date.now()}-2`,
        beat_id: beatId,
        position: 2,
        scene_heading: "EXT. PARK - EVENING",
        scene_description: "Another mock scene description",
        scene_detail_for_ui: "EXT. PARK - EVENING: A quiet park with people walking",
        created_at: new Date().toISOString(),
        updated_at: null,
        is_deleted: false,
        deleted_at: null
      }
    ]
  };
};

interface StoryStoreState extends StoryState {
  isGeneratingActScenes: Record<Beat['act'], boolean>;
  actGenerationErrors: Record<Beat['act'], string | null>;
}

// Store setup
export const useStoryStore = create<StoryStoreState>((set, get) => ({
  title: '',
  premise: '',
  scriptId: null,
  beats: [],
  isGeneratingActScenes: {
    'Act 1': false,
    'Act 2A': false,
    'Act 2B': false,
    'Act 3': false
  },
  actGenerationErrors: {
    'Act 1': null,
    'Act 2A': null,
    'Act 2B': null,
    'Act 3': null
  },
  
  setPremise: (premise: string) => set({ premise }),
  setScriptId: (id: string) => set({ scriptId: id }),
  
  // Fetch beats with safety checks
  fetchBeats: async () => {
    // Check if beats are already loaded to prevent duplicate fetches
    const state = get();

    if (state.beats.length > 0) {
      console.log("Beats already loaded, skipping fetch");
      return;
    }
    const scriptId = state.scriptId;
    
    if (!scriptId) {
      console.error("Cannot fetch beats: No script ID provided");
      throw new Error("Script ID is required to fetch beats");
    }

    try {
      const apiBeats = await api.getBeats(scriptId);
      const beats: Beat[] = apiBeats.map((apiBeat: ApiBeat) => ({
        id: apiBeat.beat_id,
        title: apiBeat.beat_title,
        description: apiBeat.beat_description,
        category: apiBeat.beat_title,
        act: mapActFromApi(apiBeat.beat_act),
        position: calculatePosition(apiBeats, apiBeat),
        isValidated: false,
        scenes: [],
      }));
      set({ beats });
    } catch (error) {
      console.error('Failed to fetch beats:', error);
    }

  },
  
  addBeat: (beat: Beat) =>
    set((state) => ({ beats: [...state.beats, beat] })),
  
  updateBeat: async (id: string, beatUpdate: Partial<Beat>) => {
    try {
      // First update local state for immediate UI response
      set((state) => {
        const updatedBeats: Beat[] = state.beats.map((b) =>
          b.id === id ? { ...b, ...beatUpdate } : b
        );
        return { beats: updatedBeats };
      });
      
      // Then make the API call to persist the change
      const response = await api.updateBeat(id, {
        beat_title: beatUpdate.title || '',
        beat_description: beatUpdate.description || '',
        beat_act: mapActToApi(beatUpdate.act || 'Act 1')
      });
      
      console.log("Beat updated successfully via API:", response);
      
      // If the API call succeeds, we can leave the state as is
      // If it fails, we should ideally revert the state or handle the error
      return response;
    } catch (error) {
      console.error("Failed to update beat via API:", error);
      // Optionally revert the state change if API call fails
      throw error;
    }
  },
  
  updateBeatPosition: (id: string, position: { x: number; y: number }) =>
    set((state) => ({
      beats: state.beats.map((b) =>
        b.id === id ? { ...b, position } : b
      ),
    })),
  
  validateBeat: (id: string) =>
    set((state) => ({
      beats: state.beats.map((b) =>
        b.id === id ? { ...b, isValidated: true } : b
      ),
    })),

  generateScenes: async (beatId: string): Promise<GeneratedScenesResponse> => {
    try {
      // Check if beat already has scenes
      const currentBeats = get().beats;
      const state = get(); 
      const beatIndex = currentBeats.findIndex(b => b.id === beatId);
      
      if (beatIndex === -1) {
        throw new Error('Beat not found');
      }
      
      if (currentBeats[beatIndex].scenes.length > 0) {
        console.log(`Beat ${beatId} already has scenes, returning existing scenes`);
        return {
          success: true,
          context: {
            script_title: state.title || "Untitled",
            // genre: "Unknown",
            beat_position: beatIndex + 1,
            template_beat: {
              name: currentBeats[beatIndex].title,
              position: beatIndex + 1,
              description: currentBeats[beatIndex].description,
              number_of_scenes: currentBeats[beatIndex].scenes.length
            },
            source: "local"
          },
          generated_scenes: currentBeats[beatIndex].scenes
        };
      }
      
      // Use mock response for development
      const response = await api.generateScenes(beatId);
      
      set((state) => {
        const updatedBeats: Beat[] = state.beats.map((b) =>
          b.id === beatId
            ? { 
                ...b, 
                scenes: response.generated_scenes,
                isValidated: true 
              }
            : b
        );
        
        return { beats: updatedBeats };
      });
  
      return response;
    } catch (error) {
      console.error('Failed to generate scenes:', error);
      throw error;
    }
  },
  
  generateScenesForAct: async (act: Beat['act']) => {
    try {
      // Set loading state for this act
      set(state => ({
        isGeneratingActScenes: {
          ...state.isGeneratingActScenes,
          [act]: true
        },
        actGenerationErrors: {
          ...state.actGenerationErrors,
          [act]: null
        }
      }));

      // Get all beats for this act that don't have scenes
      const beatsForAct = get().beats.filter(beat => 
        beat.act === act && beat.scenes.length === 0
      );
      
      if (beatsForAct.length === 0) {
        console.log(`No beats without scenes for act ${act}`);
        return;
      }
      
      // Generate scenes for each beat in sequence
      const results = await Promise.all(
        beatsForAct.map(beat => get().generateScenes(beat.id))
      );
      
      console.log(`Generated scenes for ${results.length} beats in ${act}`);
      
    } catch (error) {
      // Set error state for this act
      set(state => ({
        actGenerationErrors: {
          ...state.actGenerationErrors,
          [act]: error instanceof Error ? error.message : 'Failed to generate scenes'
        }
      }));
      console.error(`Failed to generate scenes for act ${act}:`, error);
    } finally {
      // Reset loading state
      set(state => ({
        isGeneratingActScenes: {
          ...state.isGeneratingActScenes,
          [act]: false
        }
      }));
    }
  }
}));