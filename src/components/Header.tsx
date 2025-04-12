import React from 'react';
import {
  Home, Edit2, Download, Settings, User, ChevronDown, LogOut,
  FileText, AlertCircle, Sparkles, ToggleLeft, ToggleRight, RefreshCw, Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { ViewMode, UserProfile, ScriptState } from '../types/screenplay';
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
  // Script state properties
  scriptState: ScriptState;
  // showGenerateScriptButton?: boolean;
  onGenerateScript?: () => void;
  beatsDisabled?: boolean;
  beatsAvailable?: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isSaving: boolean;
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
  suggestionsEnabled,
  setSuggestionsEnabled,
  // showGenerateScript,
  onGenerateScript,
  scriptState,
  beatsAvailable = false,
  hasUnsavedChanges,
  onSave,
  isSaving
}: HeaderProps) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const activeUser = userProfiles.find(profile => profile.id === activeProfile);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { showAlert } = useAlert();
  const handleNavigateToDashboard = () => {
    navigate('/');
  };
  useClickOutside(profileMenuRef, () => {
    setShowProfileMenu(false);
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      showAlert('error', 'Failed to sign out. Please try again.');
    }
  };



  return (
    <header className="bg-white shadow-sm z-10 flex-none">
      <div className="max-w-full px-4 py-4 flex items-center">
        {/* Left section - Title and home button */}
        <div className="w-[300px] flex-shrink-0 flex items-center space-x-4">
          <Home className="h-5 w-5 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
            onClick={handleNavigateToDashboard}
          />
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowTitlePageModal(true)}
              className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
              title={title}
            >
              {title}
            </button>
            <button
              onClick={() => setShowTitlePageModal(true)}
              className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onSave}
              disabled={isSaving || !onSave}
              className={`inline-flex items-center p-2 rounded-full transition-colors ${!onSave ? 'hidden' :
                isSaving ? 'text-gray-400 cursor-not-allowed' :
                  hasUnsavedChanges ? 'text-blue-500 hover:bg-blue-50 animate-pulse' :
                    'text-green-500 hover:bg-green-50'
                }`}
              title={
                isSaving
                  ? "Saving..."
                  : hasUnsavedChanges
                    ? "Unsaved changes"
                    : "All changes saved"
              }
            >
              {isSaving ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
            </button>

          </div>
        </div>

        {/* Center section - View Mode Selector (Always visible) */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('beats')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${viewMode === 'beats'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Beats
            </button>
            <button
              onClick={() => setViewMode('script')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${viewMode === 'script'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Script
            </button>
            <button
              onClick={() => setViewMode('boards')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${viewMode === 'boards'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Boards
            </button>
          </div>
        </div>

        {/* Right section - Actions and Profile */}
        <div className="w-[300px] flex-shrink-0 flex items-center justify-end space-x-4">
          {/* Generate Script button - conditionally shown */}
          {/* {showGenerateScriptButton && viewMode === 'beats' && (
            <button
              onClick={onGenerateScript}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              <FileText className="w-4 h-4 mr-2 inline-block" />
              Generate Script
            </button>
          )} */}

          {/* Show settings and export buttons when script has content */}
          <button
            onClick={openSettings}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          {/* Profile menu */}
          <div className="flex items-center gap-4">
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <Avatar
                    name={user?.user_metadata?.full_name || user?.email || 'User'}
                    size={32}
                    className="flex-shrink-0"
                    variant="profile"
                  />
                )}
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{user?.user_metadata?.full_name || user?.email}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        openAccountSettings(); // Call the function from props
                        setShowProfileMenu(false); // Close the menu
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      <Settings className="h-4 w-4" /> {/* Use Settings icon */}
                      Account Settings
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}