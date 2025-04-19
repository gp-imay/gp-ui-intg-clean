import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { ScriptElement as ScriptElementTypeDefinition, ElementType, getNextElementType, Comment, ElementFormat, SceneSuggestions, AIActionType } from '../types/screenplay';
// import { ScriptElement as ScriptElementTypeDefinition, ElementType, /* ... */ } from '../types/screenplay'; // Import added/updated

import { useScriptSuggestions } from '../hooks/useScriptSuggestions';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Suggestions } from './Suggestions';
import { TypeIcon } from './ScriptEditor/TypeIcon';
import { FormatButtonsPanel } from './ScriptEditor/FormatButtonsPanel';
import { EditorToolbar } from './ScriptEditor/EditorToolbar';
import { CommentInput } from './ScriptEditor/CommentInput';
import { CommentTooltip } from './ScriptEditor/CommentTooltip';
import { AIToolsPanel } from './ScriptEditor/AIToolsPanel';
import { Sparkles } from 'lucide-react';
import {useAlert} from './Alert';
import { DotLottieReact } from '@lottiefiles/dotlottie-react'; // Add this line

interface ToolbarPosition {
  top: number;
  left: number;
}

const getElementStyles = (type: ElementType, format: ElementFormat) => {
  const base = 'outline-none font-courier text-[12pt] leading-[1.5] focus:outline-none bg-transparent';
  const alignment = `text-${format.alignment}`;
  
  let styles = `${base} ${alignment}`;
  
  if (type === 'dialogue' || type === 'character' || type === 'parenthetical') {
    styles += ' mx-auto';
  }
  
  if (type === 'scene-heading') {
    styles += ' uppercase font-bold';
  } else if (type === 'character') {
    styles += ' uppercase font-semibold';
  } else if (type === 'parenthetical') {
    styles += ' italic';
  } else if (type === 'transition') {
    styles += ' uppercase font-semibold';
  }
  
  return styles;
};

interface ScriptElementProps {
  id: string;
  type: ElementType;
  content: string;
  isSelected: boolean;
  onChange: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string, splitData?: { beforeContent: string; afterContent: string }) => void;
  onFocus: (id: string) => void;
  onTypeChange: (id: string, type: ElementType) => void;
  autoFocus?: boolean;
  onAIAssistClick?: () => void;
  // elements: { type: ElementType; content: string }[];
  elements: ScriptElementTypeDefinition[];
  onAddComment: (comment: Comment) => void;
  activeCommentId?: string | null;
  comments: Comment[];
  formatSettings: ElementFormat;
  suggestions?: SceneSuggestions;
  showAITools?: boolean;
  componentId?: string;
  onRequestExpansion?: (componentId: string, actionType: AIActionType) => void;
  onNavigateElement: (currentId: string, direction: 'up' | 'down') => void; // <--- ADD THIS TYPE
}

interface ScriptElementRef {
  containsCommentRange: (from: number, to: number) => boolean;
  focusCommentRange: (from: number, to: number) => void;
  focusEditorEnd: () => void; 
}

