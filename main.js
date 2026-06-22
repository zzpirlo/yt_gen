#!/usr/bin/env node
/**
 * Main Application Orchestrator
 * Coordinates the complete YT Clipper pipeline:
 * Transcript Generation -> Clip Selection -> Video Extraction -> Rendering
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import pipeline components
const transcriptScript = path.join(__dirname, 'python', 'transcript.py');
const extractScript = path.join(__dirname, 'scripts', 'extract.js');
const renderScript = path.join(__dirname, 'scripts', 'render.js');

const CONFIG = {
  // Pipeline steps
  STEPS: {
    TRANSCRIPT: 'transcript',
    CLIP_SELECTION: 'clip-selection', // This is the Claude step (manual)
    EXTRACTION: 'extraction',
    RENDERING: 'rendering'
  },

  // File paths
  TRANSCRIPT_INPUT: null, // Will be set from command line
  TRANSCRIPT_OUTPUT: path.join(__dirname, 'data', 'transcript.json'),
  CLIPS_INPUT: path.join(__dirname, 'data', 'clips.json'), // Output from Claude step
  CLIPS_OUTPUT: path.join(__dirname, 'data', 'clips.json'), // Same file for simplicity

  // Markdown review file (as per CLAUDE.md requirement)
  REVIEW_FILE: path.join(__নে, 'transcript_review.md')
};

/**
 * Display pipeline overview
 */
function showPipelineOverview() {
  console.log('🎬 YT Clipper - YouTube to Shorts Pipeline');
  console.log('=' .repeat(50));
  console.log('Pipeline Steps:');
  console.log('  1. 📄 Transcript Generation (Python)');
  console.log('  2. 🤖 Clip Selection (Claude AI) - REQUIRES USER REVIEW');
  console.log('  3. 🎥 Video Extraction (yt-dlp + FFmpeg)');
  console.log('  4. 🎨 Rendering (Remotion)');
  console.log('=' .repeat(50));
  console.log('Important: Step 2 (Clip Selection) requires manual review');
  console.log('of the generated transcript before proceeding.\n');
}

/**
 * Run transcript generation step
 * @param {string} youtubeUrl - YouTube URL or video ID
 * @returns {boolean} Success status
 */
function runTranscriptStep(youtubeUrl) {
  try {
    console.log('🔄 Step 1: Generating transcript from YouTube...');

    // Call the Python transcript script
    const command = `python3 "${transcriptScript}" "${youtubeUrl}" "${CONFIG.TRANSCRIPT_OUTPUT}"`;
    const result = execSync(command, { stdio: 'pipe', encoding: 'utf8' });

    console.log('✓ Transcript generation completed');
    return true;
  } catch (error) {
    console.error('✗ Transcript generation failed:');
    console.error(error.message);
    return false;
  }
}

/**
 * Create review markdown file for user verification
 * As required by CLAUDE.md: "Transcripts and timestamps MUST first be outputted in an .md file"
 */
function createReviewFile() {
  try {
    console.log('📝 Creating transcript review file for user verification...');

    // Read the generated transcript
    const transcriptData = JSON.parse(fs.readFileSync(CONFIG.TRANSCRIPT_OUTPUT, 'utf8'));

    // Create markdown content
    let markdownContent = `# YouTube Transcript Review\n\n`;
    markdownContent += `**Important**: Please review this transcript before proceeding to clip selection.\n\n`;
    markdownContent += `## Transcript Data\n\n`;
    markdownContent += `| Start Time | End Time | Text |\n`;
    markdownContent += `|------------|----------|------|\n`;

    // Add transcript entries (limit to first 50 for readability)
    const displayCount = Math.min(transcriptData.length, 50);
    for (let i = 0; i < displayCount; i++) {
      const entry = transcriptData[i];
      const startTime = new Date(entry.start * 1000).toISOString().substr(11, 8);
      const endTime = new Date(entry.end * 1000).toISOString().substr(11, 8);
      const text = entry.text.replace(/|/g, '\\|'); // Escape pipe characters

      markdownContent += `| ${startTime} | ${endTime} | ${text} |\n`;
    }

    if (transcriptData.length > 50) {
      markdownContent += `\n*... and ${transcriptData.length - 50} more segments*\n`;
    }

    markdownContent += `\n## Next Steps\n\n`;
    markdownContent += `1. Review the transcript above for accuracy\n`;
    markdownContent += `2. Use the YouTube Highlight Clipper skill to select engaging moments\n`;
    markdownContent += `3. The skill will generate a clips.json file with:\n`;
    markdownContent += `   - start: start timestamp in seconds\n`;
    markdownContent += `   - end: end timestamp in seconds\n`;
    markdownContent += `   - hook: compelling opening line\n`;
    markdownContent += `   - title: descriptive title\n`;
    markdownContent += `4. Save the clips.json file to: ${CONFIG.CLIPS_INPUT}\n`;
    markdownContent += `5. Run this script again to continue with extraction and rendering\n`;

    // Write the review file
    fs.writeFileSync(CONFIG.REVIEW_FILE, markdownContent);

    console.log(`✓ Review file created: ${CONFIG.REVIEW_FILE}`);
    console.log(`📋 Please review this file before proceeding to clip selection\n`);

    return true;
  } catch (error) {
    console.error('✗ Failed to create review file:');
    console.error(error.message);
    return false;
  }
}

