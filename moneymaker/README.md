# MoneyMaker - YT Clipper Pipeline

A portable, self-contained YouTube to Shorts pipeline for creating viral clips with AI captions and voiceovers.

## 📁 Folder Structure

```
moneymaker/
├── main.js                 # Pipeline orchestrator
├── config.json             # Configuration (video URL, voice ID, etc.)
├── .env.example            # Environment variables template
├── package.json            # Node.js dependencies
├── package-lock.json       # Locked dependencies
├── CLAUDE.md               # Pipeline specification
├── USAGE.md                # Usage guide
├── scripts/
│   ├── extract.js          # yt-dlp + FFmpeg video download & cutting
│   └── render.js           # Remotion rendering with captions
├── python/
│   ├── transcript.py       # YouTube transcript fetcher (with proxy support)
│   ├── voiceover.py        # ElevenLabs TTS for hook voiceovers
│   └── requirements.txt    # Python dependencies
├── remotion/
│   ├── index.js            # Exports shared components
│   ├── Caption.jsx         # Caption component (hook + title)
│   ├── VideoClip.jsx       # Video playback component
│   └── HookText.jsx        # Animated hook text component
├── data/                   # transcript.json, clips.json
├── video/                  # Downloaded full video (full.mp4)
├── assets/                 # Cut clips + voiceovers
├── Outputs/                # Final rendered shorts
└── projects/               # Remotion project files
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Node.js
npm install

# Python
cd python && pip install -r requirements.txt && cd ..
```

### 2. Configure

```bash
# Copy and edit environment variables
cp .env.example .env
# Edit .env with your API keys and proxy (if needed)
```

**Required in `.env`:**
```env
# ElevenLabs (for AI voiceovers - optional)
ELEVENLABS_API_KEY=your_key_here

# Proxy (REQUIRED on cloud/Azure/GCP/AWS - YouTube blocks cloud IPs)
# Get residential proxy from: Bright Data, Oxylabs, Smartproxy, Webshare
YOUTUBE_TRANSCRIPT_PROXY=http://user:pass@host:port
```

**Optional in `config.json`:**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "elevenlabsVoiceId": "21m00Tcm4TlvDq8ikWAM"
}
```

### 3. Run Pipeline

```bash
# Full pipeline
node main.js "https://www.youtube.com/watch?v=VIDEO_ID"

# Or if URL is in config.json/.env
node main.js
```

## 🔄 Pipeline Steps

1. **Transcript Generation** - Python fetches transcript via API (with proxy fallback to yt-dlp)
2. **Review** - Creates `transcript_review.md` for manual verification
3. **Clip Selection** - Use YouTube Highlight Clipper skill → save `clips.json`
4. **Video Extraction** - yt-dlp downloads, FFmpeg cuts clips
5. **Rendering** - Remotion adds captions + motion graphics
6. **Voiceovers** (optional) - `python voiceover.py` generates ElevenLabs audio

## 🎙️ Hook Voiceovers

After clips are rendered, generate AI voiceovers:

```bash
cd python
python voiceover.py --clips-file ../data/clips.json --output-dir ../assets/voiceovers
```

Uses `hook` + `title` from clips.json as voiceover text.

## 📦 Requirements

- **Node.js** 16+
- **Python** 3.8+
- **FFmpeg** (system): `apt-get install ffmpeg` / `brew install ffmpeg`
- **yt-dlp** (Python): `pip install yt-dlp`
- **Residential Proxy** (on cloud): Bright Data, Oxylabs, Smartproxy, etc.

## ⚠️ Important Notes

- **YouTube blocks cloud IPs** (Azure/GCP/AWS). A residential proxy is REQUIRED on cloud servers.
- **Manual review step** is mandatory: `transcript_review.md` must be approved before clip selection.
- **Clips.json format:**
  ```json
  {
    "clips": [
      { "start": 50, "end": 65, "hook": "Hook text", "title": "Clip Title" }
    ]
  }
  ```

## 📂 Output Locations

| Output | Location |
|--------|----------|
| Cut clips | `assets/` |
| Final shorts | `Outputs/` |
| Voiceovers | `assets/voiceovers/` |
| Remotion projects | `projects/` |

---

Built for rapid viral content creation. 🎬