export const ScriptElement = forwardRef<ScriptElementRef, ScriptElementProps>((props, ref) => {
  const {
    id,
    type,
    content,
    isSelected,
    onChange,
    onKeyDown,
    onFocus,
    onTypeChange,
    autoFocus,
    onAIAssistClick,
    elements,
    onAddComment,
    activeCommentId,
    comments = [],
    formatSettings,
    suggestions,
    showAITools = false,
    componentId,
    onRequestExpansion,
    onNavigateElement,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showFormatting, setShowFormatting] = useState(false);
  const [isAIToolsPanelOpen, setIsAIToolsPanelOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isClickingSuggestion, setIsClickingSuggestion] = useState(false);
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(true);
  const [showInlineTools, setShowInlineTools] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0 });
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [commentTooltipPosition, setCommentTooltipPosition] = useState<ToolbarPosition | null>(null);
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState<ToolbarPosition | null>(null);
  const [lastWordInfo, setLastWordInfo] = useState<{word: string, start: number, end: number} | null>(null);
  const [contentChanged, setContentChanged] = useState(false);
  const [previousType, setPreviousType] = useState<ElementType>(type);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mouseOverComment, setMouseOverComment] = useState(false);
  const [mouseOverTooltip, setMouseOverTooltip] = useState(false);
  const [cursorBlinking, setCursorBlinking] = useState(true);
  const [lastCursorActivity, setLastCursorActivity] = useState(Date.now());
  const formatButtonsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiToolsPanelRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const { showAlert } = useAlert();
  // Add this constant near the imports or inside the component
  const aiIconAnimationUrl = "https://lottie.host/48d60e8f-25ce-4874-91b4-be3a55d98b20/ilGRvxsEC9.json";
  

  const {
    suggestions: suggestionsData,
    selectedIndex,
    isVisible: showSuggestions,
    navigateSuggestions,
    resetSuggestions,
    setSelectedIndex,
    markSuggestionSelected
  } = useScriptSuggestions(type, content, cursorPosition, elements, hasTextSelection, suggestions);

  // Reset suggestions when element type changes
  useEffect(() => {
    if (previousType !== type) {
      resetSuggestions();
      setPreviousType(type);
    }
  }, [type, previousType, resetSuggestions]);

  // Handle tooltip mouse events
  const handleTooltipMouseEnter = () => {
    setMouseOverTooltip(true);
  };

  const handleTooltipMouseLeave = () => {
    setMouseOverTooltip(false);
    setTimeout(() => {
      if (!mouseOverComment && !mouseOverTooltip) {
        setTooltipVisible(false);
      }
    }, 100);
  };

  const handleAIAction = async (action: string) => {
    // Close the AI tools panel
    closeAIToolsPanel();
    // console.log("11111",action)
    if (action === 'expand' ||  action === 'shorten' || action === 'rewrite' || action === 'continue') {
      if (!componentId) {
        showAlert('error', 'Cannot expand: No component ID available for this element');
        return;
      }
      
      if (onRequestExpansion) {
        
        onRequestExpansion(componentId, action as AIActionType);
      }
    } else if (onAIAssistClick) {
      // Handle other AI actions
      onAIAssistClick();
    }
  };
  

  // Handle format buttons panel visibility
  const handleFormatButtonsMouseEnter = () => {
    if (formatButtonsTimeoutRef.current) {
      clearTimeout(formatButtonsTimeoutRef.current);
      formatButtonsTimeoutRef.current = null;
    }
    setShowFormatting(true);
  };

  const handleFormatButtonsMouseLeave = () => {
    formatButtonsTimeoutRef.current = setTimeout(() => {
      setShowFormatting(false);
    }, 300);
  };

  const toggleAIToolsPanel = () => {
    setIsAIToolsPanelOpen(prev => !prev);
  };

  const closeAIToolsPanel = () => {
    setIsAIToolsPanelOpen(false);
  };

  // Track cursor activity for blinking
  useEffect(() => {
    const cursorBlinkInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastCursorActivity;
      if (timeSinceLastActivity > 500) {
        setCursorBlinking(prev => !prev);
      } else {
        setCursorBlinking(true);
      }
    }, 530);

    return () => clearInterval(cursorBlinkInterval);
  }, [lastCursorActivity]);

  useEffect(() => {
    if (!isAIToolsPanelOpen) return;
    
    // Add a small delay before attaching the handler
    const timeoutId = setTimeout(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          aiToolsPanelRef.current && 
          !aiToolsPanelRef.current.contains(event.target as Node) &&
          aiButtonRef.current && 
          !aiButtonRef.current.contains(event.target as Node)
        ) {
          closeAIToolsPanel();
        }
      };
    
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, 50); // Small delay to ensure React has updated the DOM
    
    return () => clearTimeout(timeoutId);
  }, [isAIToolsPanelOpen]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        horizontalRule: false,
        // table: false,
        dropcursor: false,
        gapcursor: false,
        paragraph: {
          HTMLAttributes: {
            class: 'my-0'
          }
        }
      }),
      Underline,
      Strike,
      Highlight.configure({ multicolor: true }),
      TextStyle
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(id, html);
      setContentChanged(true);
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);

      // Update cursor position and text selection state
      const { from, to } = editor.state.selection;
      setCursorPosition(from);
      setHasTextSelection(from !== to);
      
      // Update suggestion position when typing
      if (from === to) {
        updateSuggestionPosition(from);
      }

      // Find the last word before cursor for suggestion replacement
      if (from === to) {
        const textBeforeCursor = editor.state.doc.textBetween(0, from);
        const words = textBeforeCursor.split(/\s+/);
        const lastWord = words[words.length - 1] || '';
        
        if (lastWord) {
          // Find the start position of the last word
          const lastWordStart = from - lastWord.length;
          setLastWordInfo({
            word: lastWord,
            start: lastWordStart,
            end: from
          });
        } else {
          setLastWordInfo(null);
        }
      }
    },
    onFocus: () => {
      setIsFocused(true);
      onFocus(id);
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);
    },
    onBlur: () => {
      setIsFocused(false);
      // Don't hide inline tools immediately to allow clicking on them
      setTimeout(() => {
        if (!showCommentInput) {
          setShowInlineTools(false);
        }
      }, 200);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setHasTextSelection(from !== to);
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);
      
      if (from !== to) {
        updateToolbarPosition();
      } else {
        // Update suggestion position when cursor moves
        updateSuggestionPosition(from);
        
        // Don't hide immediately to allow clicking on tools
        setTimeout(() => {
          if (!showCommentInput) {
            setShowInlineTools(false);
          }
        }, 200);
      }
    },
    editorProps: {
      attributes: {
        class: getElementStyles(type, formatSettings),
        spellcheck: 'true',
        style: `width: ${formatSettings.width}in`
      },
      handleKeyDown: (view, event) => {
        // Track cursor activity
        setLastCursorActivity(Date.now());
        setCursorBlinking(true);
        console.log('KEY TEST in ScriptElement:', event.key);
        
        // Handle suggestion navigation with arrow keys
        // if (showSuggestions && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        //   event.preventDefault();
        //   navigateSuggestions(event.key === 'ArrowUp' ? 'up' : 'down');
        //   return true;
        // }
        
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          const { empty, $head } = view.state.selection;
          const isAtTop = empty && $head.parentOffset <= 1; // Cursor at the beginning
          // const isAtBottom = empty && $head.parentOffset >= view.state.doc.content.size - 1; // Cursor at the end
          const isAtBottom = empty && view.endOfTextblock("down"); // <--- Use Tiptap's helper for bottom edge


          if (event.key === 'ArrowUp' && isAtTop) {
            console.log("At top edge, navigating UP");
            event.preventDefault(); // Prevent default only when navigating away
            onNavigateElement(id, 'up'); // Call parent to handle navigation
            return true; // Event handled
          }

          if (event.key === 'ArrowDown' && isAtBottom) {
            console.log("At bottom edge, navigating DOWN");
            event.preventDefault(); // Prevent default only when navigating away
            onNavigateElement(id, 'down'); // Call parent to handle navigation
            return true; // Event handled
          }

          // If not at the edge, allow default Tiptap/browser behavior *within* this element
          console.log("Not at edge, allowing default arrow behavior");
          return false;
        }

        // Handle suggestion selection with Tab only (not Enter)
        if (showSuggestions && event.key === 'Tab' && !event.shiftKey) {
          if (suggestionsData.length > 0) {
            event.preventDefault();
            
            // Apply the selected suggestion
            const suggestion = suggestionsData[selectedIndex];
            
            if (lastWordInfo) {
              // Replace the last word with the suggestion
              const tr = view.state.tr.deleteRange(lastWordInfo.start, lastWordInfo.end)
                .insertText(suggestion.text);
              
              view.dispatch(tr);
              
              // Position cursor after the suggestion
              setTimeout(() => {
                const newPos = lastWordInfo.start + suggestion.text.length;
                view.dispatch(view.state.tr.setSelection(
                  view.state.selection.constructor.near(view.state.doc.resolve(newPos))
                ));
                markSuggestionSelected();
                setContentChanged(true);
                setLastCursorActivity(Date.now());
                setCursorBlinking(true);
              }, 10);
            } else {
              // Just insert the suggestion at cursor
              view.dispatch(view.state.tr.insertText(suggestion.text));
              markSuggestionSelected();
              setContentChanged(true);
              setLastCursorActivity(Date.now());
              setCursorBlinking(true);
            }
            
            return true;
          }
        }
        
        // Close suggestions with Escape
        if (showSuggestions && event.key === 'Escape') {
          event.preventDefault();
          resetSuggestions();
          return true;
        }

        if (event.key === 'Enter') {
          event.preventDefault();
          
          if (event.shiftKey) {
            view.dispatch(view.state.tr.insertText('\n'));
            return true;
          }

          // For Enter key, don't select suggestion, just create new segment
          const { from } = view.state.selection;
          if (from > 1 && from < view.state.doc.content.size) {
            const beforeContent = view.state.doc.textBetween(0, from);
            const afterContent = view.state.doc.textBetween(from, view.state.doc.content.size);
            onKeyDown(event as any as React.KeyboardEvent, id, { beforeContent, afterContent });
          } else {
            onKeyDown(event as any as React.KeyboardEvent, id);
          }
          
          // Close any open suggestions when creating a new segment
          if (showSuggestions) {
            resetSuggestions();
          }
          
          return true;
        }
        
        if (event.key === 'Backspace') {
          const { from, empty } = view.state.selection;
          const isAtStart = empty && from <= 1;
          const isEmpty = view.state.doc.textContent === '';
    
          // **** This line should now be valid ****
          const elementIndex = elements.findIndex(el => el.id === id);
          // **** ****
    
          if (isEmpty && isAtStart) {
            if (elementIndex === 0) {
               console.log(`Backspace on first empty element (ID: ${id}), using custom delete.`);
               event.preventDefault();
               onKeyDown(event as any as React.KeyboardEvent, id);
               return true;
            } else {
                console.log(`Backspace on non-first empty element (ID: ${id}). Requesting MERGE UP.`);
                onKeyDown(event as any as React.KeyboardEvent, id, undefined, { mergeUp: true }); // Signal merge intention
        
               return false; // Allow Tiptap's default merge behavior
            }
          }
          return false;
        }
      

        if (event.key === 'Tab') {
          // Don't change element type on Tab, just move to next field
          if (!showSuggestions) {
            event.preventDefault();
            onKeyDown(event as any as React.KeyboardEvent, id);
            return true;
          }
          return false;
        }

        if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey) {
          const key = event.key.toLowerCase();
          const numberKey = parseInt(key);
          
          if (!isNaN(numberKey) && numberKey >= 1 && numberKey <= 6) {
            event.preventDefault();
            const elementTypes: ElementType[] = [
              'scene-heading',
              'action',
              'character',
              'dialogue',
              'parenthetical',
              'transition'
            ];
            const newType = elementTypes[numberKey - 1];
            if (newType) {
              onTypeChange(id, newType);
              return true;
            }
          }
        }

        return false;
      },
      handleDOMEvents: {
        mouseover: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'MARK') {
            setMouseOverComment(true);
            const pos = view.posAtDOM(target, 0);
            const comment = comments.find(c => c.from <= pos && c.to >= pos);
            if (comment) {
              const rect = target.getBoundingClientRect();
              setActiveComment(comment);
              setCommentTooltipPosition({
                left: rect.left + (rect.width / 2),
                top: rect.bottom + 8
              });
              setTooltipVisible(true);
            }
          }
          return false;
        },
        mouseout: (view, event) => {
          const relatedTarget = event.relatedTarget as HTMLElement;
          const target = event.target as HTMLElement;
          
          if (target.tagName === 'MARK') {
            setMouseOverComment(false);
            
            // Only hide tooltip if not hovering over the tooltip itself
            if (!relatedTarget?.closest('.comment-tooltip')) {
              setTimeout(() => {
                if (!mouseOverComment && !mouseOverTooltip) {
                  setTooltipVisible(false);
                }
              }, 100);
            }
          }
          return false;
        }
      }
    }
  });

  // Update editor styles when formatSettings change
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: {
            class: getElementStyles(type, formatSettings),
            spellcheck: 'true',
            style: `width: ${formatSettings.width}in`
          }
        }
      });
    }
  }, [editor, formatSettings, type]);

  useImperativeHandle(ref, () => ({
    containsCommentRange: (from: number, to: number) => {
      if (!editor) return false;
      try {
        const docSize = editor.state.doc.content.size;
        return from >= 0 && to <= docSize;
      } catch (error) {
        return false;
      }
    },
    focusEditorEnd: () => {
      // Use setTimeout to ensure focus happens after state updates
      setTimeout(() => {
         editor?.chain().focus().setTextSelection(editor.state.doc.content.size).run();
         setLastCursorActivity(Date.now()); // Update cursor activity tracking
         setCursorBlinking(true);
      }, 0);
    },  
    focusCommentRange: (from: number, to: number) => {
      if (!editor) return;
      
      try {
        // Focus the editor first
        editor.commands.focus();
        
        // Set the selection to the comment range
        editor.commands.setTextSelection({ from, to });
        
        // Scroll the element into view
        const element = containerRef.current;
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (error) {
        console.error("Error focusing comment range:", error);
      }
    }
  }));

  // Apply highlights for comments
  useEffect(() => {
    if (!editor || !editor.isEditable) return;
    
    // Store current selection
    const currentSelection = editor.state.selection;
    
    // First, clear all highlights
    editor.commands.unsetHighlight();
    
    // Then apply highlights for each comment
    comments.forEach(comment => {
      const isActive = comment.id === activeCommentId;
      
      try {
        editor
          .chain()
          .setTextSelection({ from: comment.from, to: comment.to })
          .setHighlight({ color: isActive ? '#fde047' : '#fef9c3' })
          .run();
      } catch (error) {
        // Silently handle errors if the range is invalid
      }
    });
    
    // Restore selection
    try {
      editor.commands.setTextSelection(currentSelection);
    } catch (error) {
      // If restoring selection fails, move to end
      editor.commands.focus('end');
    }
  }, [editor, comments, activeCommentId]);

  // Focus the editor when the element is selected
  useEffect(() => {
    if (isSelected && editor && !showCommentInput) {
      editor.commands.focus();
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);
    }
  }, [isSelected, editor, showCommentInput]);

  // Set initial content when editor is created
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Auto-focus on new elements
  useEffect(() => {
    if (autoFocus && editor) {
      editor.commands.focus('end');
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);
    }
  }, [autoFocus, editor]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        !isClickingSuggestion
      ) {
        resetSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [resetSuggestions, isClickingSuggestion]);

  // Handle keyboard events for suggestion navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;
      
      // if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      //   e.preventDefault();
      //   navigateSuggestions(e.key === 'ArrowUp' ? 'up' : 'down');
      // } else if (e.key === 'Escape') {
      //   e.preventDefault();
      //   resetSuggestions();
      // }
      
      // Update cursor activity
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSuggestions, navigateSuggestions, resetSuggestions]);

  // Reset suggestions when content changes
  useEffect(() => {
    if (contentChanged) {
      // Small delay to allow the content to update before checking if we should hide suggestions
      const timer = setTimeout(() => {
        // Check if we need to hide suggestions (e.g., if we've completed a section)
        const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, "");
        
        // For scene headings, check if we've completed a section
        if (type === 'scene-heading') {
          // If we have both INT/EXT and a location, and we're now typing after a hyphen, we're in the time section
          if (
            (cleanContent.includes('INT.') || cleanContent.includes('EXT.')) && 
            cleanContent.includes('-') && 
            cleanContent.split('-')[1].trim().length > 0
          ) {
            // If we have a complete scene heading with time, hide suggestions
            resetSuggestions();
          }
        }
        
        setContentChanged(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [content, contentChanged, resetSuggestions, type]);

  // Close suggestions when element type changes
  useEffect(() => {
    resetSuggestions();
  }, [type, resetSuggestions]);

  const updateToolbarPosition = () => {
    if (!editor || !containerRef.current) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      setShowInlineTools(false);
      return;
    }

    try {
      const view = editor.view;
      const { top, left } = view.coordsAtPos(from);
      const editorRect = containerRef.current.getBoundingClientRect();

      setToolbarPosition({
        top: top - editorRect.top - 40,
        left: left - editorRect.left + 50 // Add offset to center better
      });
      setShowInlineTools(true);
    } catch (error) {
      setShowInlineTools(false);
    }
  };

  const updateSuggestionPosition = (pos: number) => {
    if (!editor || !containerRef.current) return;

    try {
      const view = editor.view;
      const { top, left } = view.coordsAtPos(pos);
      const editorRect = containerRef.current.getBoundingClientRect();

      setSuggestionPosition({
        top: top - editorRect.top + 20, // Position below cursor
        left: left - editorRect.left
      });
    } catch (error) {
      setSuggestionPosition(null);
    }
  };

  const handleComment = () => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (selectedText) {
      setSavedSelection({ from, to });
      setShowCommentInput(true);
    }
  };

  const submitComment = (commentText: string) => {
    if (!editor || !savedSelection) return;
    
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: commentText,
      from: savedSelection.from,
      to: savedSelection.to,
      createdAt: new Date().toISOString()
    };
    
    onAddComment(newComment);
    setShowCommentInput(false);
    setSavedSelection(null);
    
    // Restore focus to editor
    setTimeout(() => {
      editor.commands.focus();
      setLastCursorActivity(Date.now());
      setCursorBlinking(true);
    }, 10);
  };

  // const handleAIAction = (action: string) => {
  //   console.log("tell me something")
  //   if (onAIAssistClick) {
  //     onAIAssistClick();
  //   }
  // };

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-start min-h-[24px] group ${
        isSelected ? 'bg-blue-50/20' : ''
      } ${cursorBlinking ? 'cursor-blink' : 'cursor-solid'}`}
      data-element-type={type}
      onClick={() => onFocus(id)}
    >
      {/* Left side - Format type button */}
      <div 
        className="absolute -left-8 top-1/2 -translate-y-1/2 transition-opacity duration-200"
        onMouseEnter={handleFormatButtonsMouseEnter}
        onMouseLeave={handleFormatButtonsMouseLeave}
      >
        <TypeIcon 
          type={type}
          isSelected={isSelected}
          isFocused={isFocused}
          onMouseEnter={handleFormatButtonsMouseEnter}
        />
      </div>

      <FormatButtonsPanel 
        showFormatting={showFormatting}
        currentType={type}
        onTypeChange={(newType) => onTypeChange(id, newType)}
        resetSuggestions={resetSuggestions}
        onMouseEnter={handleFormatButtonsMouseEnter}
        onMouseLeave={handleFormatButtonsMouseLeave}
      />

      {/* Right side - AI tools button */}
      {showAITools && (
          <div 
            className="absolute -right-8 top-1/2 -translate-y-1/2 transition-opacity duration-200"
          >
            <button
              ref={aiButtonRef}
              className={`p-1.5 rounded-full transition-colors ${
                isAIToolsPanelOpen || isSelected ? 'opacity-100' : 'opacity-0'
              } text-gray-400 hover:bg-blue-50 hover:text-blue-500 group`}
              title="AI Tools"
              onClick={(e) => {
                e.stopPropagation(); // Add this to prevent event bubbling
                toggleAIToolsPanel();
              }}
            >
           {/* Replace the container div and its contents with the Lottie component */}
           <div className="w-8 h-8 [image-rendering:pixelated] [image-rendering:crisp-edges]"> {/* Add image-rendering styles */}
               <DotLottieReact
                  src={aiIconAnimationUrl}
                   loop
                   autoplay
               />
           </div>

            </button>
          </div>
        )}

        {showAITools && (
          <AIToolsPanel
            ref={aiToolsPanelRef} // Add this ref
            showAITools={isAIToolsPanelOpen} // Rename to match our new state variable
            onAIAction={(action) => {
              handleAIAction(action);
              closeAIToolsPanel(); // Close panel after selection
            }}
            // Remove these props:
            // onMouseEnter={handleAIToolsMouseEnter}
            // onMouseLeave={handleAIToolsMouseLeave}
          />
        )}

      <div className="relative flex-1">
        {type === 'parenthetical' && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-gray-500">
            (
          </div>
        )}

        <EditorContent editor={editor} />

        {type === 'parenthetical' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
            )
          </div>
        )}

        {showInlineTools && (
          <EditorToolbar 
            editor={editor}
            position={toolbarPosition}
            onComment={handleComment}
            onAIAssist={onAIAssistClick}
            showCommentInput={showCommentInput}
          />
        )}

        {showCommentInput && (
          <CommentInput 
            position={toolbarPosition}
            onSubmit={submitComment}
            onCancel={() => {
              setShowCommentInput(false);
              setSavedSelection(null);
              editor?.commands.focus();
              setLastCursorActivity(Date.now());
              setCursorBlinking(true);
            }}
          />
        )}

        {activeComment && commentTooltipPosition && tooltipVisible && (
          <CommentTooltip 
            comment={activeComment}
            position={commentTooltipPosition}
            onClose={() => {
              setTooltipVisible(false);
              setTimeout(() => {
                setActiveComment(null);
                setCommentTooltipPosition(null);
              }, 100);
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          />
        )}

        {showSuggestions && shouldShowSuggestions && !hasTextSelection && suggestionPosition && suggestionsData.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50"
            style={{
              top: `${suggestionPosition.top}px`,
              left: `${suggestionPosition.left}px`
            }}
          >
            <Suggestions
              suggestions={suggestionsData}
              selectedIndex={selectedIndex}
              onSelect={(suggestion) => {
                setIsClickingSuggestion(true);
                
                if (!editor) return;
                
                if (lastWordInfo) {
                  // Replace the last word with the suggestion
                  editor.commands.setTextSelection({
                    from: lastWordInfo.start,
                    to: lastWordInfo.end
                  });
                  
                  editor.commands.insertContent(suggestion.text);
                  
                  // Position cursor after the suggestion
                  setTimeout(() => {
                    const newPos = lastWordInfo.start + suggestion.text.length;
                    editor.commands.setTextSelection(newPos);
                    markSuggestionSelected();
                    setContentChanged(true);
                    setLastCursorActivity(Date.now());
                    setCursorBlinking(true);
                  }, 10);
                } else {
                  // Just insert at cursor position
                  editor.commands.insertContent(suggestion.text);
                  markSuggestionSelected();
                  setContentChanged(true);
                  setLastCursorActivity(Date.now());
                  setCursorBlinking(true);
                }
                
                setTimeout(() => {
                  setIsClickingSuggestion(false);
                  editor.commands.focus();
                }, 10);
              }}
              onMouseEnter={setSelectedIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
});

ScriptElement.displayName = 'ScriptElement';