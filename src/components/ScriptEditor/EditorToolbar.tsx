import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  StrikethroughIcon, 
  Type, 
  MessageSquare, 
  Sparkles,
  Wand2,
  Maximize2,
  Minimize2,
  MessageCircle,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
  position: { top: number; left: number };
  onComment: () => void;
  onAIAssist?: () => void;
  showCommentInput: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  position,
  onComment,
  onAIAssist,
  showCommentInput
}) => {
  const [showAIMenu, setShowAIMenu] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        aiMenuRef.current && 
        !aiMenuRef.current.contains(event.target as Node) &&
        aiButtonRef.current && 
        !aiButtonRef.current.contains(event.target as Node)
      ) {
        setShowAIMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!editor) return null;

  const handleAIAction = (action: string) => {
    // Here you would implement the actual AI action
    console.log(`AI action: ${action}`);
    if (onAIAssist) onAIAssist();
    // Close the menu after selecting an action
    setShowAIMenu(false);
  };

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg p-1 flex gap-1 z-50 animate-fade-in"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${
          editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        title="Bold (⌘B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${
          editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        title="Italic (⌘I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${
          editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        title="Underline (⌘U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-100 ${
          editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        title="Strikethrough"
      >
        <StrikethroughIcon className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to);
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent(text.toUpperCase())
            .run();
        }}
        className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
        title="Uppercase"
      >
        <Type className="w-4 h-4" />
      </button>
      {/* <button
        onClick={onComment}
        className={`p-1.5 rounded hover:bg-gray-100 ${
          showCommentInput ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
        }`}
        title="Add Comment"
      >
        <MessageSquare className="w-4 h-4" />
      </button> */}
      {onAIAssist && (
        <>
          {/* <div className="w-px h-6 bg-gray-200 mx-1" /> */}
          <div className="relative">
            {/* <button
              ref={aiButtonRef}
              onClick={() => setShowAIMenu(!showAIMenu)}
              className={`p-1.5 rounded hover:bg-gray-100 relative ${
                showAIMenu ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
              }`}
              title="AI Assist"
            >
              <div className="ai-icon-container">
                <div className="ai-icon-pulse"></div>
                <Sparkles className="ai-icon-sparkle w-4 h-4" />
              </div>
            </button>
             */}
            {showAIMenu && (
              <div 
                ref={aiMenuRef}
                className="absolute left-0 top-full mt-2 w-[220px] bg-white rounded-lg shadow-lg p-2 flex flex-col z-50 ai-menu"
              >
                <div className="text-xs text-gray-500 mb-2 px-2">AI Actions</div>
                
                <button 
                  onClick={() => handleAIAction('improve')}
                  className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 text-gray-700 text-sm group ai-action-button"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors ai-action-icon">
                    <Wand2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Improve</div>
                    <div className="text-xs text-gray-500">Enhance writing quality</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleAIAction('expand')}
                  className="flex items-center gap-2 p-2 rounded hover:bg-purple-50 text-gray-700 text-sm group ai-action-button"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors ai-action-icon">
                    <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Expand</div>
                    <div className="text-xs text-gray-500">Add more details</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleAIAction('shorten')}
                  className="flex items-center gap-2 p-2 rounded hover:bg-amber-50 text-gray-700 text-sm group ai-action-button"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors ai-action-icon">
                    <Minimize2 className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Shorten</div>
                    <div className="text-xs text-gray-500">Make it more concise</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleAIAction('dialogue')}
                  className="flex items-center gap-2 p-2 rounded hover:bg-green-50 text-gray-700 text-sm group ai-action-button"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors ai-action-icon">
                    <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Dialogue</div>
                    <div className="text-xs text-gray-500">Improve character speech</div>
                  </div>
                </button>
                
                <div className="border-t border-gray-100 my-1"></div>
                
                <button 
                  onClick={() => handleAIAction('rewrite')}
                  className="flex items-center gap-2 p-2 rounded hover:bg-indigo-50 text-gray-700 text-sm group ai-action-button"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors ai-action-icon">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Rewrite</div>
                    <div className="text-xs text-gray-500">Alternative version</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => handleAIAction('continue')}
                  className="flex items-center gap-2 p-2 rounded hover:bg-rose-50 text-gray-700 text-sm group ai-action-button"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors ai-action-icon">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Continue</div>
                    <div className="text-xs text-gray-500">Generate next part</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};