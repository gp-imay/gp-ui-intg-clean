import { supabase } from '../lib/supabase';
import { ScriptCreationMethod } from '../types/screenplay';
import { Beat } from '../types/beats';
import { appInsights } from '../lib/applicationInsights';

const generateTelemetryId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const trackApiCall = async <T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  const telemetryId = generateTelemetryId();
  
  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;
    
    // Track successful API call
    appInsights.trackDependencyData({
      id: telemetryId,
      name: apiName,
      duration: duration,
      success: true,
      responseCode: 200,
      type: 'HTTP',
      target: API_BASE_URL,
      data: `Success: ${apiName}`
    });
    
    // Track metric for successful call
    appInsights.trackMetric({
      name: `API_${apiName}_Success`,
      average: 1,
      properties: {
        success: true,
        duration: duration.toString(),
        apiName: apiName,
        telemetryId: telemetryId
      }
    });
    
    return result;
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = typeof error === 'object' && error !== null && 'status' in error 
    ? (error as { status: number }).status 
    : 500;
      
    // Track failed API call
    appInsights.trackDependencyData({
      id: telemetryId,
      name: apiName,
      duration: duration,
      success: false,
      responseCode: statusCode,
      type: 'HTTP',
      target: API_BASE_URL,
      data: errorMessage
    });
    
    // Track metric for failed call
    appInsights.trackMetric({
      name: `API_${apiName}_Failure`,
      average: 1,
      properties: {
        success: false,
        error: errorMessage,
        statusCode: statusCode.toString(),
        duration: duration.toString(),
        apiName: apiName,
        telemetryId: telemetryId
      }
    });
    
    // Track exception
    appInsights.trackException({
      exception: error instanceof Error ? error : new Error(errorMessage),
      properties: {
        apiName: apiName,
        statusCode: statusCode.toString(),
        telemetryId: telemetryId
      }
    });
    
    throw error;
  }
};

export interface Script {
  id: string;
  name: string;
  subtitle?: string;
  genre: string;
  story?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  creation_method: ScriptCreationMethod;
  current_scene_segment_id?: string;
}

interface CreateScriptInput {
  title: string;
  subtitle?: string;
  genre?: string;
  story?: string;
}

interface UploadScriptInput {
  file: File;
  title?: string;
}

interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Response interfaces
interface RegularScriptResponse {
  id: string;
  title: string;
  subtitle?: string;
  genre?: string;
  story?: string;
  creation_method: ScriptCreationMethod;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_file_uploaded: boolean;
  file_url: string | null;
}

interface ApiBeat {
  position: number;
  beat_title: string;
  beat_description: string;
  beat_id: string;
  beat_act: string;
  script_id: string;
}

