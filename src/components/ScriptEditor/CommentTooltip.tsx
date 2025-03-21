import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Comment } from '../../types/screenplay';

interface CommentTooltipProps {
  comment: Comment;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const CommentTooltip: React.FC<CommentTooltipProps> = ({
  comment,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure tooltip is visible within viewport
    if (tooltipRef.current && position) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Adjust horizontal position if tooltip goes off-screen
      if (position.left + tooltipRect.width / 2 > viewportWidth) {
        tooltipRef.current.style.left = `${viewportWidth - tooltipRect.width - 20}px`;
        tooltipRef.current.style.transform = 'none';
      } else if (position.left - tooltipRect.width / 2 < 0) {
        tooltipRef.current.style.left = '20px';
        tooltipRef.current.style.transform = 'none';
      }
      
      // Adjust vertical position if tooltip goes off-screen at the bottom
      if (position.top + tooltipRect.height > viewportHeight) {
        tooltipRef.current.style.top = `${position.top - tooltipRect.height - 20}px`;
        
        // Move the arrow to the bottom
        const arrow = tooltipRef.current.querySelector('.tooltip-arrow') as HTMLElement;
        if (arrow) {
          arrow.style.top = 'auto';
          arrow.style.bottom = '-3px';
          arrow.style.transform = 'rotate(225deg)';
        }
      }
    }
  }, [position]);

  if (!position) return null;

  return (
    <div 
      ref={tooltipRef}
      className="comment-tooltip fixed bg-white rounded-lg shadow-lg p-3 z-50 min-w-[200px] max-w-[300px] animate-fade-in"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translateX(-50%)'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-xs text-gray-500">
          {new Date(comment.createdAt).toLocaleDateString()} at{' '}
          {new Date(comment.createdAt).toLocaleTimeString()}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          title="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
      <div 
        className="tooltip-arrow absolute -top-2 left-1/2 w-3 h-3 bg-white transform rotate-45 -translate-x-1/2"
        style={{ boxShadow: '-2px -2px 2px rgba(0,0,0,0.05)' }}
      />
    </div>
  );
};