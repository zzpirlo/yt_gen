#!/usr/bin/env node
/**
 * Video Extraction Script
 * Node wrapper calling yt-dlp & FFmpeg to download and cut YouTube videos
 * based on timestamps from clips.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Input files
  TRANSCRIPT_FILE: path.join(__dirname, '..', 'data', 'transcript.json'),
  CLIPS_FILE: path.join(__dirname, '..', 'data', 'clips.json'),

  // Output directories
  VIDEO_DIR: path.join(__dirname, '..', 'video'),
  ASSETS_DIR: path.join(__dirname, '..', 'assets'),

  // yt-dlp options
  YTDLP_OPTIONS: {
    format: 'best[height<=720]', // Limit quality to save bandwidth/time
    output: '%(title)s.%(ext)s'
  }
};

/**
 * Ensure required directories exist
 */
function ensureDirectories() {
  [CONFIG.VIDEO_DIR, CONFIG.ASSETS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Download YouTube video using yt-dlp
 * @param {string} youtubeUrl - YouTube URL to download
 * @returns {Promise<string>} Path to downloaded video file
 */
async function downloadVideo(youtubeUrl) {
  console.log(`Downloading video from: ${youtubeUrl}`);

  // Clear video directory first
  const videoFiles = fs.readdirSync(CONFIG.VIDEO_DIR);
  videoFiles.forEach(file => {
    fs.unlinkSync(path.join(CONFIG.VIDEO_DIR, file));
    console.log(`Removed old video file: ${file}`);
  });

  // Construct yt-dlp command
  const outputTemplate = path.join(CONFIG.VIDEO_DIR, '%(title)s.%(ext)s');
  const command = `yt-dlp ${Object.entries(CONFIG.YTDLP_OPTIONS)
    .map(([key, value]) => {
      if (key === 'output') return ''; // handled separately
      return `--${key} "${value}"`;
    })
    .filter(Boolean)
    .join(' ')} -o "${outputTemplate}" "${youtubeUrl}"`;

  try {
    execSync(command, { stdio: 'inherit' });

    // Find the downloaded file
    const files = fs.readdirSync(CONFIG.VIDEO_DIR);
    const videoFile = files.find(f =>
      !f.startsWith('.') &&
      (f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.mkv'))
    );

    if (!videoFile) {
      throw new Error('No video file found after download');
    }

    const videoPath = path.join(CONFIG.VIDEO_DIR, videoFile);
    console.log(`Video downloaded successfully: ${videoPath}`);
    return videoPath;
  } catch (error) {
    throw new Error(`Failed to download video: ${error.message}`);
  }
}

/**
 * Cut video clips using FFmpeg based on timestamps
 * @param {string} videoPath - Path to downloaded video file
 * @param {Array} clips - Array of clip objects with start, end, title
 */
async function cutClips(videoPath, clips) {
  console.log(`Cutting ${clips.length} clips from video...`);

  // Clear assets directory first
  const assetFiles = fs.readdirSync(CONFIG.ASSETS_DIR);
  assetFiles.forEach(file => {
    fs.unlinkSync(path.join(CONFIG.ASSETS_DIR, file));
    console.log(`Removed old asset file: ${file}`);
  });

  const ffmpegPath = path.join(__dirname, '..', 'ffmpeg');
  const ffmpegExists = fs.existsSync(ffmpegPath);
  const ffmpegCommand = ffmpegExists ? ffmpegPath : 'ffmpeg';

  clips.forEach((clip, index) => {
    const outputName = `${clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${index + 1}.mp4`;
    const outputPath = path.join(CONFIG.ASSETS_DIR, outputName);

    const duration = clip.end - clip.start;

    // FFmpeg command to cut clip
    const command = `${ffmpegCommand} -i "${videoPath}" -ss ${clip.start.toFixed(3)} -t ${duration.toFixed(3)} -c:v libx264 -c:a aac -avoid_negative_ts make_zero -y "${outputPath}"`;

    try {
      console.log(`Processing clip ${index + 1}/${clips.length}: "${clip.title}" (${clip.start}s - ${clip.end}s)`);
      execSync(command, { stdio: 'pipe' });
      console.log(`✓ Clip saved: ${outputPath}`);
    } catch (error) {
      console.error(`✗ Failed to cut clip "${clip.title}":`, error.message);
      // Continue with other clips rather than failing completely
    }
  });
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎬 Starting video extraction process...\n');

    // Ensure directories exist
    ensureDirectories();

    // Read YouTube URL from environment or config
    // For now, we'll use a placeholder or read from a config file
    let youtubeUrl = process.env.YOUTUBE_URL;

    if (!youtubeUrl) {
      // Try to read from a config file
      const configPath = path.join(__dirname, '..', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        youtubeUrl = config.youtubeUrl;
      }
    }

    if (!youtubeUrl) {
      console.warn('⚠️  No YouTube URL provided via YOUTUBE_URL env or config.json');
      console.log('💡 For testing, you can set YOUTUBE_URL environment variable or create config.json');
      console.log('📝 Example config.json: { "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID" }\n');

      // For demonstration purposes, we'll use a known video ID
      // In a real scenario, this would come from user input or previous step
      youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rickroll as example
      console.log(`🔄 Using default test URL: ${youtubeUrl}\n`);
    }

    // Step 1: Download video
    const videoPath = await downloadVideo(youtubeUrl);

    // Step 2: Read clips.json (output from Claude step)
    if (!fs.existsSync(CONFIG.CLIPS_FILE)) {
      throw new Error(`Clips file not found: ${CONFIG.CLIPS_FILE}. Run the Claude step first to generate clips.json.`);
    }

    const clipsData = JSON.parse(fs.readFileSync(CONFIG.CLIPS_FILE, 'utf8'));
    const clips = clipsData.clips || [];

    if (clips.length === 0) {
      throw new Error('No clips found in clips.json');
    }

    console.log(`\n📋 Loaded ${clips.length} clips from ${CONFIG.CLIPS_FILE}`);
    clips.forEach((clip, index) => {
      console.log(`  ${index + 1}. "${clip.title}" (${clip.start}s - ${clip.end}s)`);
    });
    console.log('');

    // Step 3: Cut clips using FFmpeg
    await cutClips(videoPath, clips);

    console.log('\n✅ Video extraction process completed!');
    console.log(`📁 Clips saved to: ${CONFIG.ASSETS_DIR}`);

  } catch (error) {
    console.error('\n❌ Extraction process failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { downloadVideo, cutClips };