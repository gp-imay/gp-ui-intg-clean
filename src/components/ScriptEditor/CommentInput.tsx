import React, { useState } from 'react';

interface CommentInputProps {
  position: { top: number; left: number };
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  position,
  onSubmit,
  onCancel
}) => {
  const [comment, setComment] = useState('');

  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg p-2 z-50 min-w-[200px]"
      style={{
        top: `${position.top + 40}px`,
        left: `${position.left}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full p-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Add a comment..."
        rows={3}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onCancel();
          } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            if (comment.trim()) {
              onSubmit(comment);
            }
          }
        }}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (comment.trim()) {
              onSubmit(comment);
            }
          }}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!comment.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
};