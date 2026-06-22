#!/usr/bin/env python3
"""
YouTube Transcript Fetcher
Responsible for fetching YouTube transcripts and outputting clean JSON.
"""

import sys
import json
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable


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


def fetch_transcript(video_id, languages=['en']):
    """Fetch transcript for given video ID."""
    try:
        # Try to get transcript with language preference
        try:
            transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        except NoTranscriptFound:
            # If no transcript in preferred languages, try to get any available transcript
            transcript_list = YouTubeTranscriptApi.list(video_id)

            # Try to find transcript in preferred languages
            transcript = None
            for lang in languages:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    break
                except:
                    continue

            # If still no transcript, get the first available one
            if transcript is None:
                # Convert to list to iterate (it's a generator)
                transcript_list_items = list(transcript_list)
                if transcript_list_items:
                    transcript = transcript_list_items[0]
                else:
                    raise NoTranscriptFound("No transcripts available")

            # Fetch the transcript data
            transcript_data = transcript.fetch()

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
        raise Exception(f"Error fetching transcript: {str(e)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python transcript.py <YouTube_URL_or_Video_ID> [output_file]")
        print("Example: python transcript.py https://www.youtube.com/watch?v=abc123")
        sys.exit(1)

    url_or_id = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "data/transcript.json"

    try:
        # Extract video ID
        video_id = extract_video_id(url_or_id)
        print(f"Fetching transcript for video ID: {video_id}", file=sys.stderr)

        # Fetch transcript
        transcript_data = fetch_transcript(video_id)

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