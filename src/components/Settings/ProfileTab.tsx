import React, { useState } from 'react';
import { User, UserPlus, Edit, Trash2 } from 'lucide-react';
import { UserProfile, FormatSettings } from '../../types/screenplay';
import { ProfileEditor } from './ProfileEditor';

interface ProfileTabProps {
  userProfiles: UserProfile[];
  setUserProfiles: (profiles: UserProfile[]) => void;
  activeProfile: string;
  setActiveProfile: (id: string) => void;
  settings: FormatSettings;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfiles,
  setUserProfiles,
  activeProfile,
  setActiveProfile,
  settings
}) => {
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUserProfiles(userProfiles.map(p => 
      p.id === updatedProfile.id ? updatedProfile : p
    ));
    setEditingProfile(null);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (userProfiles.length <= 1) {
      alert("Cannot delete the only profile");
      return;
    }
    
    const newProfiles = userProfiles.filter(p => p.id !== profileId);
    setUserProfiles(newProfiles);
    
    // If the active profile is deleted, switch to the first available profile
    if (profileId === activeProfile) {
      setActiveProfile(newProfiles[0].id);
    }
  };

  const handleAddProfile = () => {
    const newProfile: UserProfile = {
      id: `user${userProfiles.length + 1}`,
      name: `New User ${userProfiles.length + 1}`,
      email: `user${userProfiles.length + 1}@example.com`,
      role: 'free',
      createdAt: new Date().toISOString(),
      preferences: {
        theme: 'light',
        fontSize: 14,
        autoSave: true,
        formatSettings: settings
      }
    };
    
    setUserProfiles([...userProfiles, newProfile]);
    setEditingProfile(newProfile);
  };

  const handleSaveProfileSettings = () => {
    const currentProfile = userProfiles.find(p => p.id === activeProfile);
    if (currentProfile) {
      const updatedProfile = {
        ...currentProfile,
        preferences: {
          ...currentProfile.preferences,
          formatSettings: settings
        }
      };
      handleUpdateProfile(updatedProfile);
    }
  };

  if (editingProfile) {
    return (
      <ProfileEditor 
        profile={editingProfile}
        onSave={handleUpdateProfile}
        onCancel={() => setEditingProfile(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">User Profiles</h3>
          <button
            onClick={handleAddProfile}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Profile
          </button>
        </div>
        <div className="space-y-3">
          {userProfiles.map(profile => (
            <div 
              key={profile.id}
              className={`p-3 rounded-lg border ${
                profile.id === activeProfile 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-gray-500 m-auto" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{profile.name}</h4>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        profile.role === 'premium' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.role === 'premium' ? 'Premium' : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingProfile(profile)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Edit profile"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {profile.id !== activeProfile && (
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {profile.id === activeProfile && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Current profile</span>
                    <button
                      onClick={handleSaveProfileSettings}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Save current settings to profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};