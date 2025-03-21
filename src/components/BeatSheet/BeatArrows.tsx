// src/components/BeatSheet/BeatArrows.tsx
import React, { useEffect, useState, useRef } from 'react';
import Xarrow from 'react-xarrows';
import { Beat } from '../../types/beats';

interface BeatArrowsProps {
  beats: Beat[];
}

export function BeatArrows({ beats }: BeatArrowsProps) {
  const [mounted, setMounted] = useState(false);
  const mountAttempts = useRef(0);
  const maxAttempts = 5;

  useEffect(() => {
    // Clear any existing timeouts when beats change
    const timeoutId = setTimeout(() => {
      // Verify all beat elements exist in the DOM before setting mounted
      const allBeatsExist = beats.every((beat, index) => {
        if (index === beats.length - 1) return true; // Last beat doesn't need an arrow
        
        const startEl = document.getElementById(`beat-${beat.id}`);
        const endEl = document.getElementById(`beat-${beats[index + 1]?.id}`);
        return startEl && endEl;
      });

      if (allBeatsExist) {
        setMounted(true);
        mountAttempts.current = 0;
      } else if (mountAttempts.current < maxAttempts) {
        // Try again with exponential backoff
        mountAttempts.current += 1;
        const nextDelay = 100 * Math.pow(2, mountAttempts.current);
        setTimeout(() => setMounted(false), nextDelay);
      }
    }, 300); // Increased initial delay

    return () => clearTimeout(timeoutId);
  }, [beats]);

  if (!mounted) return null;

  // Filter out beats with invalid positions
  const validBeats = beats.filter(beat => 
    beat.position && 
    typeof beat.position.x === 'number' && 
    !isNaN(beat.position.x) &&
    typeof beat.position.y === 'number' && 
    !isNaN(beat.position.y)
  );

  return (
    <>
      {validBeats.map((beat, index) => {
        if (index === validBeats.length - 1) return null;
        
        const startElement = document.getElementById(`beat-${beat.id}`);
        const endElement = document.getElementById(`beat-${validBeats[index + 1]?.id}`);
        
        // Only render arrow if both elements exist
        if (!startElement || !endElement) return null;

        return (
          <Xarrow
            key={`${beat.id}-${validBeats[index + 1].id}`}
            start={`beat-${beat.id}`}
            end={`beat-${validBeats[index + 1].id}`}
            color="#94a3b8"
            strokeWidth={2}
            path="straight" // Explicitly use straight path
            startAnchor="right"
            endAnchor="left"
            zIndex={0}
            showHead={true}
            headSize={6}
          />
        );
      })}
    </>
  );
}