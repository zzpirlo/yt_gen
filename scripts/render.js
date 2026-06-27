#!/usr/bin/env node
/**
 * Remotion Rendering Script
 * Uses Remotion's Node.js API to render final vertical shorts with captions and motion graphics
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { bundle } = require('@remotion/bundler');

// Configuration
const CONFIG = {
  // Input directories
  ASSETS_DIR: path.join(__dirname, '..', 'assets'), // Clipped videos from extract.js
  CLIPS_FILE: path.join(__dirname, '..', 'data', 'clips.json'),

  // Output directories
  OUTPUTS_DIR: path.join(__dirname, '..', 'Outputs'), // Final rendered videos

  // Remotion settings
  VIDEO_WIDTH: 1080, // vertical format
  VIDEO_HEIGHT: 1920, // vertical format
  FPS: 30
};

// HTTP server for serving video files
let httpServer = null;
const SERVER_PORT = 34567;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

/**
 * Start HTTP server to serve video files
 */
function startHttpServer() {
  return new Promise((resolve, reject) => {
    httpServer = http.createServer((req, res) => {
      // Serve video files from assets directory
      const assetPath = path.join(CONFIG.ASSETS_DIR, req.url.slice(1));
      if (fs.existsSync(assetPath) && (assetPath.endsWith('.mp4') || assetPath.endsWith('.webm'))) {
        const stat = fs.statSync(assetPath);
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Content-Length': stat.size,
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(assetPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    httpServer.listen(SERVER_PORT, () => {
      console.log(`  HTTP server started on ${SERVER_URL}`);
      resolve();
    });

    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port already in use, try next port
        SERVER_PORT++;
        httpServer.listen(SERVER_PORT);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Stop HTTP server
 */
function stopHttpServer() {
  return new Promise((resolve) => {
    if (httpServer) {
      httpServer.close(() => {
        console.log('  HTTP server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Ensure required directories exist
 */
function ensureDirectories() {
  [CONFIG.OUTPUTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Create the React component for a clip
 * @param {Object} clip - Clip object with metadata
 * @returns {string} React component code as string
 */
function createClipComponent(clip) {
  const assetFileName = clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_1.mp4';
  // Find the actual asset file
  const files = fs.readdirSync(CONFIG.ASSETS_DIR);
  const searchKey = clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().split('_')[0];
  const assetFile = files.find(f => f.includes(searchKey));
  const actualAssetFile = assetFile || assetFileName;

  // Use HTTP URL for video source (served by local HTTP server)
  const videoSrc = `${SERVER_URL}/${actualAssetFile}`;

  const durationFrames = Math.floor((clip.end - clip.start) * CONFIG.FPS);
  const fromFrame = clip.start * CONFIG.FPS;
  const toFrame = clip.end * CONFIG.FPS;

  const hookText = JSON.stringify(clip.hook);
  const titleText = JSON.stringify(clip.title);

  // Use template literal for clean code generation
  return `import React from 'react';
import { Composition, Video, registerRoot, AbsoluteFill } from 'remotion';

// Main component for the video clip
const VideoClip = () => {
  return (
    <Composition
      id="VideoClip"
      component={VideoClipInner}
      durationInFrames={${durationFrames}}
      fps={${CONFIG.FPS}}
      width={${CONFIG.VIDEO_WIDTH}}
      height={${CONFIG.VIDEO_HEIGHT}}>
      <VideoClipInner />
    </Composition>
  );
};

registerRoot(VideoClip);

const VideoClipInner = () => {
  return (
    <>
      <Video
        src="${videoSrc}"
        from={${fromFrame}}
        to={${toFrame}}
        style={{
          width: ${CONFIG.VIDEO_WIDTH},
          height: ${CONFIG.VIDEO_HEIGHT},
          objectFit: 'cover'
        }}
      />

      {/* Add caption background */}
      <AbsoluteFill style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: 60,
        paddingLeft: 40,
        paddingRight: 40,
        pointerEvents: 'none'
      }}>
        {/* Hook text */}
        <div style={{
          color: 'white',
          fontSize: 48,
          textAlign: 'center',
          fontWeight: 'bold',
          textShadow: '0 0 30px rgba(0,0,0,0.9)',
          fontFamily: 'Arial, sans-serif',
          lineHeight: 1.2,
          marginBottom: 16,
          maxWidth: '90%',
          alignSelf: 'center'
        }}>
          ${hookText}
        </div>

        {/* Title text */}
        <div style={{
          color: '#ffcc00',
          fontSize: 36,
          textAlign: 'center',
          fontWeight: '600',
          textShadow: '0 0 20px rgba(0,0,0,0.8)',
          fontFamily: 'Arial, sans-serif',
          lineHeight: 1.3,
          maxWidth: '90%',
          alignSelf: 'center'
        }}>
          ${titleText}
        </div>
      </AbsoluteFill>
    </>
  );
};

export default VideoClip;
`;
}

/**
 * Render a clip using Remotion's Node.js API
 * @param {Object} clip - Clip object
 * @param {number} index - Clip index
 * @returns {Promise<string>} Path to rendered video file
 */
async function renderClip(clip, index) {
  const outputName = clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_' + (index + 1) + '_rendered.mp4';
  const outputPath = path.join(CONFIG.OUTPUTS_DIR, outputName);

  console.log('Rendering clip ' + (index + 1) + ': "' + clip.title + '"...');

  try {
    // Create a temporary entry point file
    const tempDir = path.join(__dirname, '..', '.remotion-temp', 'clip_' + (index + 1));
    fs.mkdirSync(tempDir, { recursive: true });

    const entryPoint = path.join(tempDir, 'index.js');
    const componentCode = createClipComponent(clip);
    fs.writeFileSync(entryPoint, componentCode);

    // Bundle the composition
    console.log('  Bundling composition...');
    const bundleResult = await bundle(entryPoint);

    // Select the composition
    console.log('  Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleResult,
      id: 'VideoClip',
      inputProps: {},
    });

    // Render the video
    console.log('  Rendering video...');
    await renderMedia({
      composition,
      serveUrl: bundleResult,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {},
      // Increase timeout for video loading
      timeoutInMilliseconds: 120000,
      // Disable concurrency for stability
      concurrency: 1,
    });

    console.log('✓ Rendered video saved: ' + outputPath);
    return outputPath;
  } catch (error) {
    throw new Error('Failed to render clip "' + clip.title + '": ' + error.message);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎨 Starting Remotion rendering process...\n');

    // Ensure directories exist
    ensureDirectories();

    // Start HTTP server for video files
    await startHttpServer();

    // Read clips.json (output from Claude step)
    if (!fs.existsSync(CONFIG.CLIPS_FILE)) {
      await stopHttpServer();
      throw new Error('Clips file not found: ' + CONFIG.CLIPS_FILE + '. Run the Claude step first to generate clips.json.');
    }

    const clipsData = JSON.parse(fs.readFileSync(CONFIG.CLIPS_FILE, 'utf8'));
    const clips = clipsData.clips || [];

    if (clips.length === 0) {
      await stopHttpServer();
      throw new Error('No clips found in clips.json');
    }

    console.log('📋 Loaded ' + clips.length + ' clips from ' + CONFIG.CLIPS_FILE + '\n');

    // Process each clip
    const renderedVideos = [];

    for (let index = 0; index < clips.length; index++) {
      const clip = clips[index];
      console.log('🔄 Processing clip ' + (index + 1) + '/' + clips.length + ': "' + clip.title + '"');

      try {
        const renderedPath = await renderClip(clip, index);
        renderedVideos.push({
          clip,
          renderedPath
        });
        console.log('✅ Clip ' + (index + 1) + ' processed successfully\n');
      } catch (error) {
        console.error('✗ Failed to process clip "' + clip.title + '":', error.message);
        console.log('Continuing with next clip...\n');
      }
    }

    // Stop HTTP server
    await stopHttpServer();

    // Cleanup temp directory
    const tempDir = path.join(__dirname, '..', '.remotion-temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Summary
    console.log('🎉 Remotion rendering process completed!');
    console.log('\n📊 Summary:');
    console.log('  - Total clips processed: ' + clips.length);
    console.log('  - Successfully rendered: ' + renderedVideos.length);
    console.log('  - Failed: ' + (clips.length - renderedVideos.length));

    if (renderedVideos.length > 0) {
      console.log('\n📁 Rendered videos saved to:');
      renderedVideos.forEach(({ renderedPath }) => {
        console.log('  - ' + renderedPath);
      });
    }

  } catch (error) {
    await stopHttpServer();
    console.error('\n❌ Rendering process failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { renderClip };