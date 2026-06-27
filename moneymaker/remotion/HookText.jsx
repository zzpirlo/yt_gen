/**
 * Animated Hook Text Component for Remotion
 * Adds entrance animations to hook text
 */
import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface HookTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  animationDuration?: number; // in frames
  yOffset?: number;
}

export const HookText: React.FC<HookTextProps> = ({
  text,
  fontSize = 48,
  color = 'white',
  animationDuration = 30,
  yOffset = 0
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, animationDuration], [0, 1], { extrapolateLeft: 'clamp' });
  const translateY = interpolate(frame, [0, animationDuration], [yOffset + 50, yOffset], { extrapolateLeft: 'clamp' });
  const scale = interpolate(frame, [0, animationDuration], [0.8, 1], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: `calc(50% + ${yOffset}px)`,
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
        opacity,
        color,
        fontSize,
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 0 30px rgba(0,0,0,0.9)',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '90%',
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap'
      }}
    >
      {text}
    </div>
  );
};

export default HookText;