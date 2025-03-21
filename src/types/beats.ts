interface Scene {
    id: string;
    description: string;
    notes: string;
  }
  
  export interface Beat {
    id: string;
    title: string;
    description: string;
    category: string;
    act: 'Act 1' | 'Act 2A' | 'Act 2B' | 'Act 3';
    position: { x: number; y: number };
    isValidated: boolean;
    scenes: Scenes[];
  }
  
  export interface ApiBeat {
    position: number;
    beat_title: string;
    beat_description: string;
    beat_id: string;
    beat_act: string;
    script_id: string;
  }
  
  export interface StoryState {
    title: string;
    premise: string;
    scriptId: string | null; 
    setPremise: (premise: string) => void;
    setScriptId: (id: string) => void; 
    beats: Beat[];
    fetchBeats: () => Promise<void>;
    addBeat: (beat: Beat) => void;
    updateBeat: (id: string, beat: Partial<Beat>) => void;
    updateBeatPosition: (id: string, position: { x: number; y: number }) => void;
    validateBeat: (id: string) => void;
    generateScenes: (beatId: string) => Promise<GeneratedScenesResponse>;  // Updated return type
    generateScenesForAct: (act: Beat['act']) => void;
  }
  
  export interface Scenes {
    id: string;
    beat_id: string;
    position: number;
    scene_heading: string;
    scene_description: string;
    scene_detail_for_ui: string;
    created_at: string;
    updated_at: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
  }
  
  export interface GeneratedScenesResponse {
    success: boolean;
    context: {
      script_title: string;
      // genre: string;
      beat_position: number;
      template_beat: {
        name: string;
        position: number;
        description: string;
        number_of_scenes: number;
      };
      source: string;
    };
    generated_scenes: Scenes[];
  }
  
  interface ActSceneGenerationBeat {
    beat_id: string;
    beat_title: string;
    start_idx: number;
    end_idx: number;
  }
  
  interface ActSceneGenerationContext {
    script_id: string;
    script_title: string;
    genre: string;
    act: string;
    total_beats: number;
    existing: ActSceneGenerationBeat[];
    generated: any[];
    source: string;
  }
  