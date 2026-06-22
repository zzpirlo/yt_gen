#!/usr/bin/env node
/**
 * Remotion Rendering Script
 * Node script triggering Remotion to render final vertical shorts with captions and motion graphics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Input directories
  ASSETS_DIR: path.join(__dirname, '..', 'assets'), // Clipped videos from extract.js
  CLIPS_FILE: path.join(__dirname, '..', 'data', 'clips.json'),

  // Output directories
  OUTPUTS_DIR: path.join(__dirname, '..', 'Outputs'), // Final rendered videos
  PROJECTS_DIR: path.join(__dirname, '..', 'projects'), // Individual Remotion projects
  REMOTION_DIR: path.join(__dirname, '..', 'remotion'), // Global Remotion components

  // Remotion settings
  REMOTION_COMPONENT: 'VideoClip', // Main component to render
  REMOTION_ENTRY: 'index.js', // Entry point for Remotion project
  DEFAULT_DURATION: 15, // seconds
  VIDEO_WIDTH: 1080, // vertical format
  VIDEO_HEIGHT: 1920, // vertical format
  FPS: 30
};

/**
 * Ensure required directories exist
 */
function ensureDirectories() {
  [CONFIG.OUTPUTS_DIR, CONFIG.PROJECTS_DIR, CONFIG.REMOTION_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Check if Remotion is installed, install if necessary
 */
function ensureRemotionInstalled() {
  try {
    execSync('remotion --version', { stdio: 'ignore' });
    console.log('✓ Remotion is already installed');
  } catch (error) {
    console.log('Installing Remotion...');
    try {
      execSync('npm install remotion @remotion/cli', { stdio: 'inherit' });
      console.log('✓ Remotion installed successfully');
    } catch (installError) {
      throw new Error(`Failed to install Remotion: ${installError.message}`);
    }
  }
}

/**
 * Create a Remotion project for a specific clip
 * @param {Object} clip - Clip object with metadata
 * @param {number} index - Clip index
 * @returns {string} Path to Remotion project directory
 */
function createRemotionProject(clip, index) {
  const projectName = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${index + 1}`;
  const projectPath = path.join(CONFIG.PROJECTS_DIR, projectName);

  // Remove existing project if any
  if (fs.existsSync(projectPath)) {
    const rimraf = require('rimraf');
    rimraf.sync(projectPath);
    console.log(`Removed existing project: ${projectPath}`);
  }

  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });

  // Create package.json for the project
  const packageJson = {
    name: `yt-clip-${index + 1}`,
    version: "1.0.0",
    description: `Remotion project for clip: ${clip.title}`,
    main: "index.js",
    dependencies: {
      "remotion": "^4.0.0",
      "@remotion/cli": "^4.0.0"
    }
  };

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create index.js (Remotion entry point)
  const indexJs = `
import { React } from 'react';
import { Composition, describeAsset, Seq, Series, Video } from 'remotion';

// Import the clipped video as an asset
const assetPath = path.join(__dirname, '..', 'assets', `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${index + 1}.mp4`);
const relativePath = path.relative(projectPath, assetPath).replace(/\\/g, '/');
const videoAsset = describeAsset({
  id: 'video-asset',
  src: relativePath,
});

// Main component for the video clip
const VideoClip = () => {
  return (
    <Composition
      id="VideoClip"
      component={VideoClipInner}
      durationInFrames={${Math.floor(clip.end - clip.start) * CONFIG.FPS}}
      fps={${CONFIG.FPS}}
      width={${CONFIG.VIDEO_WIDTH}}
      height={${CONFIG.VIDEO_HEIGHT}}
    >
      <VideoClipInner />
    </Composition>
  );
};

const VideoClipInner = () => {
  return (
    <>
      <Video
        from={${clip.start * CONFIG.FPS}}
        to={${clip.end * CONFIG.FPS}}
        video={videoAsset}
        style={{
          width: ${CONFIG.VIDEO_WIDTH},
          height: ${CONFIG.VIDEO_HEIGHT},
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
          ${JSON.stringify(clip.hook)}
        </div>

        {/* Title text */}
        <div style={{
          color: '#ffcc00',
          fontSize: 28,
          textAlign: 'center',
          marginTop: 10
        }}>
          ${JSON.stringify(clip.title)}
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
`;

  fs.writeFileSync(
    path.join(projectPath, 'index.js'),
    indexJs.trim()
  );

  // Create a simple README for the project
  const readmeContent = `# Remotion Project: ${clip.title}

This project renders a vertical short-form video clip.

## Clip Information
- **Title**: ${clip.title}
- **Hook**: ${clip.hook}
- **Duration**: ${clip.end - clip.start} seconds
- **Timestamps**: ${clip.start}s to ${clip.end}s

## Render Command
\`\`\`bash
npm run render
\`\`\`
`;

  fs.writeFileSync(
    path.join(projectPath, 'README.md'),
    readmeContent
  );

  console.log(`✓ Created Remotion project: ${projectPath}`);
  return projectPath;
}

/**
 * Render a Remotion project to video file
 * @param {string} projectPath - Path to Remotion project directory
 * @param {Object} clip - Clip object for naming output
 * @param {number} index - Clip index
 * @returns {string} Path to rendered video file
 */
function renderRemotionProject(projectPath, clip, index) {
  const outputName = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${index + 1}_rendered.mp4`;
  const outputPath = path.join(CONFIG.OUTPUTS_DIR, outputName);

  // Change to project directory and install dependencies if needed
  const originalDir = process.cwd();
  try {
    process.chdir(projectPath);

    // Check if node_modules exists, if not install
    if (!fs.existsSync(path.join(projectPath, 'node_modules'))) {
      console.log(`Installing dependencies for project ${index + 1}...`);
      execSync('npm install', { stdio: 'inherit' });
    }

    // Render the video using Remotion
    console.log(`Rendering clip ${index + 1}: "${clip.title}"...`);
    const renderCommand = `npx remotion render ${CONFIG.REMOTION_COMPONENT} ${outputPath} --codec h264 --crf 18`;

    execSync(renderCommand, { stdio: 'inherit' });

    console.log(`✓ Rendered video saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to render Remotion project: ${error.message}`);
  } finally {
    process.chdir(originalDir);
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

    // Ensure Remotion is available
    ensureRemotionInstalled();

    // Read clips.json (output from Claude step)
    if (!fs.existsSync(CONFIG.CLIPS_FILE)) {
      throw new Error(`Clips file not found: ${CONFIG.CLIPS_FILE}. Run the Claude step first to generate clips.json.`);
    }

    const clipsData = JSON.parse(fs.readFileSync(CONFIG.CLIPS_FILE, 'utf8'));
    const clips = clipsData.clips || [];

    if (clips.length === 0) {
      throw new Error('No clips found in clips.json');
    }

    console.log(`📋 Loaded ${clips.length} clips from ${CONFIG.CLIPS_FILE}\n`);

    // Process each clip
    const renderedVideos = [];

    clips.forEach((clip, index) => {
      console.log(`🔄 Processing clip ${index + 1}/${clips.length}: "${clip.title}"`);

      try {
        // Step 1: Create Remotion project for this clip
        const projectPath = createRemotionProject(clip, index);

        // Step 2: Render the project to video file
        const renderedPath = renderRemotionProject(projectPath, clip, index);

        renderedVideos.push({
          clip,
          projectPath,
          renderedPath
        });

        console.log(`✅ Clip ${index + 1} processed successfully\n`);
      } catch (error) {
        console.error(`✗ Failed to process clip "${clip.title}":`, error.message);
        console.log('Continuing with next clip...\n');
      }
    });

    // Summary
    console.log('🎉 Remotion rendering process completed!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Total clips processed: ${clips.length}`);
    console.log(`  - Successfully rendered: ${renderedVideos.length}`);
    console.log(`  - Failed: ${clips.length - renderedVideos.length}`);

    if (renderedVideos.length > 0) {
      console.log(`\n📁 Rendered videos saved to:`);
      renderedVideos.forEach(({ renderedPath }) => {
        console.log(`  - ${renderedPath}`);
      });

      console.log(`\n📁 Remotion projects saved to: ${CONFIG.PROJECTS_DIR}`);
    }

  } catch (error) {
    console.error('\n❌ Rendering process failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { createRemotionProject, renderRemotionProject };