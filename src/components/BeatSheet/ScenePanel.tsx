import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Beat, Scenes } from '../../types/beats';
import { api } from '../../services/api';

interface ScenePanelProps {
  beat: Beat;
  onClose: () => void;
  onUpdate: (scenes: Scenes[]) => void;
  isLoading?: boolean;
}

export const ScenePanel: React.FC<ScenePanelProps> = ({ 
  beat, 
  onClose, 
  onUpdate,
  isLoading = false
}) => {
  const [scenes, setScenes] = useState<Scenes[]>(beat.scenes);
  const [editedScenes, setEditedScenes] = useState<Set<string>>(new Set());
  const [savingScenes, setSavingScenes] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  // Sync scenes state when beat prop changes
  useEffect(() => {
    console.log('ScenePanel: beat changed:', beat); // Debug
    setScenes(beat.scenes); // Update scenes when beat changes
    setEditedScenes(new Set()); // Reset edited scenes
    setSavingScenes(new Set()); // Reset saving scenes
    setErrors(new Map()); // Reset errors
  }, [beat]);

  const handleSceneChange = (scene: Scenes, newContent: string) => {
    if (errors.has(scene.id)) {
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(scene.id);
        return newErrors;
      });
    }

    if (validateSceneContent(scene, newContent)) {
      const updatedScenes = scenes.map(s =>
        s.id === scene.id ? { ...s, scene_detail_for_ui: newContent } : s
      );
      setScenes(updatedScenes);
      setEditedScenes(prev => new Set(prev).add(scene.id));
    }
  };

  const handleSave = async (scene: Scenes) => {
    if (!editedScenes.has(scene.id)) return;
    
    try {
      setSavingScenes(prev => new Set(prev).add(scene.id));
      const updatedScene = await api.updateSceneDescription(
        scene.id,
        scene.scene_detail_for_ui
      );
      
      setScenes(prev => prev.map(s => s.id === scene.id ? updatedScene : s));
      setEditedScenes(prev => {
        const newSet = new Set(prev);
        newSet.delete(scene.id);
        return newSet;
      });
      onUpdate(scenes);
    } catch (error) {
      setErrors(prev => new Map(prev).set(
        scene.id,
        error instanceof Error ? error.message : 'Failed to save scene'
      ));
    } finally {
      setSavingScenes(prev => {
        const newSet = new Set(prev);
        newSet.delete(scene.id);
        return newSet;
      });
    }
  };

  const validateSceneContent = (originalScene: Scenes, newContent: string): boolean => {
    const originalParts = originalScene.scene_detail_for_ui.split(':');
    const newParts = newContent.split(':');
    
    if (newParts.length < 2) {
      setErrors(prev => new Map(prev).set(originalScene.id, 'Cannot remove the colon (:) from the scene description'));
      return false;
    }

    if (originalParts[0].trim() !== newParts[0].trim()) {
      setErrors(prev => new Map(prev).set(originalScene.id, 'Cannot modify the scene heading before the colon'));
      return false;
    }

    return true;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-900">Scenes for {beat.title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {scenes.map((scene) => (
            <div key={scene.id} className="space-y-2">
              <textarea
                value={scene.scene_detail_for_ui}
                onChange={(e) => handleSceneChange(scene, e.target.value)}
                className={`w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.has(scene.id) ? 'border-red-300' : ''
                }`}
                rows={4}
                disabled={savingScenes.has(scene.id)}
              />
              
              {errors.has(scene.id) && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.get(scene.id)}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  data-event-name="save_scenes_scene_panel_beatsheet_page"
                  onClick={() => handleSave(scene)}
                  disabled={!editedScenes.has(scene.id) || savingScenes.has(scene.id)}
                  className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                    editedScenes.has(scene.id) && !savingScenes.has(scene.id)
                      ? 'text-white bg-blue-600 hover:bg-blue-700'
                      : 'text-gray-400 bg-gray-100'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {savingScenes.has(scene.id) ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};