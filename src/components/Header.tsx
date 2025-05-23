// src/components/Header.tsx
import React from 'react';
import {
  Home, Edit2, Download, Settings, User, ChevronDown, LogOut,
  FileText, Sparkles, Save, RefreshCw
} from 'lucide-react'; // Removed unused icons, added Save, RefreshCw
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { ViewMode, UserProfile, ScriptState, ScriptCreationMethod } from '../types/screenplay'; // Added ScriptCreationMethod
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from './Alert';
import Avatar from './Dashboard/Avatar';

interface HeaderProps {
  title: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setShowTitlePageModal: (show: boolean) => void;
  handleExport: () => void;
  openSettings: () => void;
  openAccountSettings: () => void;
  userProfiles: UserProfile[];
  activeProfile: string;
  setActiveProfile: (id: string) => void;
  suggestionsEnabled?: boolean;
  setSuggestionsEnabled?: (enabled: boolean) => void;
  scriptState: ScriptState;
  onGenerateScript?: () => void;
  beatsAvailable?: boolean; // Renamed from beatsDisabled for clarity
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isSaving: boolean;
  // Add scriptCreationMethod to HeaderProps
  scriptCreationMethod?: ScriptCreationMethod; 
}

export function Header({
  title,
  viewMode,
  setViewMode,
  setShowTitlePageModal,
  handleExport,
  openSettings,
  openAccountSettings,
  userProfiles,
  activeProfile,
  setActiveProfile,
  // suggestionsEnabled, // This seems unused in the Header directly now
  // setSuggestionsEnabled, // This seems unused in the Header directly now
  // onGenerateScript, // This was for a button in Header, now moved to BeatSheetView/ScriptEditor
  // scriptState, // Used for conditional button, now handled by parent
  // beatsAvailable = false, // This can be derived from scriptCreationMethod if needed
  hasUnsavedChanges,
  onSave,
  isSaving,
  scriptCreationMethod // Receive scriptCreationMethod
}: HeaderProps) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { showAlert } = useAlert();
  
  useClickOutside(profileMenuRef, () => {
    setShowProfileMenu(false);
  });

  const handleNavigateToDashboard = () => {
    navigate('/');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      showAlert('error', 'Failed to sign out. Please try again.');
    }
  };

  const saveButtonClass = `inline-flex items-center p-2 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    ${isSaving 
      ? 'text-gray-400 cursor-not-allowed' 
      : hasUnsavedChanges 
        ? 'text-blue-500 hover:bg-blue-100 animate-pulse-strong' // Use new animation class
        : 'text-green-500 hover:bg-green-100'
    }`;

  return (
    <header className="bg-white shadow-sm z-10 flex-none">
      <div className="max-w-full px-4 py-4 flex items-center">
        <div className="w-[300px] flex-shrink-0 flex items-center space-x-4">
          <img
            src="https://gplogos.blob.core.windows.net/logos/gp_beta_logo.png"
            alt="Grease Pencil"
            className="h-7 cursor-pointer"
            onClick={handleNavigateToDashboard}
          />
          <Home 
            className="h-5 w-5 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
            onClick={handleNavigateToDashboard}
            // title="Dashboard"
          />
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowTitlePageModal(true)}
              className="text-l font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
              title={title}
            >
              {title}
            </button>
            <button
              onClick={() => setShowTitlePageModal(true)}
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
              title="Edit Title"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('beats')}
              disabled={scriptCreationMethod && scriptCreationMethod !== 'WITH_AI'} // Disable if not WITH_AI
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'beats'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              } ${scriptCreationMethod && scriptCreationMethod !== 'WITH_AI' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={scriptCreationMethod && scriptCreationMethod !== 'WITH_AI' ? "Beats view is only available for AI-assisted scripts" : "Beats View"}
            >
              Beats
            </button>
            <button
              onClick={() => setViewMode('script')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'script'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Script
            </button>
            <button
              onClick={() => setViewMode('boards')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'boards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Boards
            </button>
          </div>
        </div>

        <div className="w-[300px] flex-shrink-0 flex items-center justify-end space-x-4">
          {/* <button
            onClick={openSettings}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button> */}
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className={saveButtonClass}
            title={isSaving ? "Saving..." : hasUnsavedChanges ? "Save changes" : "All changes saved"}
          >
            {isSaving ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
            >
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="h-8 w-8 rounded-full" />
              ) : (
                <Avatar name={user?.user_metadata?.full_name || user?.email || 'User'} size={32} className="flex-shrink-0" variant="profile" />
              )}
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900 truncate">{user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => { openAccountSettings(); setShowProfileMenu(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4" /> Account Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )}; 