interface AIScriptResponse {
  script: RegularScriptResponse;
  beats: ApiBeat[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL;
// const API_BASE_URL = "http://localhost:8000/api/v1";

// Fallback to mock data if API_BASE_URL is not set
const mockScripts: Script[] = [
  {
    id: '1',
    name: 'The Last Horizon',
    genre: 'Action',
    progress: 75,
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2024-03-15T10:00:00Z',
    user_id: 'mock-user-1',
    creation_method: 'FROM_SCRATCH'
  },
  {
    id: '2',
    name: 'Coffee & Dreams',
    genre: 'Comedy',
    progress: 45,
    created_at: '2024-03-14T15:30:00Z',
    updated_at: '2024-03-14T15:30:00Z',
    user_id: 'mock-user-1',
    creation_method: 'WITH_AI',
    current_scene_segment_id: 'scene-segment-123'
  },
  {
    id: '3',
    name: 'Neural Path',
    genre: 'Sci-fi',
    progress: 90,
    created_at: '2024-03-13T09:15:00Z',
    updated_at: '2024-03-13T09:15:00Z',
    user_id: 'mock-user-1',
    creation_method: 'UPLOAD'
  }
];

// Helper function to map API act format to frontend format
const mapActFromApi = (apiAct: string): Beat['act'] => {
  const actMap: Record<string, Beat['act']> = {
    'act_1': 'Act 1',
    'act_2a': 'Act 2A',
    'act_2b': 'Act 2B',
    'act_3': 'Act 3'
  };
  return actMap[apiAct.toLowerCase()] || 'Act 1';
};

// Helper function to handle API errors consistently
function handleApiError(error: any, defaultMessage: string): never {
  console.error('Mock API Error:', error);

  const apiError: ApiError = {
    message: error.message || defaultMessage,
    status: error.status || 500
  };

  if (error.code) {
    apiError.code = error.code;
  }

  throw apiError;
}

// Helper function to generate unique IDs
function generateId(): string {
  return `script-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Convert API response to our Script format
function apiResponseToScript(response: RegularScriptResponse): Script {
  return {
    id: response.id,
    name: response.title,
    subtitle: response.subtitle,
    genre: response.genre || 'Unknown',
    story: response.story,
    progress: 0,
    created_at: response.created_at,
    updated_at: response.updated_at,
    user_id: response.user_id,
    creation_method: response.creation_method
  };
}

// Convert API beat to our Beat format
function apiBeatsToBeats(apiBeats: ApiBeat[]): Beat[] {
  return apiBeats.map((apiBeat, index) => ({
    id: apiBeat.beat_id,
    title: apiBeat.beat_title,
    description: apiBeat.beat_description,
    category: apiBeat.beat_title,
    act: mapActFromApi(apiBeat.beat_act),
    position: { x: index * 320 + 20, y: 20 },
    isValidated: false,
    scenes: []
  }));
}

export const mockApi = {

  async getAllUserScripts(): Promise<Script[]> {
    return trackApiCall('GetAllUserScripts', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw { message: 'User must be authenticated to fetch scripts', status: 401 };
      }

      // If API_BASE_URL is not set, return mock data
      if (!API_BASE_URL) {
        console.log('API URL not configured, using mock data');
        return mockScripts;
      }

      const response = await fetch(`${API_BASE_URL}/scripts/?skip=0&limit=50`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }
  
      const data = await response.json();
      return data;
    }).catch(error => {
      // Handle development fallback separately
      if (import.meta.env.DEV) {
        console.log('Falling back to mock data');
        return mockScripts;
      }
      throw error; // Re-throw the error for trackApiCall to handle
    });  
  },

  async getUserScripts(): Promise<Script[]> {
    return trackApiCall('GetUserScripts', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw { message: 'User must be authenticated to fetch scripts', status: 401 };
      }

      // If API_BASE_URL is not set, return mock data
      if (!API_BASE_URL) {
        console.log('API URL not configured, using mock data');
        return mockScripts;
      }

      const response = await fetch(`${API_BASE_URL}/scripts/?skip=0&limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();
      return data;
    }).catch(error => {
      // Handle development fallback separately
      if (import.meta.env.DEV) {
        console.log('Falling back to mock data');
        return mockScripts;
      }
      // throw error; // Re-throw the error for trackApiCall to handle
      return handleApiError(error, 'Failed to fetch scripts');
    }); 
  },

  // Regular script creation
  async createScript(input: CreateScriptInput): Promise<Script> {
    return trackApiCall('CreateScript', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return handleApiError({
          message: 'User must be authenticated to create a script',
          status: 401
        }, 'Authentication required');
      }

      // Validate required fields
      if (!input.title?.trim()) {
        return handleApiError({
          message: 'Title is required',
          status: 400
        }, 'Invalid script data');
      }

      // If API_BASE_URL is not set, simulate creation with mock data
      if (!API_BASE_URL) {
        console.log("Creating regular script with mock data");

        const newScript: Script = {
          id: generateId(),
          name: input.title,
          subtitle: input.subtitle,
          genre: input.genre || 'Unknown',
          story: input.story,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session.user.id,
          creation_method: 'FROM_SCRATCH'
        };

        mockScripts.unshift(newScript);
        return newScript;
      }

      const response = await fetch(`${API_BASE_URL}/scripts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: input.title,
          subtitle: input.subtitle || '',
          genre: input.genre || '',
          story: input.story || '',
          creation_method: 'FROM_SCRATCH'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      const apiResponse: RegularScriptResponse = await response.json();
      return apiResponseToScript(apiResponse);
    }).catch(error => {
      console.error('Failed to create script:', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });

      // Fallback to mock data creation on error if in development
      if (import.meta.env.DEV) {
        console.log('Falling back to mock data creation');
        const { data: { session } } = supabase.auth.getSession();
        const newScript: Script = {
          id: generateId(),
          name: input.title,
          subtitle: input.subtitle,
          genre: input.genre || 'Unknown',
          story: input.story,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session?.user?.id || 'mock-user',
          creation_method: 'FROM_SCRATCH'
        };

        mockScripts.unshift(newScript);
        return newScript;
      }

      return handleApiError(error, 'Failed to create script');
    });
  },

  // AI script creation - returns both script and beats
  async createAIScript(input: CreateScriptInput): Promise<{
    script: Script;
    beats: Beat[];
  }> {
    return trackApiCall('CreateAIScript', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return handleApiError({
          message: 'User must be authenticated to create an AI script',
          status: 401
        }, 'Authentication required');
      }

      // Validate required fields
      if (!input.title?.trim()) {
        return handleApiError({
          message: 'Title is required',
          status: 400
        }, 'Invalid script data');
      }

      // If API_BASE_URL is not set, simulate creation with mock data
      if (!API_BASE_URL) {
        console.log("Creating AI script with mock data");

        const newScript: Script = {
          id: generateId(),
          name: input.title,
          subtitle: input.subtitle,
          genre: input.genre || 'Unknown',
          story: input.story,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session.user.id,
          creation_method: 'WITH_AI',
          current_scene_segment_id: `segment-${Date.now()}`
        };

        // Create mock beats for AI script
        const mockBeats: Beat[] = [
          {
            id: 'beat-1',
            title: 'Opening Image',
            description: 'The film begins with a vivid visual that encapsulates the status quo.',
            category: 'Opening Image',
            act: 'Act 1',
            position: { x: 20, y: 20 },
            isValidated: false,
            scenes: []
          },
          {
            id: 'beat-2',
            title: 'Theme Stated',
            description: 'The theme of the story is hinted at.',
            category: 'Theme Stated',
            act: 'Act 1',
            position: { x: 340, y: 20 },
            isValidated: false,
            scenes: []
          }
          // More mock beats could be added here
        ];

        mockScripts.unshift(newScript);
        return {
          script: newScript,
          beats: mockBeats
        };
      }

      const response = await fetch(`${API_BASE_URL}/scripts/with-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: input.title,
          subtitle: input.subtitle || '',
          genre: input.genre || '',
          story: input.story || '',
          creation_method: 'WITH_AI'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      const aiResponse: AIScriptResponse = await response.json();

      // Transform the WITH_AI response to our Script format
      const scriptData = apiResponseToScript({
        ...aiResponse.script,
        // Add any additional fields if needed
      });

      // Make sure to set the correct creation method
      scriptData.creation_method = 'WITH_AI';

      // Transform API beats to our Beat format
      const beatsData = apiBeatsToBeats(aiResponse.beats);

      return {
        script: scriptData,
        beats: beatsData
      };
    }).catch(error => {
      console.error('Failed to create AI script:', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });

      // Fallback to mock data on error if in development
      if (import.meta.env.DEV) {
        console.log('Falling back to mock AI script data');
        const { data: { session } } = supabase.auth.getSession();
        const newScript: Script = {
          id: generateId(),
          name: input.title,
          subtitle: input.subtitle,
          genre: input.genre || 'Unknown',
          story: input.story,
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session?.user?.id || 'mock-user',
          creation_method: 'WITH_AI',
          current_scene_segment_id: `segment-${Date.now()}`
        };

        const mockBeats: Beat[] = [
          {
            id: 'beat-1',
            title: 'Opening Image',
            description: 'The film begins with a vivid visual.',
            category: 'Opening Image',
            act: 'Act 1',
            position: { x: 20, y: 20 },
            isValidated: false,
            scenes: []
          },
          {
            id: 'beat-2',
            title: 'Theme Stated',
            description: 'The theme is stated.',
            category: 'Theme Stated',
            act: 'Act 1',
            position: { x: 340, y: 20 },
            isValidated: false,
            scenes: []
          }
        ];

        mockScripts.unshift(newScript);
        return {
          script: newScript,
          beats: mockBeats
        };
      }

      return handleApiError(error, 'Failed to create AI script');
    });
  },

  // Add this method to the mockApi object in mockApi.ts
  async deleteScript(scriptId: string): Promise<void> {
    return trackApiCall('DeleteScript', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return handleApiError({
          message: 'User must be authenticated to delete a script',
          status: 401
        }, 'Authentication required');
      }

      // If API_BASE_URL is not set, simulate deletion with mock data
      if (!API_BASE_URL) {
        console.log(`Simulating deletion of script: ${scriptId}`);

        const scriptIndex = mockScripts.findIndex(s => s.id === scriptId);
        if (scriptIndex === -1) {
          return handleApiError({
            message: 'Script not found',
            status: 404
          }, 'Script not found');
        }

        // Remove from mock data
        mockScripts.splice(scriptIndex, 1);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json'
        }
      });

      // 204 No Content is the expected success response for deletion
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      // Successful deletion (nothing to return)
      return;
    }).catch(error => {
      console.error('Failed to delete script:', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });

      // Fallback to mock data on error if in development
      if (import.meta.env.DEV) {
        console.log('Falling back to mock deletion');
        const scriptIndex = mockScripts.findIndex(s => s.id === scriptId);
        if (scriptIndex !== -1) {
          mockScripts.splice(scriptIndex, 1);
          return;
        }
      }

      return handleApiError(error, 'Failed to delete script');
    });
  },

  async uploadScript(input: UploadScriptInput): Promise<Script> {
    return trackApiCall('UploadScript', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return handleApiError({
          message: 'User must be authenticated to upload a script',
          status: 401
        }, 'Authentication required');
      }

      // Validate file
      if (!input.file) {
        return handleApiError({
          message: 'File is required',
          status: 400
        }, 'Invalid upload data');
      }

      const fileExtension = input.file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['pdf', 'fdx'].includes(fileExtension)) {
        return handleApiError({
          message: 'Only PDF and FDX files are supported',
          status: 400
        }, 'Unsupported file format');
      }

      // If API_BASE_URL is not set, simulate upload with mock data
      if (!API_BASE_URL) {
        console.log(`Uploading script: ${input.file.name}`);

        const newScript: Script = {
          id: generateId(),
          name: input.title || input.file.name.replace(/\.[^/.]+$/, ''),
          genre: 'Unknown',
          progress: 10, // Uploaded scripts start with some progress
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session.user.id,
          creation_method: 'UPLOAD'
        };

        mockScripts.unshift(newScript);
        return newScript;
      }

      const formData = new FormData();
      formData.append('file', input.file);

      if (input.title) {
        formData.append('title', input.title);
      }

      const response = await fetch(`${API_BASE_URL}/scripts/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      const apiResponse = await response.json();
      return apiResponseToScript(apiResponse);
    }).catch(error => {
      console.error('Failed to upload script:', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });

      // Fallback to mock data on error if in development
      if (import.meta.env.DEV) {
        console.log('Falling back to mock upload');
        const { data: { session } } = supabase.auth.getSession();
        const newScript: Script = {
          id: generateId(),
          name: input.title || input.file.name.replace(/\.[^/.]+$/, ''),
          genre: 'Unknown',
          progress: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: session?.user?.id || 'mock-user',
          creation_method: 'UPLOAD'
        };

        mockScripts.unshift(newScript);
        return newScript;
      }

      return handleApiError(error, 'Failed to upload script');
    });
  },

  async getScriptById(scriptId: string): Promise<Script> {
    return trackApiCall('GetScriptById', async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return handleApiError({
          message: 'User must be authenticated to fetch scripts',
          status: 401
        }, 'Authentication required');
      }

      // If API_BASE_URL is not set, return mock data
      if (!API_BASE_URL) {
        const script = mockScripts.find(s => s.id === scriptId);

        if (!script) {
          return handleApiError({
            message: 'Script not found',
            status: 404
          }, 'Script not found');
        }

        return script;
      }

      const response = await fetch(`${API_BASE_URL}/scripts/${scriptId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw {
            message: 'Script not found',
            status: 404
          };
        }

        const errorData = await response.json().catch(() => null);
        throw {
          message: errorData?.message || `HTTP error! status: ${response.status}`,
          status: response.status
        };
      }

      const apiResponse = await response.json();
      return apiResponseToScript(apiResponse);
    }).catch(error => {
      console.error('Failed to fetch script:', {
        error: error.message,
        status: error.status,
        stack: error.stack
      });

      // Fallback to mock data on error if in development
      if (import.meta.env.DEV) {
        console.log('Falling back to mock data for script lookup');
        const script = mockScripts.find(s => s.id === scriptId);

        if (!script) {
          return handleApiError({
            message: 'Script not found',
            status: 404
          }, 'Script not found');
        }

        return script;
      }

      return handleApiError(error, 'Failed to fetch script');
    });
  },

  async getScriptState(scriptId: string): Promise<{
    creationMethod: ScriptCreationMethod;
    hasBeats: boolean;
    scenesCount: number;
    currentSceneSegmentId?: string;
  }> {
    return trackApiCall('GetScriptState', async () => {
      try {
        const script = await this.getScriptById(scriptId);

        // For mock data, determine state based on creation method
        let hasBeats = false;
        let scenesCount = 0;

        if (script.creation_method === 'WITH_AI') {
          hasBeats = true;
          scenesCount = script.progress > 50 ? 2 : script.progress > 20 ? 1 : 0;
        } else if (script.creation_method === 'UPLOAD') {
          hasBeats = false;
          scenesCount = Math.floor(script.progress / 10); // Rough estimate
        }

        return {
          creationMethod: script.creation_method,
          hasBeats,
          scenesCount,
          currentSceneSegmentId: script.current_scene_segment_id
        };
      } catch (error) {
        return handleApiError(error, 'Failed to determine script state');
      }
    });
  },

  async generateNextScene(scriptId: string): Promise<{ success: boolean; scene_segment_id: string }> {
    return trackApiCall('GenerateNextScene', async () => {
      const script = await this.getScriptById(scriptId);

      // Only WITH_AI scripts can generate next scenes
      if (script.creation_method !== 'WITH_AI') {
        return handleApiError({
          message: 'Scene generation is only available for AI-assisted scripts',
          status: 400
        }, 'Cannot generate scene');
      }

      // Mock generating a new scene segment
      const newSceneId = `scene-segment-${Date.now()}`;

      // Update the mock script with the new scene segment ID
      const scriptIndex = mockScripts.findIndex(s => s.id === scriptId);
      if (scriptIndex >= 0) {
        mockScripts[scriptIndex].current_scene_segment_id = newSceneId;
        mockScripts[scriptIndex].progress += 10; // Increase progress
      }

      return {
        success: true,
        scene_segment_id: newSceneId
      };
    });
  }
};