/**
 * Check if Claude step (clip selection) has been completed
 * @returns {boolean} True if clips.json exists and is valid
 */
function isClaudeStepComplete() {
  try {
    if (!fs.existsSync(CONFIG.CLIPS_INPUT)) {
      return false;
    }

    const clipsData = JSON.parse(fs.readFileSync(CONFIG.CLIPS_INPUT, 'utf8'));
    return Array.isArray(clipsData.clips) && clipsData.clips.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Run video extraction step
 * @returns {boolean} Success status
 */
function runExtractionStep() {
  try {
    console.log('🔄 Step 3: Extracting video clips...');

    // Call the extract.js script
    const command = `node "${extractScript}"`;
    const result = execSync(command, { stdio: 'inherit' });

    console.log('✓ Video extraction completed');
    return true;
  } catch (error) {
    console.error('✗ Video extraction failed:');
    console.error(error.message);
    return false;
  }
}

/**
 * Run rendering step
 * @returns {boolean} Success status
 */
function runRenderingStep() {
  try {
    console.log('🔄 Step 4: Rendering final videos with Remotion...');

    // Call the render.js script
    const command = `node "${renderScript}"`;
    const result = execSync(command, { stdio: 'inherit' });

    console.log('✓ Video rendering completed');
    return true;
  } catch (error) {
    console.error('✗ Video rendering failed:');
    console.error(error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    showPipelineOverview();

    // Get YouTube URL from command line argument or environment
    let youtubeUrl = process.argv[2];

    if (!youtubeUrl) {
      youtubeUrl = process.env.YOUTUBE_URL;
    }

    if (!youtubeUrl) {
      // Try to read from config
      const configPath = path.join(__dirname, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        youtubeUrl = config.youtubeUrl;
      }
    }

    if (!youtubeUrl) {
      console.error('❌ Error: YouTube URL is required');
      console.error('Usage: node main.js <YouTube_URL>');
      console.error('   or: YOUTUBE_URL=<url> node main.js');
      console.error('   or: Create config.json with { "youtubeUrl": "<url>" }');
      process.exit(1);
    }

    console.log(`🎯 Target YouTube URL: ${youtubeUrl}\n`);

    // Step 1: Transcript Generation
    if (!runTranscriptStep(youtubeUrl)) {
      process.exit(1);
    }

    // Create review file for user verification (Mandatory per CLAUDE.md)
    if (!createReviewFile()) {
      process.exit(1);
    }

    console.log('⏸️  PAUSE REQUIRED: Clip Selection Step\n');
    console.log('📋 ACTION NEEDED:');
    console.log(`   1. Review the transcript in: ${CONFIG.REVIEW_FILE}`);
    console.log('   2. Use the YouTube Highlight Clipper skill to select clips');
    console.log('   3. Ensure the skill outputs a valid clips.json file');
    console.log(`   4. Save it to: ${CONFIG.CLIPS_INPUT}`);
    console.log('   5. Run this command again to continue the pipeline\n');

    // Check if user has completed the Claude step
    console.log('🔍 Checking if clip selection step is complete...');

    if (!isClaudeStepComplete()) {
      console.log('⏳ Waiting for clip selection to be completed...');
      console.log('💡 Tip: You can run the YouTube Highlight Clipper skill now');
      console.log('   by asking Claude to "create viral clips" or "extract highlights"');
      console.log('   from the transcript, then save the output to clips.json\n');

      // In a real implementation, we might wait or exit here
      // For this implementation, we'll provide instructions and exit
      console.log('🔄 To continue after completing clip selection, run:');
      console.log(`   node main.js ${youtubeUrl}\n`);

      return; // Exit gracefully - user needs to complete the manual step
    }

    // If we reach here, the Claude step is complete
    console.log('✅ Clip selection step detected as complete!\n');

    // Step 3: Video Extraction
    if (!runExtractionStep()) {
      process.exit(1);
    }

    // Step 4: Rendering
    if (!runRenderingStep()) {
      process.exit(1);
    }

    console.log('\n🎉 Pipeline completed successfully!');
    console.log('📁 Final outputs are available in the Outputs/ directory');

  } catch (error) {
    console.error('\n❌ Pipeline failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runTranscriptStep,
  createReviewFile,
  isClaudeStepComplete,
  runExtractionStep,
  runRenderingStep
};