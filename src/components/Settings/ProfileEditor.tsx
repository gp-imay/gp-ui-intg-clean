import React, { useState } from 'react';
import { UserProfile } from '../../types/screenplay';

interface ProfileEditorProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onSave,
  onCancel
}) => {
  const [editedProfile, setEditedProfile] = useState<UserProfile>(profile);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">
        {editedProfile.id === profile.id ? 'Edit Your Profile' : 'Edit Profile'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={editedProfile.name}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              name: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={editedProfile.email}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              email: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={editedProfile.bio || ''}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              bio: e.target.value
            })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Avatar URL
          </label>
          <input
            type="text"
            value={editedProfile.avatar || ''}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              avatar: e.target.value
            })}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {editedProfile.avatar && (
            <div className="mt-2 flex items-center">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-gray-200">
                <img 
                  src={editedProfile.avatar} 
                  alt="Avatar preview" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150?text=Error';
                  }}
                />
              </div>
              <span className="ml-3 text-xs text-gray-500">Avatar preview</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Theme
          </label>
          <select
            value={editedProfile.preferences.theme}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              preferences: {
                ...editedProfile.preferences,
                theme: e.target.value as 'light' | 'dark' | 'system'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <input
            type="number"
            min="10"
            max="24"
            value={editedProfile.preferences.fontSize}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              preferences: {
                ...editedProfile.preferences,
                fontSize: parseInt(e.target.value)
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoSave"
            checked={editedProfile.preferences.autoSave}
            onChange={(e) => setEditedProfile({
              ...editedProfile,
              preferences: {
                ...editedProfile.preferences,
                autoSave: e.target.checked
              }
            })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="autoSave" className="ml-2 block text-sm text-gray-700">
            Enable Auto-Save
          </label>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editedProfile)}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};