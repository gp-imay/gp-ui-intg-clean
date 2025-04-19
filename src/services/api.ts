// src/services/api.ts
import { ApiBeat, GeneratedScenesResponse, Scenes } from '../types/beats';
import { ScriptElement, ElementType, ScriptCreationMethod, ScriptMetadata, AIActionType, ScriptChangesRequest, ScriptChangesResponse } from '../types/screenplay';
import { supabase } from '../lib/supabase';

// const API_BASE_URL = 'https://script-manager-api-dev.azurewebsites.net/api/v1';
// const API_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Updated getToken function to use Supabase session
const getToken = async () => {
  try {
    // Try to get the token from the current Supabase session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session.access_token;
    }

    // Fallback to localStorage or sessionStorage if no active session
    const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    // Final fallback to a default token (only for development/testing)
    const defaultToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImJPb1NwQjZjMEVUNmpVMmMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2hhd3Zna2lybG1kZ2JkbXV0dXFoLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MGJiZDRlMy1kNWRjLTQzMDMtYTcyYy02YjM0YjNiNGQ0MWYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQxODEzOTA5LCJpYXQiOjE3NDE4MTAzMDksImVtYWlsIjoiaW1heWF5b2dpQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJpbWF5YXlvZ2lAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZ1bGxfbmFtZSI6IkltYXlhIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI3MGJiZDRlMy1kNWRjLTQzMDMtYTcyYy02YjM0YjNiNGQ0MWYifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc0MTgxMDMwOX1dLCJzZXNzaW9uX2lkIjoiYWVhNzAwZTMtYzVlMC00MTYzLWFhMjQtN2YxNTIxNTRhM2Y3IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.6vmWF-mFahaCYHbVt8dL6WMXGoWAu3XIDoc531KyLnc';

    return storedToken || defaultToken;
  } catch (error) {
    console.error('Error getting token:', error);
    throw new Error('Authentication token not available. Please sign in again.');
  }
};

