/**
 * Simple validation script for YouTube Highlight Clipper output
 * Validates that the JSON output meets the required schema
 */

const fs = require('fs');

function validateClipperOutput(jsonData) {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    // Check top-level structure
    if (!data || typeof data !== 'object') {
      throw new Error('Output must be a JSON object');
    }

    if (!Array.isArray(data.clips)) {
      throw new Error('Output must contain a "clips" array');
    }

    // Validate each clip
    data.clips.forEach((clip, index) => {
      const clipNum = index + 1;

      // Required fields
      if (!clip.title || typeof clip.title !== 'string') {
        throw new Error(`Clip ${clipNum}: Missing or invalid 'title' (string required)`);
      }

      if (clip.title.length > 60) {
        throw new Error(`Clip ${clipNum}: Title too long (max 60 characters)`);
      }

      if (typeof clip.start !== 'number' || clip.start < 0) {
        throw new Error(`Clip ${clipNum}: Missing or invalid 'start' (non-negative number required)`);
      }

      if (typeof clip.end !== 'number' || clip.end <= clip.start) {
        throw new Error(`Clip ${clipNum}: Missing or invalid 'end' (number greater than start required)`);
      }

      const duration = clip.end - clip.start;
      if (duration < 10 || duration > 30) {
        console.warn(`Clip ${clipNum}: Duration ${duration}s is outside ideal 10-25s range`);
      }

      if (!clip.hook || typeof clip.hook !== 'string') {
        throw new Error(`Clip ${clipNum}: Missing or invalid 'hook' (string required)`);
      }

      if (!clip.reason || typeof clip.reason !== 'string') {
        throw new Error(`Clip ${clipNum}: Missing or invalid 'reason' (string required)`);
      }

      // Additional validations
      if (clip.title.trim() === '') {
        throw new Error(`Clip ${clipNum}: Title cannot be empty`);
      }

      if (clip.hook.trim() === '') {
        throw new Error(`Clip ${clipNum}: Hook cannot be empty`);
      }
    });

    return { valid: true, message: `Validated ${data.clips.length} clip(s) successfully` };

  } catch (error) {
    return { valid: false, message: error.message };
  }
}

// CLI usage
if (require.main === module) {
  const filename = process.argv[2];
  if (!filename) {
    console.error('Usage: node validate_output.js <filename.json>');
    process.exit(1);
  }

  try {
    const data = fs.readFileSync(filename, 'utf8');
    const result = validateClipperOutput(data);

    if (result.valid) {
      console.log(`✅ ${result.message}`);
      process.exit(0);
    } else {
      console.error(`❌ Validation failed: ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error reading file: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateClipperOutput };