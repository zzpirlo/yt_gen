#!/usr/bin/env python3
"""
YouTube Transcript Fetcher
Responsible for fetching YouTube transcripts and outputting clean JSON.
Supports proxy configuration to bypass IP blocking and falls back to yt-dlp captions.
"""

import sys
import json
import re
import os
import subprocess
import tempfile
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from youtube_transcript_api.proxies import GenericProxyConfig


def extract_video_id(url):
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:watch\?v=)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    # If no pattern matches, assume the input is already a video ID
    if re.match(r'^[0-9A-Za-z_-]{11}$', url):
        return url

    raise ValueError("Unable to extract video ID from URL")


def build_proxy_config(proxy_url):
    if not proxy_url:
        return None
    proxy_url = proxy_url.strip()
    if not proxy_url:
        return None
    return GenericProxyConfig(http_url=proxy_url, https_url=proxy_url)


def fetch_transcript(video_id, languages=['en'], proxy=None):
    """Fetch transcript for given video ID.

    Args:
        video_id: YouTube video ID
        languages: List of preferred languages
        proxy: Proxy URL (e.g., 'http://user:pass@host:port' or 'socks5://host:port')
               This script translates the proxy URL into a GenericProxyConfig
               so the youtube-transcript-api library can use it.
    """
    proxy_config = build_proxy_config(proxy)
    try:
        api = YouTubeTranscriptApi(proxy_config=proxy_config)

        # Try to fetch transcript with preferred language
        transcript_obj = None

        for lang in languages:
            try:
                transcript_obj = api.fetch(video_id, languages=[lang])
                break
            except Exception:
                continue

        # If no preferred language found, try without language specification
        if transcript_obj is None:
            transcript_obj = api.fetch(video_id)

        # Extract raw transcript data
        transcript_data = transcript_obj.to_raw_data()

        # Convert to clean JSON format
        clean_transcript = []
        for entry in transcript_data:
            clean_transcript.append({
                "text": entry['text'].strip(),
                "start": entry['start'],
                "duration": entry['duration'],
                "end": entry['start'] + entry['duration']
            })

        return clean_transcript

    except TranscriptsDisabled:
        raise Exception("Transcripts are disabled for this video")
    except NoTranscriptFound:
        raise Exception("No transcript found for this video")
    except VideoUnavailable:
        raise Exception("Video is unavailable")
    except Exception as e:
        message = str(e)
        lower_message = message.lower()
        if proxy and (
            "unable to connect to proxy" in lower_message
            or "failed to establish a new connection" in lower_message
            or "connection refused" in lower_message
        ):
            raise Exception(f"Proxy failure while fetching transcript: {message}")

        if "blocked" in lower_message or "ip" in lower_message or "429" in lower_message:
            print(f"Transcript API fetch failed: {message}", file=sys.stderr)
            print("Falling back to yt-dlp captions extraction", file=sys.stderr)
            return fetch_transcript_from_ytdlp(video_id, proxy=proxy)
        raise Exception(f"Error fetching transcript: {message}")


def fetch_transcript_from_ytdlp(video_id, proxy=None):
    """Fallback to yt-dlp captions when the transcript API is blocked."""
    try:
        with tempfile.TemporaryDirectory(prefix='yt-clipper-', dir='/tmp') as temp_dir:
            cmd = [
                'yt-dlp',
                '--write-auto-subs',
                '--write-subs',
                '--skip-download',
                '--sub-lang', 'en',
                '--sub-format', 'vtt',
                '--output', os.path.join(temp_dir, '%(id)s.%(ext)s'),
            ]
            # Add proxy if provided
            if proxy:
                cmd.extend(['--proxy', proxy])

            cmd.append(f'https://www.youtube.com/watch?v={video_id}')
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            if result.returncode != 0:
                raise Exception(result.stderr.strip() or result.stdout.strip() or 'yt-dlp failed')

            caption_files = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir) if f.endswith('.vtt')]
            if not caption_files:
                raise Exception('No .vtt captions were produced by yt-dlp')

            with open(caption_files[0], 'r', encoding='utf-8') as f:
                vtt_content = f.read()

        cues = []
        for block in re.split(r'\n\n+', vtt_content.strip()):
            lines = [line.strip() for line in block.splitlines() if line.strip()]
            if not lines or lines[0].startswith('WEBVTT'):
                continue
            if '-->' not in lines[0]:
                continue
            text_lines = [line for line in lines[1:] if not line.startswith('<')]
            if text_lines:
                cues.append(' '.join(text_lines))

        if not cues:
            raise Exception('No caption cues were parsed from yt-dlp output')

        clean_transcript = []
        for idx, text in enumerate(cues):
            clean_transcript.append({
                "text": text,
                "start": idx * 3.0,
                "duration": 3.0,
                "end": idx * 3.0 + 3.0,
            })

        return clean_transcript
    except Exception as e:
        raise Exception(f"Captions fallback failed: {str(e)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python transcript.py <YouTube_URL_or_Video_ID> [output_file]")
        print("Example: python transcript.py https://www.youtube.com/watch?v=abc123")
        sys.exit(1)

    url_or_id = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "data/transcript.json"

    # Get proxy from supported environment variables
    proxy = (
        os.getenv('YOUTUBE_TRANSCRIPT_PROXY')
        or os.getenv('HTTPS_PROXY')
        or os.getenv('https_proxy')
        or os.getenv('HTTP_PROXY')
        or os.getenv('http_proxy')
    )

    try:
        # Extract video ID
        video_id = extract_video_id(url_or_id)
        print(f"Fetching transcript for video ID: {video_id}", file=sys.stderr)
        if proxy:
            print(f"Using proxy: {proxy}", file=sys.stderr)

        # Fetch transcript
        transcript_data = fetch_transcript(video_id, proxy=proxy)

        # Output to file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(transcript_data, f, indent=2, ensure_ascii=False)

        # Also output to stdout for piping
        print(json.dumps(transcript_data, indent=2, ensure_ascii=False))

        print(f"\nTranscript saved to: {output_file}", file=sys.stderr)
        print(f"Total segments: {len(transcript_data)}", file=sys.stderr)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()