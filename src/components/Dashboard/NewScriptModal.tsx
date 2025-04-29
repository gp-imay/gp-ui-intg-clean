import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Wand2, RefreshCw, FileText } from 'lucide-react'; // Added FileText
import { useClickOutside } from '../../hooks/useClickOutside';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../components/Alert';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useClarity } from '../../contexts/ClarityContext';

// Interface defining the props expected by the NewScriptModal component
interface NewScriptModalProps {
  isOpen: boolean; // Controls modal visibility
  onClose: () => void; // Function to close the modal
  onScriptCreated?: () => void; // Optional callback after script creation
}

// Functional component for the New Script Modal
export default function NewScriptModal({ isOpen, onClose, onScriptCreated }: NewScriptModalProps) {
  // State variables for form inputs
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [genre, setGenre] = useState('');
  const [story, setStory] = useState('');
  const { setTag } = useClarity();

  useEffect(() => {
    // Tag the current page
    setTag('page', 'New_Script_Modal');
  }, []);


  // State variables for modal behavior and loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingType, setSubmittingType] = useState<'ai' | 'blank' | null>(null); // Track which button is loading
  const [isGeneratingBeats, setIsGeneratingBeats] = useState(false); // For AI loading animation after creation
  const [newScriptId, setNewScriptId] = useState<string | null>(null); // Store ID of newly created script

  // Refs for modal interaction
  const modalRef = useRef<HTMLDivElement>(null);

  // Hooks for navigation and alerts
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  // Lottie animation URLs
  const creatingAiScriptAnimationUrl = "https://lottie.host/d1d949ce-806e-4e62-bf74-db0d357c5e35/ZyxwDGXbdZ.lottie";

  // Hook to handle clicks outside the modal
  useClickOutside(modalRef, onClose);

  // Effect to handle Escape key press and body overflow
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll when modal is open
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Restore background scroll on close
    };
  }, [isOpen, onClose]);

  // Effect to reset form state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSubtitle('');
      setGenre('');
      setStory('');
      setIsGeneratingBeats(false);
      setNewScriptId(null);
      setIsSubmitting(false);
      setSubmittingType(null);
    }
  }, [isOpen]);

  // Combined handler for creating script (either blank or with AI)
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>, withAI: boolean) => {
    e.preventDefault(); // Prevent default button behavior

    // Basic validation
if (!title.trim() || !story.trim()) { // Check both title and story
  let errorMessage = '';
  if (!title.trim() && !story.trim()) {
    errorMessage = 'Title and Story/Logline are required';
  } else if (!title.trim()) {
    errorMessage = 'Title is required';
  } else {
    errorMessage = 'Story/Logline is required';
  }
  showAlert('error', errorMessage);
  return; // Stop submission if either is missing
}

    try {
      setIsSubmitting(true);
      setSubmittingType(withAI ? 'ai' : 'blank'); // Indicate which button is processing

      // Prepare data for API call
      const scriptData = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        genre: genre.trim(),
        story: story.trim()
      };
      let createdScript;

      // Call the appropriate API function based on user choice
      if (withAI) {
        console.log(`Creating script with AI assistance`);
        setTag('action', 'before script creation');
        setTag('scriptType', "With AI");
    
        // Assuming mockApi returns { script: Script, beats: Beat[] }
        const result = await mockApi.createAIScript(scriptData);
        createdScript = result.script; // The created script object
        console.log("Script created with beats:", result.beats); // Log beats if needed
      } else {
        console.log(`Creating script manually`);
        // Assuming mockApi returns Script object
        setTag('action', 'after script creation');
        setTag('scriptType', "With AI");
        setTag('scriptCreation', "Sucess");
        createdScript = await mockApi.createScript(scriptData);
        setTag('action', 'after script creation');
        setTag('scriptType', "Manual");
        setTag('scriptCreation', "Sucess");
      }

      console.log("Script created successfully:", createdScript);

      // Ensure script ID exists before proceeding
      if (!createdScript.id) {
        throw new Error('Created script is missing an ID');
      }

      setNewScriptId(createdScript.id); // Store the new ID
      showAlert('success', 'Script created successfully!');
      onScriptCreated?.(); // Call the callback if provided

      // Handle post-creation flow based on type
      if (withAI) {
        setIsGeneratingBeats(true); // Show AI loading animation modal
        // Simulate beat generation delay before navigating
        setTimeout(() => {
          setIsGeneratingBeats(false); // Hide loading animation
          onClose(); // Close the creation modal
          // Navigate to the editor in 'beats' view for AI scripts
          navigate(`/editor/${createdScript.id}?view=beats`);
        }, 2000); // Simulate 2 seconds delay
      } else {
        // Regular script flow: close modal and navigate to editor
        onClose();
        navigate(`/editor/${createdScript.id}`); // Navigate to default 'script' view
      }
    } catch (err: any) {
      console.error("Error creating script:", err);
      setTag('scriptCreation', "Failed");
      showAlert('error', err.message || 'Failed to create script');
      // Reset loading state only on error, success handles it via navigation/loading animation
      setIsSubmitting(false);
      setSubmittingType(null);
    }
  };

  // Render AI loading state if applicable
  if (isOpen && isGeneratingBeats && newScriptId) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            aria-hidden="true"
          />
          {/* Loading Modal Content */}
          <div
            ref={modalRef} // Ref is still needed for useClickOutside, though clicking outside is less likely here
            className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all"
          >
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                 <DotLottieReact
                     src={creatingAiScriptAnimationUrl}
                     loop
                     autoplay
                 />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                 Creating Your AI-Assisted Script...
              </h2>
              <p className="mb-6 text-gray-600">
                Processing the details and generating initial story beats. Please wait...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render the main modal if isOpen is false
  if (!isOpen) return null;

  // Render the main New Script Modal
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Container */}
        <div
          ref={modalRef}
          className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all"
        >
          {/* Close Button */}
          <div className="absolute right-4 top-4">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Header */}
          <div className="px-8 py-6">
            <h2 className="text-2xl font-bold text-gray-900" id="modal-title">
              New Script
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Fill in the details below, or start blank and add them later.
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 pb-8">
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title <span className="text-red-500">*</span> {/* Indicate required */}
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 block w-full rounded-[8px] border border-gray-300 px-4 py-2.5 focus:border-[#4B84F3] focus:outline-none"
                  placeholder="Enter script title"
                  required // HTML required attribute
                />
              </div>

              {/* Subtitle Input */}
              <div>
                <label
                  htmlFor="subtitle"
                  className="block text-sm font-medium text-gray-700"
                >
                   Subtitle
                </label>
                <input
                  type="text"
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="mt-2 block w-full rounded-[8px] border border-gray-300 px-4 py-2.5 focus:border-[#4B84F3] focus:outline-none"
                  placeholder="Enter subtitle (optional)"
                />
              </div>

              {/* Genre Input */}
              <div>
                <label
                  htmlFor="genre"
                  className="block text-sm font-medium text-gray-700"
                >
                  Genre
                </label>
                <input
                  type="text"
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="mt-2 block w-full rounded-[8px] border border-gray-300 px-4 py-2.5 focus:border-[#4B84F3] focus:outline-none"
                  placeholder="e.g., Sci-Fi, Comedy, Drama"
                />
              </div>

              {/* Story Input */}
              <div>
                <label
                  htmlFor="story"
                  className="block text-sm font-medium text-gray-700"
                >
                  Story / Logline <span className="text-red-500">*</span> {/* Added asterisk */}
                </label>
                <textarea
                  id="story"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={4}
                  className="mt-2 block w-full rounded-[8px] border border-gray-300 px-4 py-2.5 focus:border-[#4B84F3] focus:outline-none"
                  placeholder="Briefly describe your story (optional)"
                />
              </div>

              {/* Buttons Section */}
              <div className="pt-6">
                 <p className="text-center text-sm font-medium text-gray-600 mb-4">How would you like to start?</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Start Blank Button */}
                    <button
                      data-event-name="create_script_blank"
                      type="button" // Use type="button" to prevent default form submission
                      onClick={(e) => handleSubmit(e, false)} // Call handler with withAI=false
                      disabled={isSubmitting} // Disable if any submission is in progress
