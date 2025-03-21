import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
  variant?: 'profile' | 'script';
}

const GRADIENT_COMBINATIONS = [
  ['#4B84F3', '#7C3AED'], // Blue to Purple
  ['#4B84F3', '#06B6D4'], // Blue to Cyan
  ['#4B84F3', '#3730A3'], // Blue to Indigo
  ['#06B6D4', '#2563EB'], // Cyan to Blue
  ['#7C3AED', '#4B84F3'], // Purple to Blue
];

function stringToGradient(string: string, variant: 'profile' | 'script'): string {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  // For profile avatars, always use the first gradient (Blue to Purple)
  if (variant === 'profile') {
    const [start, end] = GRADIENT_COMBINATIONS[0];
    return `linear-gradient(135deg, ${start}, ${end})`;
  }

  // For script avatars, use a consistent gradient based on the name
  const gradientIndex = Math.abs(hash) % GRADIENT_COMBINATIONS.length;
  const [start, end] = GRADIENT_COMBINATIONS[gradientIndex];
  return `linear-gradient(135deg, ${start}, ${end})`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({ 
  name, 
  size = 32, 
  className = '',
  variant = 'script'
}: AvatarProps) {
  const initials = getInitials(name);
  const gradient = stringToGradient(name, variant);
  
  const style = {
    width: size,
    height: size,
    background: gradient,
    fontSize: `${size * 0.4}px`,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease-in-out',
  };

  return (
    <div
      className={`
        flex items-center justify-center rounded-full text-white font-medium 
        shadow-md hover:shadow-lg hover:scale-105 
        ${className}
      `}
      style={style}
    >
      {initials}
    </div>
  );
}