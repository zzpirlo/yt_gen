# YouTube Highlight Clipper Skill

A Claude skill that transforms long-form YouTube transcripts into short, high-impact clips optimized for TikTok, Instagram Reels, and YouTube Shorts.

## 🚀 When to Use This Skill

Use this skill when you:
- Have a YouTube transcript (JSON or text format) and want to create viral clips
- Need to extract engaging moments with strong hooks for short-form platforms
- Want to identify timestamp ranges for automated video clipping
- Are working with podcasts, interviews, lectures, or educational content

**Trigger phrases:** "create viral clips", "extract highlights", "make YouTube shorts", "find engaging moments", "generate clip timestamps from transcript"

## 📥 Inputs

The skill expects:
- A full transcript of a YouTube video (timestamped JSON or structured text)
- Optional metadata: video title, topic/niche, target audience

## 📤 Outputs

Returns structured JSON containing clips with:
- `title`: Short descriptive title
- `start`: Start timestamp in seconds
- `end`: End timestamp in seconds  
- `hook`: Compelling opening line (optimized for first 3 seconds)
- `reason`: Explanation of why this clip works for retention

Each clip is 10-25 seconds long (ideal: ~15 seconds) with a strong hook in the first sentence.

## 🔧 How It Works

1. **Analyzes transcript** for hook-worthy moments, emotional peaks, and insight density
2. **Identifies candidates** meeting selection criteria (strong hooks, emotional peaks, etc.)
3. **Defines boundaries** ensuring clips are 10-25 seconds and contextually complete
4. **Optimizes hooks** for maximum engagement in the first 1-3 seconds
5. **Adds reasoning** explaining why each clip would perform well
6. **Generates structured JSON** compatible with FFmpeg and Remotion processing

## 📋 Example Usage

**User says:** "Create 3 viral clips from this podcast transcript about productivity"

**Skill processes:** 
- Analyzes transcript for high-energy moments with actionable advice
- Identifies 3 segments with strong hooks in first 3 seconds
- Verifies each clip is 12-18 seconds long and contextually complete
- Optimizes hooks for maximum scroll-stopping power
- Adds reasoning explaining viral potential

**Returns:** JSON array of 3 clip objects ready for video clipping workflow

## 📁 Skill Structure

```
youtube-highlight-clipper/
├── SKILL.md              # Main skill instructions
├── scripts/
│   └── validate_output.js # Optional validation script
├── references/
│   ├── advanced-hook-techniques.md
│   └── platform-specific-guidelines.md
└── assets/               # (empty - for templates, fonts, icons if needed)
```

## ✅ Quality Guarantees

- Each clip contains a strong hook within the first 3 seconds
- Output is machine-readable JSON (FFmpeg/Remotion compatible)
- Clips are contextually complete (standalone understandable)
- Reasoning provided for transparency and intent demonstration
- Optimized for short-form platform algorithms (TikTok, Reels, Shorts)

## 🛠️ Advanced Features

Consult reference files for:
- Advanced hook optimization techniques (`references/advanced-hook-techniques.md`)
- Platform-specific guidelines (`references/platform-specific-guidelines.md`)
- Validation tools (`scripts/validate_output.js`)