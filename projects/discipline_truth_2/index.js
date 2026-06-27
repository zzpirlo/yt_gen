import React from 'react';
import { Composition, Video, registerRoot } from 'remotion';

// Main component for the video clip
const VideoClip = () => {
  return (
    <Composition
      id="VideoClip"
      component={VideoClipInner}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}>
      <VideoClipInner />
    </Composition>
  );
};

registerRoot(VideoClip);

const VideoClipInner = () => {
  return (
    <>
      <Video
        src="/clip_2.mp4"
        from={3600}
        to={4050}
        style={{
          width: 1080,
          height: 1920,
          objectFit: 'cover'
        }}
      />

      {/* Add caption background */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 20
      }}>
        {/* Hook text */}
        <div style={{
          color: 'white',
          fontSize: 36,
          textAlign: 'center',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
          "This is why most people fail"
        </div>

        {/* Title text */}
        <div style={{
          color: '#ffcc00',
          fontSize: 28,
          textAlign: 'center',
          marginTop: 10
        }}>
          "Discipline Truth"
        </div>
      </div>
    </>
  );
};

export default VideoClip;