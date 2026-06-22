# YT Clipper - Usage Guide

## Overview
YT Clipper is a reusable, modular, and cheap content engine for clipping YouTube videos into shorts.

## Pipeline Steps
1. **Transcript Generation** - Python script fetches YouTube transcript
2. **Clip Selection** - Claude AI selects engaging moments (requires user review)
3. **Video Extraction** - yt-dlp + FFmpeg downloads and cuts video
4. **Rendering** - Remotion adds captions and motion graphics

## Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- ffmpeg (for video processing)
- Claude AI with YouTube Highlight Clipper skill

## Installation

### 1. Install Python dependencies
```bash
cd python
pip install -r requirements.txt
```

### 2. Install Node.js dependencies
```bash
npm install
```

### 3. Install ffmpeg (system requirement)
#### Ubuntu/Debian:
```bash
sudo apt-get install ffmpeg
```

#### macOS (with Homebrew):
```bash
brew install ffmpeg
```

#### Windows:
Download from https://ffmpeg.org/download.html

## Usage

### Step 1: Generate Transcript
```bash
node main.js <YOUTUBE_URL>
```
Example:
```bash
node main.js https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

This will:
1. Generate transcript.json in the data/ directory
2. Create transcript_review.md for user verification

### Step 2: Review and Select Clips (MANDATORY)
**IMPORTANT**: You MUST review the transcript before proceeding.

1. Open `transcript_review.md` and verify the transcript is correct
2. Use the YouTube Highlight Clipper skill in Claude:
   - Ask Claude: "Create viral clips from this transcript"
   - Or: "Extract highlights for YouTube Shorts"
   - Provide the transcript content if needed
3. Claude will output a JSON structure with clips
4. Save this output to `data/clips.json`

### Step 3: Continue Pipeline
Once clips.json is saved:
```bash
node main.js <YOUTUBE_URL>
```
(The script will detect that clip selection is complete and continue)

### Step 4: Get Results
- Clipped videos: `assets/` directory
- Final rendered shorts: `Outputs/` directory
- Remotion projects: `projects/` directory (for further customization)

## Example Workflow

```bash
# 1. Start pipeline
node main.js https://www.youtube.com/watch?v=example123

# 2. Review transcript_review.md and use Claude skill to create clips.json

# 3. Continue pipeline
node main.js https://www.youtube.com/watch?v=example123

# 4. Check results
ls -la Outputs/
ls -la assets/
```

## File Structure
```
project_root/
├── python/
│   └── transcript.py       # Transcript generation
├── data/
│   ├── transcript.json     # Raw transcript (Python output)
│   ├── clips.json          # Clip selections (Claude output)
│   └── transcript_review.md # User review file
├── video/
│   └── full.mp4            # Downloaded video
├── assets/                 # Clipped video segments
├── Outputs/                # Final rendered shorts
├── projects/               # Remotion projects
├── remotion/               # Remotion components
├── scripts/
│   ├── extract.js          # yt-dlp + FFmpeg wrapper
│   └── render.js           # Remotion renderer
├── main.js                 # Pipeline orchestrator
└── USAGE.md                # This file
```

## Important Notes

### 🔒 User Review Requirement
As specified in CLAUDE.md: "Transcripts and timestamps MUST first be outputted in an .md file for the user to check before proceeding."

The `transcript_review.md` file fulfills this requirement. You **must** review this file before using the Claude skill for clip selection.

### 🎬 Output Formats
- **Clipped assets**: Raw cut segments from the original video
- **Rendered Outputs**: Vertical shorts (1080x1920) with captions and motion graphics
- **Remotion projects**: Editable projects for further customization

### 🛠️ Customization
- Modify `scripts/extract.js` to change yt-dlp/FFmpeg parameters
- Modify `scripts/render.js` to change Remotion components and styles
- Adjust `CONFIG` values in main.js for different video qualities or formats

## Troubleshooting

### "Transcripts are disabled for this video"
Some YouTube videos have transcripts disabled. Try a different video.

### "No transcript found"
The video may not have captions available in the requested language.

### FFmpeg not found
Ensure ffmpeg is installed and in your PATH:
```bash
ffmpeg -version
```

### Node.js memory issues
For long videos, increase Node.js memory limit:
```bash
node --max-old-space-size=4096 main.js <URL>
```

## Skill Integration
The YouTube Highlight Clipper skill should be loaded automatically when you ask Claude to:
- "Create viral clips"
- "Extract highlights" 
- "Make YouTube shorts"
- "Find engaging moments"

The skill expects transcript data and outputs clips.json with the required format:
```json
{
  "clips": [
    {
      "start": 120,
      "end": 135,
      "hook": "This is why most people fail",
      "title": "Discipline Truth"
    }
  ]
}
```

## License
MIT