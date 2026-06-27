/**
 * Reusable Video Component for Remotion
 * Handles video playback with cover fitting and time controls
 */
import React from 'react';
import { Video } from 'remotion';

interface VideoClipProps {
  src: string;
  from: number;
  to: number;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill';
  style?: React.CSSProperties;
}

export const VideoClip: React.FC<VideoClipProps> = ({
  src,
  from,
  to,
  width = 1080,
  height = 1920,
  objectFit = 'cover',
  style = {}
}) => {
  return (
    <Video
      src={src}
      from={from}
      to={to}
      style={{
        width,
        height,
        objectFit,
        position: 'absolute',
        top: 0,
        left: 0,
        ...style
      }}
    />
  );
};

export default VideoClip;