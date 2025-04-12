import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ScriptEditor } from '../components/ScriptEditor';
import { useScriptState } from '../hooks/useScriptState';
import { ViewMode, ScriptMetadata,  } from '../types/screenplay';
import { AlertProvider, useAlert } from '../components/Alert';
import {api, ScriptMetadataResponse} from "../services/api";
import { AccountSettingsModal } from '../components/Dashboard/AccountSettingsModal'; 
import { useAuth } from '../contexts/AuthContext'; 


/**
 * ScriptEditorPage component
 * This component orchestrates the script state and data loading,
 * acting as the main container for the script editor experience.
 */
function ScriptEditorPage() {
  const { scriptId } = useParams<{ scriptId: string }>() as { scriptId: string };
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptMetadata, setScriptMetadata] = useState<ScriptMetadata | null>(null);
  const [initialViewMode, setInitialViewMode] = useState<ViewMode>('script');
  
  // const [beatsDisabled, setBeatsDisabled] = useState(false);
  const [beatsAvailable, setBeatsAvailable] = useState(true);
  const { user } = useAuth(); 

  
  // Use refs to track loading state and prevent duplicate API calls
  const hasInitializedRef = useRef(false);
  
  // Get the requested view from URL parameters (if any)
  const requestedView = searchParams.get('view') as ViewMode | null;
  
  // Initialize script state - this should not cause infinite loops
  const scriptState = useScriptState({ 
    scriptId: scriptId || '',
    onStateChange: (newState) => {
      console.log(`Script state changed to: ${newState}`);
    }
  });

  const handleChangeDisplayName = () => {
    showAlert('info', 'Change display name functionality coming soon.');
  };

  const handleChangeEmail = () => {
    showAlert('info', 'Change email functionality coming soon.');
  };

  function mapApiResponseToScriptMetadata(response: ScriptMetadataResponse): ScriptMetadata {
    return {
      id: response.id,
      title: response.title,
      creationMethod: response.creation_method,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      isAiGenerated: response.creation_method === 'WITH_AI',
      isUploaded: response.creation_method === 'UPLOAD',
      currentSceneSegmentId: response.current_scene_segment_id,
      uploadedFileType: response.creation_method === 'UPLOAD' ? 'pdf' : undefined // You might need to determine this based on available data
    };
  }

  // Initialize the view once when component mounts
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    async function initializeScriptEditor() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch script metadata
        const metadata = await api.getScriptMetadata(scriptId);
        const mappedMetadata = mapApiResponseToScriptMetadata(metadata);
        setScriptMetadata(mappedMetadata);
        
        // Determine if beats are available based on creation method
        const areBeatsAvailable = metadata.creation_method === 'WITH_AI';
        setBeatsAvailable(areBeatsAvailable);
        
        // Set view mode based on URL parameter, creation method, and available content
        let viewMode: ViewMode = 'script';
        
        if (requestedView && ['beats', 'script', 'boards'].includes(requestedView)) {
          viewMode = requestedView as ViewMode;
        } else if (metadata.creation_method === 'WITH_AI') {
          viewMode = scriptState.context.hasBeats && scriptState.context.scenesCount === 0 ? 'beats' : 'script';
        }
        
        setInitialViewMode(viewMode);
      } catch (error) {
        console.error('Failed to initialize script editor:', error);
        setError(error instanceof Error ? error.message : 'Failed to load script');
        showAlert('error', error instanceof Error ? error.message : 'Failed to load script');
      } finally {
        setIsLoading(false);
        hasInitializedRef.current = true;
      }
    }
    
    initializeScriptEditor();
  }, [scriptId, requestedView, showAlert, scriptState.context.hasBeats, scriptState.context.scenesCount]);

  // Implement safety timeout for loading
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.log("Loading timeout triggered after 10 seconds");
        setIsLoading(false);
        setError("Loading took too long. Please try again.");
        showAlert('warning', 'Loading timeout. Please try refreshing the page.');
      }, 10000); // 10 seconds timeout instead of 20
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, showAlert]);

  // Handle script load error
  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Script
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => {
                hasInitializedRef.current = false;
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Script
          </h2>
          <p className="text-gray-600">
            Preparing your screenplay editor...
          </p>
        </div>
      </div>
    );
  }

  // Render the ScriptEditor with appropriate props
  return (
    <ScriptEditor 
      scriptId={scriptId || ''} 
      initialViewMode={initialViewMode}
      scriptState={scriptState}
    />
  );
}

// Wrap the component with AlertProvider to ensure alerts work properly
export default function ScriptEditorPageWithAlerts() {
  return (
    <AlertProvider>
      <ScriptEditorPage />
    </AlertProvider>
  );
}