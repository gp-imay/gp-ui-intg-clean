import React, { useState, useEffect, useRef } from 'react'; // Ensure useState and useEffect are imported
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';
import Avatar from '../components/Dashboard/Avatar';
import { AccountSettingsModal } from '../components/Dashboard/AccountSettingsModal';
import ComingSoon from '../components/Dashboard/ComingSoon';
import NewScriptModal from '../components/Dashboard/NewScriptModal';
import { useAlert } from '../components/Alert';
import { useClarity } from '../contexts/ClarityContext';
// Comment out Formbricks import
// import formbricks from '@formbricks/js';

import {
  LogOut,
  Search,
  ChevronDown,
  ChevronUp,   // Using ChevronUp for open state
  MessageSquare, // Icon for feedback button
  X as CloseIcon, // Using X for close button in panel
  User,
  Clock,
  Star,
  Settings,
  FileText,
  Users,
  HelpCircle,
  CreditCard,
  Megaphone,
  Plus,
  ChevronRight,
  ChevronLeft,
  Trash2
} from 'lucide-react';
import { mockApi, Script } from '../services/mockApi';
import { supabase } from '../lib/supabase';
// Comment out FormbricksFeedback import
// import { FormbricksFeedback } from '../components/Dashboard/FormbricksFeedback';

