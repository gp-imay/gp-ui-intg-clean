import React from 'react';
import { X } from 'lucide-react';

// Interface defining the structure of title page data
interface TitlePage {
  title: string;
  author: string;
  contact: string;
}

// Interface defining the props expected by the TitlePageModal component
interface TitlePageModalProps {
  show: boolean; // Controls modal visibility
  onClose: () => void; // Function to close the modal
  titlePage: TitlePage; // Current title page data
  setTitlePage: (titlePage: TitlePage) => void; // Function to update title page state
  setTitle: (title: string) => void; // Function to update the main script title state
}

// Base styles for editable fields to look somewhat like plain text
const editableFieldStyles = `
  font-courier text-[12pt] leading-normal
  bg-transparent border-none focus:outline-none
  hover:bg-gray-50 focus:bg-gray-50 rounded p-1 w-full
`;

// Functional component for the Title Page Modal
export const TitlePageModal: React.FC<TitlePageModalProps> = ({
  show,
  onClose,
  titlePage,
  setTitlePage,
  setTitle
}) => {
  // Don't render the modal if 'show' prop is false
  if (!show) return null;

  // Function to handle input changes and update the state
  const handleChange = (field: keyof TitlePage, value: string) => {
    // Enforce uppercase for title
    const processedValue = field === 'title' ? value.toUpperCase() : value;
    const updatedTitlePage = { ...titlePage, [field]: processedValue };
    setTitlePage(updatedTitlePage);

    // If the title field changed, also update the main script title
    if (field === 'title') {
      setTitle(processedValue);
    }
  };

  // Prevent modal close when clicking inside content
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Modal backdrop and container
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose} // Close modal if backdrop is clicked
    >
      {/* Modal Content Area - Scaled Representation */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl aspect-[8.5/11] relative flex flex-col" // Responsive width, fixed aspect ratio
        onClick={handleContentClick} // Prevent closing
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 z-10"
          aria-label="Close Title Page"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Simulated Page Content with Margins (using padding on an inner div) */}
        <div
            className="flex-grow p-[5%] sm:p-[7%] md:p-[10%] flex flex-col" // Use percentage padding for scaling margins
            style={{ fontFamily: "'Courier Prime', monospace", fontSize: '12pt', lineHeight: '1.5' }}
        >
            {/* Spacer to push Title down */}
            <div style={{ height: '25%' }}></div> {/* Approximate 1/4 page space */}

            {/* Title */}
            <div className="w-full mb-4">
                <input
                    type="text"
                    value={titlePage.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="SCREENPLAY TITLE"
                    className={`${editableFieldStyles} text-center uppercase font-bold`}
                />
            </div>

            {/* Spacer */}
             <div style={{ height: '2em' }}></div> {/* Space below title */}

            {/* Written by */}
            <p className="text-center mb-2">
              Written by
            </p>

            {/* Author */}
            <div className="w-full mb-4">
                <input
                    type="text"
                    value={titlePage.author}
                    onChange={(e) => handleChange('author', e.target.value)}
                    placeholder="Author Name"
                    className={`${editableFieldStyles} text-center`}
                />
            </div>

            {/* Spacer to push contact info down */}
            <div className="flex-grow"></div>

            {/* Contact Info */}
            {/* <div className="w-1/2">
                <textarea
                    value={titlePage.contact}
                    onChange={(e) => handleChange('contact', e.target.value)}
                    placeholder={"Contact Information\nEmail Address\nPhone Number"}
                    className={`${editableFieldStyles} text-left resize-none overflow-hidden h-auto`} // Auto height, no resize
                    rows={3} // Hint for initial height
                    style={{ minHeight: '4.5em' }} // Ensure space for 3 lines
                />
            </div> */}
        </div>
      </div>
    </div>
  );
};