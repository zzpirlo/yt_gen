/**
 * Reusable Caption Component for Remotion
 * Renders styled captions with background, hook, and title
 */
import React from 'react';

interface CaptionProps {
  hook: string;
  title: string;
  width?: number;
  height?: number;
  position?: 'bottom' | 'center' | 'top';
}

export const Caption: React.FC<CaptionProps> = ({
  hook,
  title,
  width = 1080,
  height = 1920,
  position = 'bottom'
}) => {
  const positions = {
    bottom: { bottom: 20, top: 'auto' },
    center: { bottom: '50%', top: 'auto', transform: 'translateY(50%)' },
    top: { top: 20, bottom: 'auto' }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        ...positions[position],
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 24,
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(0,0,0,0.8)',
          lineHeight: 1.2,
          marginBottom: 12
        }}
      >
        {hook}
      </div>
      <div
        style={{
          fontSize: 32,
          color: '#ffcc00',
          fontWeight: '600',
          textShadow: '0 0 15px rgba(0,0,0,0.7)',
          lineHeight: 1.3
        }}
      >
        {title}
      </div>
    </div>
  );
};

export default Caption;