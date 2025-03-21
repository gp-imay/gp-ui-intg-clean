import React, { memo } from 'react';
import { ScriptElement } from '../ScriptElement';
import { ElementType, ElementFormat, Comment } from '../../types/screenplay';

interface MemoizedScriptElementProps {
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
  elements: Array<{ type: ElementType; content: string }>;
  onAddComment: (comment: Comment) => void;
  activeCommentId?: string | null;
  comments: Comment[];
  formatSettings: ElementFormat;
  suggestions?: any;
  showAITools?: boolean;
  elementRef: React.RefObject<any>;
}

/**
 * Memoized version of ScriptElement to prevent unnecessary re-renders
 * in large scripts with many elements
 */
export const MemoizedScriptElement = memo(
  ({
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
    comments,
    formatSettings,
    suggestions,
    showAITools,
    elementRef
  }: MemoizedScriptElementProps) => {
    return (
      <ScriptElement
        ref={elementRef}
        id={id}
        type={type}
        content={content}
        isSelected={isSelected}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onTypeChange={onTypeChange}
        autoFocus={autoFocus}
        onAIAssistClick={onAIAssistClick}
        elements={elements}
        onAddComment={onAddComment}
        activeCommentId={activeCommentId}
        comments={comments}
        formatSettings={formatSettings}
        suggestions={suggestions}
        showAITools={showAITools}
      />
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.content === nextProps.content &&
      prevProps.type === nextProps.type &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.activeCommentId === nextProps.activeCommentId &&
      prevProps.comments.length === nextProps.comments.length
    );
  }
);