type Section = 'scripts' | 'projects' | 'pricing' | 'promote' | 'help';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewScriptModal, setShowNewScriptModal] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('scripts');
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const INITIAL_SCRIPT_LIMIT = 6;
  const { setTag } = useClarity();

  useEffect(() => {
    // Tag the current page
    setTag('page', 'dashboard');
  }, []);


  // --- State for the expandable feedback panel ---
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useClickOutside(profileMenuRef, () => {
    setShowProfileMenu(false);
  });

  // Comment out Formbricks user info setup
  /*
  useEffect(() => {
    if (user) {
      // Set user information with Formbricks
      const setUserInfo = async () => {
        try {
          console.log(user)
          // Set the user ID
          await formbricks.setUserId(user.id);

          // Set user email
          if (user.email) {
            await formbricks.setEmail(user.email);
          }

          // Set additional attributes
          const attributes: Record<string, string> = {};

          if (user.user_metadata?.full_name) {
            attributes.name = user.user_metadata.full_name;
          }

          // Add any other user attributes you want to track
          if (Object.keys(attributes).length > 0) {
            await formbricks.setAttributes(attributes);
          }

          console.log("User information set in Formbricks");
        } catch (error) {
          console.error("Failed to set user information in Formbricks:", error);
        }
      };

      setUserInfo();
    }

    return () => {
      console.log("Logged out from Formbricks");
      // When the component unmounts or user logs out, logout from Formbricks
      const logoutFromFormbricks = async () => {
        try {
          await formbricks.logout();
          console.log("Logged out from Formbricks");
        } catch (error) {
          console.error("Failed to logout from Formbricks:", error);
        }
      };

      logoutFromFormbricks();
    };
  }, [user]); // This will run when the user object changes 
  */

  // Comment out Formbricks tracking function
  /*
  const handleSpecificAction = async () => {
    try {
      // This will trigger a survey with the action ID "feature_used" 
      // if there's a survey configured for this action in Formbricks
      await formbricks.track("feature_used");
      console.log("Action tracked in Formbricks");
    } catch (error) {
      console.error("Failed to track action in Formbricks:", error);
    }
  };
  */

  // --- Other useEffect hooks and functions ---
  useEffect(() => {
    const section = location.hash.slice(1) as Section;
    if (section && ['scripts', 'projects', 'pricing', 'promote', 'help'].includes(section)) {
      setActiveSection(section);
    } else {
      setActiveSection('scripts');
      navigate('#scripts', { replace: true });
    }
  }, [location, navigate]);
  useEffect(() => {
    // Check if the user is logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/login');
      }
    };

    checkUser();
  }, [navigate]);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const data = await mockApi.getUserScripts();
      setScripts(data);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to fetch scripts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllScripts = async () => {
    try {
      setLoading(true);
      const data = await mockApi.getAllUserScripts();
      setScripts(data);
      setShowAllScripts(true);
    } catch (error) {
      console.error('Failed to fetch all scripts:', error);
      showAlert('error', error instanceof Error ? error.message : 'Failed to fetch all scripts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'scripts') {
      fetchScripts();
    }
  }, [activeSection]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
      showAlert('error', 'Failed to sign out. Please try again.');
    }
  };

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    navigate(`#${section}`);
  };

  const handleScriptCreated = () => {
    fetchScripts();
    setShowAllScripts(false);
    setTag('action', 'after script created');
  };
  
  const handleFeedbackClick = () => {
    setIsFeedbackOpen(true);
    console.log("Opening feedback panel");
    
    // Comment out Formbricks tracking
    /*
    // Track this action in Formbricks
    formbricks.track("feedback_button_click")
      .catch(error => console.error("Failed to track feedback button click:", error));
    */
  };
  
  const handleScriptClick = (script: Script) => {
    try {
      const initialView = script.creation_method === 'WITH_AI' ? 'beats' : 'script';
      navigate(`/editor/${script.id}?view=${initialView}`);
    } catch (error) {
      console.error('Error navigating to script:', error);
      showAlert('error', 'Failed to open script. Please try again.');
    }
  };

  const handleViewAllScripts = () => {
    fetchAllScripts();
  };

  const handleDeleteScript = async (scriptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!window.confirm('Are you sure you want to delete this script?')) {
        return;
      }
      setLoading(true);
      await mockApi.deleteScript(scriptId);
      setScripts(prevScripts => prevScripts.filter(script => script.id !== scriptId));
      showAlert('success', 'Script deleted successfully');
    } catch (error) {
      console.error('Failed to delete script:', error);
      showAlert('error', 'Problem in deletion, try again after sometime');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDisplayName = () => {
    showAlert('info', 'Change display name functionality coming soon.');
  };
  const handleChangeEmail = () => {
    showAlert('info', 'Change email functionality coming soon.');
  };

  const getDisplayedScripts = () => {
    if (showAllScripts) {
      return scripts;
    }
    return scripts.slice(0, INITIAL_SCRIPT_LIMIT);
  };

  const renderContent = () => {
    if (activeSection !== 'scripts') {
      return <ComingSoon section={activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} />;
    }
    // Script Section Content
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header for Scripts Section */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Screenplays</h2>
          <button onClick={() => setShowNewScriptModal(true)} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Plus className="h-5 w-5 inline-block mr-2" /> Create New Script
          </button>
        </div>
        {/* Script List Container */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">Active Scripts</h3></div>
          {loading ? (<div className="px-6 py-8 text-center text-gray-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div> Loading scripts...</div>
          ) : scripts.length === 0 ? (<div className="px-6 py-8 text-center text-gray-500"><FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" /><p className="text-lg font-medium mb-2">No scripts yet</p><p className="text-sm">Create your first script by clicking the "Create New Script" button.</p></div>
          ) : (
            <div>
              {/* Desktop view - Table */}
              <div className="hidden md:block"><div className="relative">
                <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Script Name</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Genre</th><th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Type</th><th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Actions</th>{showAllScripts && <th className="w-[17px]"></th>}</tr></thead></table>
                <div className={`${showAllScripts ? 'max-h-[400px] overflow-y-auto' : ''}`}> <table className="min-w-full divide-y divide-gray-200"><tbody className="bg-white divide-y divide-gray-200">{getDisplayedScripts().map((script) => (<tr key={script.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => handleScriptClick(script)}><td className="px-6 py-4 whitespace-nowrap w-1/2"><div className="flex items-center"><Avatar name={script.name} size={32} className="flex-shrink-0 mr-4" variant="script" /><div className="text-sm font-medium text-gray-900">{script.name}</div></div></td><td className="px-6 py-4 whitespace-nowrap w-1/4"><span className="text-sm text-gray-600">{script.genre || 'Not specified'}</span></td><td className="px-6 py-4 whitespace-nowrap w-1/4 text-center"><span className={`px-2 py-1 text-xs font-medium rounded-full ${script.creation_method === 'WITH_AI' ? 'bg-blue-100 text-blue-800' : script.creation_method === 'UPLOAD' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{script.creation_method === 'WITH_AI' ? 'AI Assisted' : script.creation_method === 'UPLOAD' ? 'Uploaded' : 'Manual'}</span></td><td className="px-6 py-4 whitespace-nowrap w-16 text-center"><button onClick={(e) => handleDeleteScript(script.id, e)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50" title="Delete script"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
              </div></div>
              {/* Mobile view - Cards */}
              <div className="md:hidden"><div className={`${showAllScripts ? 'max-h-[70vh] overflow-y-auto' : ''}`}>{getDisplayedScripts().map((script) => (<div key={script.id} className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => handleScriptClick(script)}><div className="flex items-center mb-2"><Avatar name={script.name} size={32} className="flex-shrink-0 mr-3" variant="script" /><div className="font-medium">{script.name}</div></div><div className="flex justify-between text-sm"><div className="text-gray-600">{script.genre || 'Not specified'}</div><div className="text-center"><span className={`px-2 py-1 text-xs font-medium rounded-full ${script.creation_method === 'WITH_AI' ? 'bg-blue-100 text-blue-800' : script.creation_method === 'UPLOAD' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>{script.creation_method === 'WITH_AI' ? 'AI Assisted' : script.creation_method === 'UPLOAD' ? 'Uploaded' : 'Manual'}</span></div></div><div className="mt-2 flex justify-end"><button onClick={(e) => handleDeleteScript(script.id, e)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50" title="Delete script"><Trash2 className="w-4 h-4" /></button></div></div>))}</div></div>
            </div>
          )}
          {/* View All / Show Less Buttons */}
          {scripts.length > 0 && scripts.length > INITIAL_SCRIPT_LIMIT && !showAllScripts && (<div className="px-6 py-4 border-t border-gray-200"><button onClick={handleViewAllScripts} className="flex items-center text-blue-600 hover:text-blue-700 font-medium">View All Scripts<ChevronRight className="h-4 w-4 ml-1" /></button></div>)}
          {showAllScripts && (<div className="px-6 py-4 border-t border-gray-200"><button onClick={() => setShowAllScripts(false)} className="text-blue-600 hover:text-blue-700 font-medium">Show Less</button></div>)}
        </div>
      </div>
    ); // End Script Section Content return
  }; // End renderContent function

  // --- Main Dashboard Return ---
  return (
    // Outer container - relative positioning context for the fixed panel
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">

      {/* --- Left Sidebar --- */}
      {/* Uses z-20 to be above main content but below feedback panel */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen flex-shrink-0 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-4 flex-shrink-0">
          <img src="https://gplogos.blob.core.windows.net/logos/gp_beta_logo.png" alt="Grease Pencil" className="h-8" />
        </div>
        {/* Navigation */}
        <nav className="mt-8 px-4 overflow-y-auto flex-grow">
          <button onClick={() => handleSectionChange('scripts')} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${activeSection === 'scripts' ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}> <FileText className="h-5 w-5" /> Scripts </button>
          <button onClick={() => handleSectionChange('projects')} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mt-1 transition-colors duration-200 ${activeSection === 'projects' ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}> <Users className="h-5 w-5" /> Projects </button>
          <button onClick={() => handleSectionChange('pricing')} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mt-1 transition-colors duration-200 ${activeSection === 'pricing' ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}> <CreditCard className="h-5 w-5" /> Pricing </button>
          <button onClick={() => handleSectionChange('promote')} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mt-1 transition-colors duration-200 ${activeSection === 'promote' ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}> <Megaphone className="h-5 w-5" /> Promote </button>
          <button onClick={() => handleSectionChange('help')} className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mt-1 transition-colors duration-200 ${activeSection === 'help' ? 'text-white bg-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}> <HelpCircle className="h-5 w-5" /> Help </button>
        </nav>
        {/* Feedback Trigger Section (Pushed to bottom) */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleFeedbackClick}
            className="flex items-center justify-between w-full p-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
            aria-expanded={isFeedbackOpen}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Feedback
            </span>
            {isFeedbackOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* --- End Left Sidebar --- */}


      {/* --- Main Content Area --- */}
      {/* Uses z-10 to be below sidebar and feedback panel */}
      <div className="flex-1 flex flex-col overflow-hidden z-10"> {/* Changed overflow-y-auto to overflow-hidden */}
        {/* Header */}
        <header className="bg-white border-b border-gray-200 flex-shrink-0"> {/* Ensure header doesn't shrink */}
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4"><h1 className="text-xl font-semibold text-gray-900">Hello {user?.user_metadata?.full_name || user?.email} 👋</h1></div>
            <div className="flex items-center gap-4"><div className="relative" ref={profileMenuRef}><button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">{user?.user_metadata?.avatar_url ? (<img src={user.user_metadata.avatar_url} alt="Profile" className="h-8 w-8 rounded-full" />) : (<Avatar name={user?.user_metadata?.full_name || user?.email || 'User'} size={32} className="flex-shrink-0" variant="profile" />)}<ChevronDown className="h-4 w-4 text-gray-600" /></button>{showProfileMenu && (<div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"> {/* Increased z-index for dropdown */} <div className="p-4 border-b border-gray-200"><p className="font-semibold text-gray-900 truncate">{user?.user_metadata?.full_name || user?.email}</p><p className="text-sm text-gray-600 truncate">{user?.email}</p></div><div className="py-2"><button onClick={() => { setShowAccountSettingsModal(true); setShowProfileMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings className="h-4 w-4" /> Account Settings</button><button onClick={handleSignOut} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><LogOut className="h-4 w-4" /> Sign out</button></div></div>)}</div></div>
          </div>
        </header>
        {/* Main scrollable content */}
        <main className="flex-1 p-8 overflow-y-auto"> {/* Make this the scrolling container */}
          {renderContent()}
        </main>
      </div>
      {/* --- End Main Content Area --- */}


      {/* --- Sliding Feedback Panel --- */}
      {/* Uses fixed positioning and z-30 to overlay */}
      <div
        className={`
          fixed bottom-0 left-0 h-full w-[500px]                             
          bg-white shadow-xl border-r border-gray-200                   
          transform transition-transform duration-300 ease-in-out       
          z-30                                                          
          ${isFeedbackOpen ? 'translate-x-64' : '-translate-x-full'}   
        `}
      >
        {/* Panel Header */}
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Feedback</h3>
          <button onClick={() => setIsFeedbackOpen(false)} className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Replace Formbricks with iframe */}
        {/* 
        <div className="p-4 overflow-y-auto h-full pb-16">
          <FormbricksFeedback environmentId="cma214b402gfgvx013ozpppvv" />
        </div>
        */}
        
        {/* YouForm Iframe Implementation */}
        <div className="h-full overflow-hidden">
          <iframe 
            src="https://app.youform.com/forms/zksc5geg" 
            loading="lazy" 
            width="100%" 
            height="100%"
            title="User Feedback Form"
            className="w-full h-full"
          ></iframe>
        </div>
      </div>
      {/* --- End Feedback Panel --- */}


      {/* Modals (Rendered last, typically use their own high z-index) */}
      <NewScriptModal
        isOpen={showNewScriptModal}
        onClose={() => setShowNewScriptModal(false)}
        onScriptCreated={handleScriptCreated}
      />
      <AccountSettingsModal
        isOpen={showAccountSettingsModal}
        onClose={() => setShowAccountSettingsModal(false)}
        displayName={user?.user_metadata?.full_name || user?.email || 'User'}
        email={user?.email || ''}
        onChangeDisplayName={handleChangeDisplayName}
        onChangeEmail={handleChangeEmail}
      />

    </div> // End Outer container
  );
} // End Dashboard Component