className={`flex flex-col items-center justify-center text-center p-6 border rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${ // Changed focus ring
  isSubmitting && submittingType !== 'blank'
    ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' // Disabled state
    : 'border-gray-300 bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800' // Normal state + Blue hover
}`}
                    >
                      
                      <div className="w-12 h-12 mb-2"> {/* Container to control size */}
  <DotLottieReact
    src="https://lottie.host/3c354c01-1c9b-4ad5-be05-ecb598d0ae65/T7RUoQXfCr.json" // Blank script animation URL
    loop
    autoplay
  />
</div>
                      <span className="text-md font-semibold text-gray-800">Start Blank</span>
                      <span className="text-xs text-gray-500 mt-1">Create a traditional screenplay from scratch.</span>
                      {/* Show spinner only if this specific button is submitting */}
                      {isSubmitting && submittingType === 'blank' && (
                        <RefreshCw className="mt-3 h-4 w-4 animate-spin text-gray-600" />
                      )}
                    </button>

                    {/* Start with AI Button */}
                    <button
                      data-event-name="create_script_ai"
                      type="button" // Use type="button"
                      onClick={(e) => handleSubmit(e, true)} // Call handler with withAI=true
                      disabled={isSubmitting} // Disable if any submission is in progress
                      className={`flex flex-col items-center justify-center text-center p-6 border rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isSubmitting && submittingType !== 'ai'
                         ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' // Disabled state
                         : 'border-gray-300 bg-white text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-800' // Normal state + Blue hover
                     }`}
                    >
                      <div className="w-12 h-12 mb-2"> {/* Container to control size */}
  <DotLottieReact
    src="https://lottie.host/48d60e8f-25ce-4874-91b4-be3a55d98b20/ilGRvxsEC9.json" // AI animation URL
    loop
    autoplay
  />
</div>
<span className="text-md font-semibold text-gray-800 group-hover:text-blue-800 transition-colors">Start with AI</span> {/* Default gray, blue on hover */}
<span className="text-xs text-gray-500 group-hover:text-blue-600 mt-1 transition-colors">Generate story beats based on your inputs.</span> {/* Default gray, blue on hover */}
                       {/* Show spinner only if this specific button is submitting */}
                       {isSubmitting && submittingType === 'ai' && (
                        <RefreshCw className="mt-3 h-4 w-4 animate-spin text-blue-700" />
                       )}
                    </button>
                 </div>
              </div>
              {/* --- End Buttons Section --- */}

            </div> {/* End space-y-6 */}
          </div> {/* End Form Content (px-8 pb-8) */}
        </div> {/* End Modal Container */}
      </div> {/* End Flex Centering */}
    </div> // End Fixed Container
  );
}