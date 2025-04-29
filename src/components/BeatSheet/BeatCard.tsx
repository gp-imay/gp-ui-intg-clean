import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Edit3, Check, Plus, AlertCircle, RefreshCcw } from 'lucide-react';
import { Beat, GeneratedScenesResponse } from '../../types/beats';

interface BeatCardProps {
  beat: Beat;
  onUpdate: (id: string, beat: Partial<Beat>) => void;
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onValidate: (id: string) => void;
  onGenerateScenes: (id: string) => Promise<GeneratedScenesResponse>;
  onShowScenes: (beat: Beat) => void; // Keep the original intent, but handle event in BeatCard
  isSelected: boolean;
}

export const BeatCard: React.FC<BeatCardProps> = ({
  beat,
  onUpdate,
  onPositionChange,
  onValidate,
  onGenerateScenes,
  onShowScenes,
  isSelected,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [localBeat, setLocalBeat] = useState(beat);
  const [isDescriptionModified, setIsDescriptionModified] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const nodeRef = useRef(null);

  const handleDragStop = (_: any, data: { x: number; y: number }) => {
    onPositionChange(beat.id, { x: data.x, y: data.y });
  };

  const handleInputChange = (field: keyof Beat, value: string) => {
    setError(null);
    setLocalBeat(prev => ({ ...prev, [field]: value }));
    if (field === 'description' && value !== beat.description) {
      setIsDescriptionModified(true);
    }
  };

  const handleSave = async () => {
    if (!isDescriptionModified) return;

    try {
      setSaving(true);
      setError(null);
      await onUpdate(beat.id, localBeat);
      setEditMode(false);
      setIsDescriptionModified(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateScenes = async () => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      await onGenerateScenes(beat.id);
      onValidate(beat.id);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to generate scenes'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetryGeneration = async () => {
    await handleGenerateScenes();
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={
        beat.position && !isNaN(beat.position.x) && !isNaN(beat.position.y)
          ? beat.position
          : { x: 0, y: 0 } // Fallback position
      }
      onStop={handleDragStop}
      handle=".drag-handle"
      bounds="parent"
      axis="x"
    >

      <div
        ref={nodeRef}
        id={`beat-${beat.id}`}
        style={{ position: 'absolute', width: '300px', height: error || generationError ? '200px' : '180px' }}
        className={`rounded-lg shadow-lg transition-all flex flex-col ${isSelected ? 'ring-2 ring-blue-500' : ''
          } ${beat.isValidated ? 'bg-green-50' : 'bg-white'}`}
      >
        <div className="drag-handle cursor-move p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-lg flex-shrink-0">
          <h3 className="font-semibold text-gray-900 truncate pr-2">{beat.title}</h3>
          <div className="flex gap-2 flex-shrink-0">
            {editMode ? (
              <button
                onClick={handleSave}
                className={`p-1 rounded ${isDescriptionModified && !isSaving
                    ? 'text-green-600 hover:bg-green-100'
                    : 'text-gray-400'
                  } ${isSaving ? 'cursor-not-allowed' : ''}`}
                disabled={!isDescriptionModified || isSaving}
                title={
                  isSaving
                    ? 'Saving...'
                    : isDescriptionModified
                      ? 'Save changes'
                      : 'No changes to save'
                }
              >
                {isSaving ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Edit"
              >
                <Edit3 className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col overflow-hidden">
          {(error || generationError) && (
            <div className="flex items-center gap-2 p-2 text-sm text-red-600 bg-red-50 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{error || generationError}</span>
            </div>
          )}

          {editMode ? (
            <textarea
              value={localBeat.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full p-2 border rounded resize-none flex-1 ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              placeholder="Description"
              rows={3}
              disabled={isSaving}
            />
          ) : (
            <p className="text-sm text-gray-600 overflow-hidden">
              {isSelected ? beat.description : truncateDescription(beat.description)}
            </p>
          )}

          <div className="flex-shrink-0 space-y-2">
            {!beat.isValidated && !editMode && (
              <>
                {generationError ? (
                  <button
                    onClick={handleRetryGeneration}
                    className="w-full py-1 px-2 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200 flex items-center justify-center gap-1"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Retry Generation
                  </button>
                ) : (
                  <button
                    data-event-name="generate_scenes_for_beat_beatsheet_page"
                    onClick={handleGenerateScenes}
                    disabled={isGenerating}
                    className={`w-full py-1 px-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 flex items-center justify-center gap-1 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Scenes'
                    )}
                  </button>
                )}
              </>
            )}

            {beat.scenes.length > 0 && (
              <button
                onClick={(event) => {
                  event.preventDefault(); // Prevent default behavior if any
                  onShowScenes(beat); // Pass the beat to the handler
                }}
                className="w-full py-1 px-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                {isSelected ? 'Hide Scenes' : 'Show Scenes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
};