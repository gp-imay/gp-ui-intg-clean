import React from 'react';
import { 
  ChevronLeft, 
  FileText, 
  MessageSquare, 
  StickyNote, 
  Keyboard,
  Clapperboard,
  Activity,
  User,
  MessageSquareText,
  Parentheses,
  ArrowRight,
  Bold,
  Italic,
  Underline,
  StrikethroughIcon,
  X
} from 'lucide-react';
import { SidebarTab, Comment } from '../types/screenplay';

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  elements: Array<{ type: string; content: string }>;
  getSceneText: (content: string) => string;
  totalWords: number;
  totalPages: number;
  comments?: Comment[];
  onDeleteComment?: (commentId: string) => void;
  onCommentClick?: (comment: Comment) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  elements,
  getSceneText,
  totalWords,
  totalPages,
  comments = [],
  onDeleteComment,
  onCommentClick
}) => {
  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'scenes':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {elements
                .filter(el => el.type === 'scene-heading')
                .map((scene, index) => (
                  <div 
                    key={index}
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <span className="text-sm text-gray-600">Scene {index + 1}</span>
                    <p className="text-sm font-medium">{getSceneText(scene.content) || 'Untitled Scene'}</p>
                  </div>
                ))}
            </div>
          </div>
        );
      case 'comments':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-1">Select text and use the comment button to add comments</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div 
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-3 relative group hover:bg-gray-100 cursor-pointer"
                    onClick={() => onCommentClick?.(comment)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </div>
                      {onDeleteComment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteComment(comment.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                          title="Delete comment"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <textarea
                placeholder="Add general notes about your screenplay..."
                className="w-full h-full min-h-[200px] p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
      case 'inputs':
        return (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium mb-3">Keyboard Shortcuts</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘1</kbd>
                    <div className="flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-gray-600" />
                      <span>Scene Heading</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘2</kbd>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-600" />
                      <span>Action</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘3</kbd>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span>Character</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘4</kbd>
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4 text-gray-600" />
                      <span>Dialogue</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘5</kbd>
                    <div className="flex items-center gap-2">
                      <Parentheses className="w-4 h-4 text-gray-600" />
                      <span>Parenthetical</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘6</kbd>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-600" />
                      <span>Transition</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t my-4"></div>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium mb-3">Text Formatting</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘B</kbd>
                    <div className="flex items-center gap-2">
                      <Bold className="w-4 h-4 text-gray-600" />
                      <span>Bold</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘I</kbd>
                    <div className="flex items-center gap-2">
                      <Italic className="w-4 h-4 text-gray-600" />
                      <span>Italic</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘U</kbd>
                    <div className="flex items-center gap-2">
                      <Underline className="w-4 h-4 text-gray-600" />
                      <span>Underline</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘K</kbd>
                    <div className="flex items-center gap-2">
                      <StrikethroughIcon className="w-4 h-4 text-gray-600" />
                      <span>Strike</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 overflow-hidden relative ${
      isOpen ? 'w-64' : 'w-0'
    }`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex-none flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('scenes')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'scenes' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Scenes"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`p-2 rounded-lg transition-colors relative ${
                activeTab === 'comments' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Comments"
            >
              <MessageSquare className="w-4 h-4" />
              {comments.length > 0 && (
                <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'notes' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Notes"
            >
              <StickyNote className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('inputs')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'inputs' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {renderSidebarContent()}

        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>Total Words:</span>
              <span className="font-medium">{totalWords}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span>Pages:</span>
              <span className="font-medium">{totalPages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};