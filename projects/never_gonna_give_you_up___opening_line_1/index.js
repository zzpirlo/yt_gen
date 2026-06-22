import { React } from 'react';
import { Composition, describeAsset, Seq, Series, Video, registerRoot } from 'remotion';

// Import the clipped video as an asset
const videoAsset = describeAsset({
  id: 'video-asset',
  src: '../../assets/never_gonna_give_you_up___opening_line_1.mp4',
});

// Main component for the video clip
const VideoClip = () => {
  return (
    <Composition
      id="VideoClip"
      component={VideoClipInner}
      durationInFrames=450
      fps=30
      width=1080
      height=1920>
      <VideoClipInner />
    </Composition>
  );
};

registerRoot(VideoClip);

const VideoClipInner = () => {
  return (
    <>
      <Video
        from={1500}
        to={1950}
        video={videoAsset}
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
          "We're no strangers to love"
        </div>

        {/* Title text */}
        <div style={{
          color: '#ffcc00',
          fontSize: 28,
          textAlign: 'center',
          marginTop: 10
        }}>
          "Never Gonna Give You Up - Opening Line"
        </div>
      </div>

      {/* Optional: Add progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'linear-gradient(90deg, #ff0000, #ffff00)',
        transform: 'scaleX(var(--progress))',
        transformOrigin: 'left'
      }}>
        <Seq>
          {/* This would be animated in a real implementation */}
        </Seq>
      </div>
    </>
  );
};

export default VideoClip;