// Updated error handler to provide user-friendly messages
const handleApiError = (error: any, defaultMessage: string = 'An error occurred with the API request'): never => {
  console.error('API Error:', error);

  let errorMessage = defaultMessage;

  if (error.response) {
    try {
      const errorData = error.response.data;
      errorMessage = errorData.detail || errorData.message || `API error: ${error.response.status}`;
    } catch {
      errorMessage = `API error: ${error.response.status || 'Unknown status'}`;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }

  throw new Error(errorMessage);
};

// Interface for the scene segment generation response
interface ComponentTypeAI {
  HEADING: "HEADING";
  ACTION: "ACTION";
  DIALOGUE: "DIALOGUE";
  CHARACTER: "CHARACTER";
  TRANSITION: "TRANSITION";
}

interface SaveChangesRequest {
  changedSegments: Record<string, any[]>; // segment ID -> array of components
  deletedElements: string[]; // array of deleted scene component ids
  deletedSegments: string[]; // array of deleted scene segment ids
}

interface AISceneComponent {
  component_type: keyof ComponentTypeAI;
  position: number;
  content: string;
  character_name: string | null;
  parenthetical: string | null;
  component_id: string; // Add component_id property
  id: string;
}

interface GeneratedSceneSegment {
  components: AISceneComponent[];
}

interface SceneSegmentGenerationResponse {
  success: boolean;
  input_context?: Record<string, any>;
  generated_segment?: GeneratedSceneSegment;
  fountain_text?: string;
  error?: string;
  scene_segment_id?: string;
  creation_method: string;
  message: string;
}

interface SceneSegment {
  id: string;
  beat_id?: string;
  scene_description_id?: string;
  created_at: string;
  updated_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  components: AISceneComponent[];
  position?: number; 
}

interface SegmentListResponse {
  segments: SceneSegment[];
  total: number;
}

interface UpdateBeatPayload {
  beat_title: string;
  beat_description: string;
  beat_act: string;
}

// Interface for the Act Scene Generation request
interface GenerateScenesForActPayload {
  script_id: string;
  act: string;
}

// Interface for Act Scene Generation response
interface ActScenesResponse {
  success: boolean;
  context: {
    script_id: string;
    script_title: string;
    genre: string;
    act: string;
    total_beats: number;
    existing: Array<{
      beat_id: string;
      beat_title: string;
      start_idx: number;
      end_idx: number;
    }>;
    generated: any[];
    source: string;
  };
  generated_scenes: Scenes[];
}

// NEW: Interface for creating scripts
interface CreateScriptPayload {
  title: string;
  subtitle?: string;
  genre?: string;
  story?: string;
  creation_method: ScriptCreationMethod;
}

// NEW: Interface for script creation response
interface CreateScriptResponse {
  id: string;
  title: string;
  subtitle?: string;
  genre?: string;
  story?: string;
  creation_method: ScriptCreationMethod;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// NEW: Interface for script metadata response
export interface ScriptMetadataResponse {
  id: string;
  title: string;
  subtitle?: string;
  genre?: string;
  story?: string;
  creation_method: ScriptCreationMethod;
  created_at: string;
  updated_at: string;
  user_id: string;
  current_scene_segment_id?: string;
  total_scenes?: number;
  total_beats?: number;
}


export interface ScriptExpansion {
  explanation: string;
  expanded_text: string;
}

export interface ExpandComponentResponse {
  component_id: string;
  original_text: string;
  concise: ScriptExpansion;
  dramatic: ScriptExpansion;
  // minimal: ScriptExpansion;
  // poetic: ScriptExpansion;
  humorous: ScriptExpansion;
}
interface ApplyTransformPayload {
  transform_type: AIActionType | ExpansionType; // Or define a more specific type if needed
  alternative_text: string;
}

// Interface for the apply transform response component
interface ApplyTransformResponseComponent {
  content: string;
  parenthetical: string | null;
  updated_at: string;
  deleted_at: string | null;
  scene_segment_id: string;
  component_type: keyof ComponentTypeAI;
  position: number;
  character_name: string | null;
  created_at: string;
  id: string; // Assuming backend sends 'id' here, adjust if it's 'component_id'
  is_deleted: boolean;
}

// Interface for the full apply transform response
interface ApplyTransformResponse {
  component: ApplyTransformResponseComponent;
  was_updated: boolean;
  was_recorded: boolean;
  message: string;
}
interface NextSegmentNumberResponse {
  next_segment_number: number;
}

interface NextComponentPositionResponse {
  next_component_position: number;
}

// export type ExpansionType = 'concise' | 'dramatic' | 'minimal' | 'poetic' | 'humorous';
export type ExpansionType = 'concise' | 'dramatic'  | 'humorous';

// Map AI component types to editor element types
function mapComponentTypeToElementType(componentType: keyof ComponentTypeAI): ElementType {
  const typeMap: Record<keyof ComponentTypeAI, ElementType> = {
    'HEADING': 'scene-heading',
    'ACTION': 'action',
    'DIALOGUE': 'dialogue',
    'CHARACTER': 'character',
    'TRANSITION': 'transition'
  };
  return typeMap[componentType] || 'action';
}

// Helper function to map the API response to the frontend ScriptMetadata type
export function mapApiResponseToScriptMetadata(response: ScriptMetadataResponse): ScriptMetadata {
  if (!response) {
      // Handle null or undefined input if necessary, maybe return a default or throw
      console.error("Received null or undefined response in mapApiResponseToScriptMetadata");
      // Returning a partial object or throwing might be appropriate depending on desired handling
      return {
           id: '',
           title: 'Error: Missing Metadata',
           creationMethod: 'FROM_SCRATCH', // Default or best guess
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           isAiGenerated: false,
      };
  }
  return {
    id: response.id,
    title: response.title || `Script ${response.id?.slice(0, 8) || 'Unknown'}`, // Provide default title
    creationMethod: response.creation_method,
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    isAiGenerated: response.creation_method === 'WITH_AI', // Calculate boolean flag
    isUploaded: response.creation_method === 'UPLOAD', // Calculate boolean flag
    currentSceneSegmentId: response.current_scene_segment_id,
    // uploadedFileType: response.creation_method === 'UPLOAD' ? 'pdf' : undefined // Adjust if backend provides specific type
  };
}
// Generate a unique ID for components without an ID
function generateUniqueId(prefix: string = 'comp'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add a sorting utility for components
function sortComponentsByPosition(components: AISceneComponent[]): AISceneComponent[] {
  return [...components].sort((a, b) => a.position - b.position);
}

// Add a utility to check for duplicate segment IDs
function isSegmentDuplicate(segmentId: string, existingElements: ScriptElement[]): boolean {
  return existingElements.some(element => element.sceneSegmentId === segmentId);
}

export const api = {
  
  // NEW: Create a new script
  async createScript(payload: Omit<CreateScriptPayload, 'creation_method'>, creationMethod: ScriptCreationMethod = 'FROM_SCRATCH'): Promise<CreateScriptResponse> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scripts/`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...payload,
            creation_method: creationMethod
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create script: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to create script');
    }
  },

  // NEW: Get script metadata
  async getScriptMetadata(scriptId: string): Promise<ScriptMetadataResponse> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scripts/${scriptId}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get script metadata: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to get script information');
    }
  },

  // NEW: Upload a script file
  async uploadScript(file: File, scriptId?: string): Promise<CreateScriptResponse> {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      if (scriptId) {
        formData.append('script_id', scriptId);
      }

      const response = await fetch(
        `${API_BASE_URL}/scripts/upload`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload script: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to upload script file');
    }
  },

  // Updated: Get beats with better error handling
  async getBeats(scriptId: string): Promise<ApiBeat[]> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/beats/${scriptId}/beatsheet`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch beats: ${errorText || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to fetch script beats');
    }
  },

  // Updated: Update beat with better error handling
  async updateBeat(beatId: string, payload: UpdateBeatPayload): Promise<ApiBeat> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/beats/${beatId}`,
        {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update beat: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to update beat information');
    }
  },

  // Updated: Generate scenes with better error handling
  async generateScenes(beatId: string): Promise<GeneratedScenesResponse> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-descriptions/beat`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ beat_id: beatId })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate scenes: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to generate scenes for this beat');
    }
  },

  // Updated: Update scene description with better error handling
  async updateSceneDescription(sceneId: string, scene_detail_for_ui: string): Promise<Scenes> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-descriptions/${sceneId}`,
        {
          method: 'PATCH',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ scene_detail_for_ui })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update scene: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to update scene description');
    }
  },

  // Updated: Generate scenes for act with better error handling
  async generateScenesForAct(act: string, scriptId: string = '73638436-9d3d-4bc4-89ef-9d7b9e5141df'): Promise<ActScenesResponse> {
    try {
      const token = await getToken();
      const payload: GenerateScenesForActPayload = {
        script_id: scriptId,
        act: act.toLowerCase().replace(' ', '_') // Convert "Act 1" to "act_1"
      };

      const response = await fetch(
        `${API_BASE_URL}/scene-descriptions/act`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate scenes for act: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return handleApiError(error, 'Failed to generate scenes for this act');
    }
  },

  // Updated: Generate script with better error handling and scriptId parameter
  async generateScript(scriptId: string): Promise<SceneSegmentGenerationResponse> {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/ai/get-or-generate-first`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ script_id: scriptId })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate script: ${errorText || response.statusText}`);
      }

      const data: SceneSegmentGenerationResponse = await response.json();
      return data;
    } catch (error) {
      return handleApiError(error, 'Failed to generate script');
    }
  },

  // NEW: Generate next scene
  async generateNextScene(scriptId: string, currentSceneSegmentId: string): Promise<SceneSegmentGenerationResponse> {
    try {
      if (!scriptId) {
        throw new Error('Script ID is required to generate the next scene');
      }

      const token = await getToken();

      console.log(`Generating next scene for script ${scriptId}, continuing from scene ${currentSceneSegmentId}`);

      const response = await fetch(
        `${API_BASE_URL}/scene-segments/ai/generate-next`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            script_id: scriptId,
            previous_scene_segment_id: currentSceneSegmentId || undefined // Only include if it exists
          })
        }
      );

      if (!response.ok) {
        let errorMessage: string;

        try {
          // Try to parse error response
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `Failed to generate next scene: ${response.status} ${response.statusText}`;
        } catch (e) {
          // If parsing fails, use status text
          errorMessage = `Failed to generate next scene: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const data: SceneSegmentGenerationResponse = await response.json();

      // Validate the response data
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate the next scene');
      }

      // Log success for debugging
      console.log(`Successfully generated next scene: ${data.scene_segment_id}`);

      return data;
    } catch (error) {
      console.error('Error generating next scene:', error);

      // Rethrow with a user-friendly message
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Failed to generate the next scene due to an unexpected error');
      }
    }
  },

  
  // Updated: Get script segments with pagination support and better error handling
  async getScriptSegments(scriptId: string, skip: number = 0, limit: number = 20): Promise<SegmentListResponse> {
    try {
      if (!scriptId) {
        throw new Error('Script ID is required to fetch script segments');
      }
      
      const token = await getToken();
      console.log(`Fetching script segments for ${scriptId}, skip=${skip}, limit=${limit}`);
      
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/script/${scriptId}?skip=${skip}&limit=${limit}`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        let errorMessage = `Failed to fetch script segments: ${response.status}`;
        
        try {
          // Try to parse error message from response
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (e2) {
            // If all else fails, use the status code
            console.error('Could not extract error details', e2);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Ensure we handle empty or malformed responses properly
      const responseText = await response.text();
      let data: SegmentListResponse;
      
      try {
        // Try to parse as JSON
        if (responseText.trim()) {
          data = JSON.parse(responseText);
        } else {
          console.warn('Empty response from API');
          // Return a valid but empty response object
          data = { segments: [], total: 0 };
        }
      } catch (e) {
        console.error('Failed to parse response as JSON:', e, 'Response was:', responseText);
        // Return a valid but empty response to avoid breaking the app
        data = { segments: [], total: 0 };
      }
      
      // Ensure segments property exists
      if (!data.segments) {
        console.warn('Response missing segments property', data);
        data.segments = [];
      }
      
      // Ensure total property exists - if not provided, use segment count
      if (data.total === undefined) {
        // If we got fewer items than the limit, we can assume total = skip + returnedItems
        // Otherwise set total to a value that will trigger loading more
        if (data.segments.length < limit) {
          data.total = skip + data.segments.length;
        } else {
          data.total = skip + data.segments.length + 1; // +1 to ensure we try loading more
        }
      }
      
      console.log(`Fetched ${data.segments.length} segments, total: ${data.total}`);
      return data;
    } catch (error) {
      console.error('Error fetching script segments:', error);
      return handleApiError(error, 'Failed to fetch script segments');
    }
  },

  async saveScriptChangesOld(scriptId: string, changes: SaveChangesRequest): Promise<boolean> {
    try {
      console.log("logging changes : ",changes)
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/${scriptId}/changes`,
        {
          method: 'PUT',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(changes)
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Failed to save: ${response.status}`);
      }
  
      return true;
    } catch (error) {
      return handleApiError(error, 'Failed to save script changes');
    }
  },
  async saveScriptChanges(scriptId: string, changes: ScriptChangesRequest): Promise<ScriptChangesResponse> { // Return the full response
    try {
      console.log("Saving changes for script:", scriptId);
      console.log("Payload:", JSON.stringify(changes, null, 2));
      if (!scriptId) {
         throw new Error("Script ID is missing for saving changes.");
      }
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/${scriptId}/changes`, // Use the correct endpoint
        {
          method: 'PUT', // Use PUT or POST as appropriate for your backend
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(changes)
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Attempt to get more specific error message
        const errorMessage = responseData?.message || responseData?.detail || `Failed to save: ${response.status} ${response.statusText}`;
        console.error("Save API Error Response:", responseData);
        throw new Error(errorMessage);
      }

      console.log("Save API Success Response:", responseData);
      if (!responseData.success) {
           throw new Error(responseData.message || 'Backend reported failure but returned 2xx status.');
      }

       // Ensure idMappings exists, even if empty
       if (!responseData.idMappings) {
         responseData.idMappings = { segments: {}, components: {} };
       }
       if (!responseData.idMappings.segments) responseData.idMappings.segments = {};
       if (!responseData.idMappings.components) responseData.idMappings.components = {};


      return responseData; // Return the full response data including mappings

    } catch (error) {
      console.error("Error in saveScriptChanges:", error);
      // Ensure a consistent error format is thrown
       if (error instanceof Error) {
            throw error; // Re-throw existing Error objects
       } else {
            throw new Error('An unexpected error occurred while saving script changes.'); // Create a new Error for other cases
       }
    }
  },
  async  expandComponent(componentId: string): Promise<ExpandComponentResponse> {
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/components/${componentId}/expand`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to expand text`);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Failed to expand component:', error);
      throw error;
    }
  },

  async  shortenComponent(componentId: string): Promise<ExpandComponentResponse> {
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/components/${componentId}/shorten`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to expand text`);
      }
  
      const originalResponse = await response.json();
      // Normalize the response to have consistent property names
      const normalizedResponse = {
        ...originalResponse,
        concise: originalResponse.concise ? {
          ...originalResponse.concise,
          expanded_text: originalResponse.concise.shortened_text || originalResponse.concise.expanded_text || originalResponse.concise.rewritten_text || originalResponse.concise.continuation_text
        } : undefined,
        dramatic: originalResponse.dramatic ? {
          ...originalResponse.dramatic,
          // expanded_text: originalResponse.dramatic.shortened_text || originalResponse.dramatic.expanded_text
          expanded_text: originalResponse.dramatic.shortened_text || originalResponse.dramatic.expanded_text || originalResponse.dramatic.rewritten_text || originalResponse.dramatic.continuation_text
        } : undefined,
        // Normalize other properties similarly
        // minimal: originalResponse.minimal ? {
        //   ...originalResponse.minimal,
        //   expanded_text: originalResponse.minimal.shortened_text || originalResponse.minimal.expanded_text || originalResponse.minimal.rewritten_text || originalResponse.minimal.continuation_text
        // } : undefined,
        humorous: originalResponse.humorous ? {
          ...originalResponse.humorous,
          expanded_text: originalResponse.humorous.shortened_text || originalResponse.humorous.expanded_text || originalResponse.humorous.rewritten_text || originalResponse.humorous.continuation_text
        } : undefined,
        // poetic: originalResponse.poetic ? {
        //   ...originalResponse.poetic,
        //   expanded_text: originalResponse.poetic.shortened_text || originalResponse.poetic.expanded_text || originalResponse.poetic.rewritten_text || originalResponse.poetic.continuation_text
        // } : undefined,
      };
      return normalizedResponse;
    } catch (error) {
      console.error('Failed to expand component:', error);
      throw error;
    }
  },
  async  continueComponent(componentId: string): Promise<ExpandComponentResponse> {
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/components/${componentId}/continue`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to expand text`);
      }
  
      const originalResponse = await response.json();
      // Normalize the response to have consistent property names
      const normalizedResponse = {
        ...originalResponse,
        concise: originalResponse.concise ? {
          ...originalResponse.concise,
          expanded_text: originalResponse.concise.shortened_text || originalResponse.concise.expanded_text || originalResponse.concise.rewritten_text || originalResponse.concise.continuation_text
        } : undefined,
        dramatic: originalResponse.dramatic ? {
          ...originalResponse.dramatic,
          // expanded_text: originalResponse.dramatic.shortened_text || originalResponse.dramatic.expanded_text
          expanded_text: originalResponse.dramatic.shortened_text || originalResponse.dramatic.expanded_text || originalResponse.dramatic.rewritten_text || originalResponse.dramatic.continuation_text
        } : undefined,
        // Normalize other properties similarly
        minimal: originalResponse.minimal ? {
          ...originalResponse.minimal,
          expanded_text: originalResponse.minimal.shortened_text || originalResponse.minimal.expanded_text || originalResponse.minimal.rewritten_text || originalResponse.minimal.continuation_text
        } : undefined,
        humorous: originalResponse.humorous ? {
          ...originalResponse.humorous,
          expanded_text: originalResponse.humorous.shortened_text || originalResponse.humorous.expanded_text || originalResponse.humorous.rewritten_text || originalResponse.humorous.continuation_text
        } : undefined,
        poetic: originalResponse.poetic ? {
          ...originalResponse.poetic,
          expanded_text: originalResponse.poetic.shortened_text || originalResponse.poetic.expanded_text || originalResponse.poetic.rewritten_text || originalResponse.poetic.continuation_text
        } : undefined,
      };
      return normalizedResponse;
  
    } catch (error) {
      console.error('Failed to expand component:', error);
      throw error;
    }
  },

  async  rewriteComponent(componentId: string): Promise<ExpandComponentResponse> {
    try {
      const token = await getToken();
      
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/components/${componentId}/rewrite`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to expand text`);
      }
  
      const originalResponse = await response.json();
      // Normalize the response to have consistent property names
      const normalizedResponse = {
        ...originalResponse,
        concise: originalResponse.concise ? {
          ...originalResponse.concise,
          expanded_text: originalResponse.concise.shortened_text || originalResponse.concise.expanded_text || originalResponse.concise.rewritten_text || originalResponse.concise.continuation_text
        } : undefined,
        dramatic: originalResponse.dramatic ? {
          ...originalResponse.dramatic,
          // expanded_text: originalResponse.dramatic.shortened_text || originalResponse.dramatic.expanded_text
          expanded_text: originalResponse.dramatic.shortened_text || originalResponse.dramatic.expanded_text || originalResponse.dramatic.rewritten_text || originalResponse.dramatic.continuation_text
        } : undefined,
        // Normalize other properties similarly
        minimal: originalResponse.minimal ? {
          ...originalResponse.minimal,
          expanded_text: originalResponse.minimal.shortened_text || originalResponse.minimal.expanded_text || originalResponse.minimal.rewritten_text || originalResponse.minimal.continuation_text
        } : undefined,
        humorous: originalResponse.humorous ? {
          ...originalResponse.humorous,
          expanded_text: originalResponse.humorous.shortened_text || originalResponse.humorous.expanded_text || originalResponse.humorous.rewritten_text || originalResponse.humorous.continuation_text
        } : undefined,
        poetic: originalResponse.poetic ? {
          ...originalResponse.poetic,
          expanded_text: originalResponse.poetic.shortened_text || originalResponse.poetic.expanded_text || originalResponse.poetic.rewritten_text || originalResponse.poetic.continuation_text
        } : undefined,
      };
      return normalizedResponse;
    } catch (error) {
      console.error('Failed to expand component:', error);
      throw error;
    }
  },
  async applyTransform(
    componentId: string,
    transformType: AIActionType | ExpansionType, // Use the type matching your API expectation
    alternativeText: string
  ): Promise<ApplyTransformResponse> {
    try {
      if (!componentId) {
        throw new Error("Component ID is required to apply transform.");
      }
      const token = await getToken();
      const payload: ApplyTransformPayload = {
        transform_type: transformType,
        alternative_text: alternativeText,
      };

      console.log(`Applying transform: ${transformType} to component ${componentId}`);
      console.log("Payload:", payload); // Log payload for debugging

      const response = await fetch(
        `${API_BASE_URL}/scene-segments/components/${componentId}/apply-transform`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Apply Transform API Error Response:", errorData); // Log error response
        throw new Error(errorData.message || errorData.error || `Error ${response.status}: Failed to apply transform`);
      }

      const responseData: ApplyTransformResponse = await response.json();
      console.log("Apply Transform API Success Response:", responseData); // Log success response
      return responseData;

    } catch (error) {
      console.error('Failed to apply transform:', error);
      // Re-throw the error to be caught by the caller
      throw error;
    }
  },

  async getNextSegmentNumber(scriptId: string): Promise<number> {
    if (!scriptId) {
      throw new Error("Script ID is required to get the next segment number.");
    }
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/script/${scriptId}/next-segment-number`,
        {
          method: 'GET', // Assuming GET request
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get next segment number: ${response.status}`);
      }
      const data: NextSegmentNumberResponse = await response.json();
      return data.next_segment_number;
    } catch (error) {
       console.error("Error fetching next segment number:", error);
       // Provide a fallback or rethrow a specific error
       // Returning a timestamp-based fallback for now, but ideally, handle the error upstream
       // throw error; // Or rethrow if the caller should handle it
       return Date.now(); // Fallback position calculation
    }
  },

  async getNextComponentPosition(segmentId: string): Promise<number> {
     if (!segmentId) {
       throw new Error("Segment ID is required to get the next component position.");
     }
     // IMPORTANT: If the segmentId is temporary, we cannot call the backend API.
     // We need a local strategy for positioning within new, unsaved segments.
     if (segmentId.startsWith('temp-seg-')) {
         console.warn(`Cannot fetch position for temporary segment ID: ${segmentId}. Using local calculation.`);
         // Implement local calculation (e.g., find max position in elements with this temp segmentId + 1000)
         // For simplicity, returning a timestamp-based fallback here.
         return Date.now();
     }

    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/scene-segments/${segmentId}/next-component-position`,
        {
          method: 'GET', // Assuming GET request
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to get next component position: ${response.status}`);
      }
      const data: NextComponentPositionResponse = await response.json();
      return data.next_component_position;
    } catch (error) {
       console.error(`Error fetching next component position for segment ${segmentId}:`, error);
       // Provide a fallback or rethrow a specific error
       // Returning a timestamp-based fallback for now, but ideally, handle the error upstream
       // throw error; // Or rethrow if the caller should handle it
       return Date.now(); // Fallback position calculation
    }
  },

  // Convert API scene components to script elements
  convertSceneComponentsToElements(components: AISceneComponent[]): ScriptElement[] {
    const sortedComponents = sortComponentsByPosition(components);
    return sortedComponents.map((component, index) => {

      let elementType: ElementType = mapComponentTypeToElementType(component.component_type);
      let content = component.content;
      const frontendId = `comp-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


      // Skip standalone CHARACTER components but keep character data for DIALOGUE
      if (component.component_type === 'CHARACTER') {
        return [];
      }
      // Ensure we have a reliable component ID
      // const componentId = component.id; ### generate next scene api returns component as component.component_id so adding the below line
      const componentId = component.id || component.component_id ;

      // Case 1: DIALOGUE with both character_name and parenthetical
      if (component.component_type === 'DIALOGUE' && component.character_name && component.parenthetical) {
        return [
          // Character element (needed for formatting)
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            componentId: componentId,
            type: 'character' as ElementType,
            content: component.character_name || ''
          },
          // Parenthetical element
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            type: 'parenthetical' as ElementType,
            componentId: componentId,
            content: component.parenthetical.trim()
          },
          // Dialogue element
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            componentId: componentId,
            type: elementType,
            content
          }
        ] as ScriptElement[];
      }

      // Case 2: DIALOGUE with only parenthetical
      else if (component.component_type === 'DIALOGUE' && component.parenthetical) {
        // Create a separate parenthetical element with a derived ID
        const parentheticalContent = component.parenthetical.trim();

        return [
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            type: 'parenthetical' as ElementType,
            componentId: componentId,
            content: parentheticalContent
          },
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            componentId: componentId,
            type: elementType,
            content
          }
        ] as ScriptElement[];
      }

      // Case 3: DIALOGUE with only character_name
      else if (component.component_type === 'DIALOGUE' && component.character_name) {
        return [
          // Character element (needed for formatting)
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            type: 'character' as ElementType,
            componentId: componentId,
            content: component.character_name || ''
          },
          // Dialogue element
          {
            id: `frontendId--${Math.random().toString(36).substr(2, 9)}`,
            componentId: componentId,
            type: elementType,
            content
          }
        ] as ScriptElement[];
      }

      // Case 4: Regular element (non-DIALOGUE or DIALOGUE without extras)
      return {
        id:  `frontendId--${Math.random().toString(36).substr(2, 9)}`,
        type: elementType,
        componentId: componentId,
        content
      } as ScriptElement;
    }).flat(); // Keep character elements this time
  },

  // Convert all scene segments to script elements
  convertSegmentsToScriptElements(segments: SceneSegment[], existingElements: ScriptElement[] = []): ScriptElement[] {
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      console.log('No segments to convert to script elements');
      return [];
    }
  
    // Sort segments by position (as float) if available, otherwise by creation date
    const sortedSegments = [...segments].sort((a, b) => {
      // First try to sort by position if available (handling as float)
      if (a.position !== undefined && b.position !== undefined) 
        return a.position - b.position;
    
      
      // Fallback to created_at date if position is not available
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    
    // Create a set of existing segment IDs for faster lookup
    const existingSegmentIds = new Set(
      existingElements.map(el => el.sceneSegmentId).filter(Boolean)
    );
    
    const allElements: ScriptElement[] = [];
  
    sortedSegments.forEach(segment => {
      // Skip segments with no components, invalid structure, or already loaded
      if (!segment || !segment.components || !Array.isArray(segment.components)) {
        console.warn('Skipping invalid segment:', segment);
        return;
      }
      
      // Skip duplicates
      if (existingSegmentIds.has(segment.id)) {
        console.log(`Skipping duplicate segment: ${segment.id}`);
        return;
      }
  
      try {
        // Sort components by position (as float) before converting
        const sortedComponents = [...segment.components].sort((a, b) => {
          // Handle possible undefined or null positions by defaulting to 0
          const posA = typeof a.position === 'number' ? a.position : 0;
          const posB = typeof b.position === 'number' ? b.position : 0;
          return posA - posB; // Correctly compares float values
        });
        
        const segmentElements = this.convertSceneComponentsToElements(sortedComponents);
  
        // Add scene segment ID and position to each element for tracking
        const elementsWithSegmentId = segmentElements.map(element => ({
          ...element,
          sceneSegmentId: segment.id,
          segmentPosition: segment.position ?? 0 // Use nullish coalescing for safer default
        }));
  
        allElements.push(...elementsWithSegmentId);
      } catch (error) {
        console.error('Error converting segment components to elements:', error, segment);
        // Continue with other segments
      }
    });
  
    if (allElements.length === 0 && segments.length > 0) {
      console.log('No elements were created from the segments, check component conversion logic');
    }
  
    return allElements;
  },

  // NEW: Get current script state
  async getScriptState(scriptId: string): Promise<{
    creationMethod: ScriptCreationMethod;
    hasBeats: boolean;
    scenesCount: number;
    currentSceneSegmentId?: string;
  }> {
    try {
      // Get script metadata
      const metadata = await this.getScriptMetadata(scriptId);

      // Get beats
      let hasBeats = false;
      try {
        const beats = await this.getBeats(scriptId);
        hasBeats = beats && beats.length > 0;
      } catch (error) {
        console.warn('Error fetching beats, assuming no beats:', error);
      }

      // Get scene segments
      let scenesCount = 0;
      let currentSceneSegmentId = metadata.current_scene_segment_id;

      try {
        const segments = await this.getScriptSegments(scriptId);
        scenesCount = segments.total || 0;

        // If metadata doesn't have a current segment ID but we have segments, use the last one
        if (!currentSceneSegmentId && segments.segments.length > 0) {
          currentSceneSegmentId = segments.segments[segments.segments.length - 1].id;
        }
      } catch (error) {
        console.warn('Error fetching scene segments:', error);
      }

      return {
        creationMethod: metadata.creation_method,
        hasBeats,
        scenesCount,
        currentSceneSegmentId
      };
    } catch (error) {
      return handleApiError(error, 'Failed to determine script state');
    }
  },
};