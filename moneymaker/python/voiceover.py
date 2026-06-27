#!/usr/bin/env python3
"""
ElevenLabs Voiceover Generator
Generates AI voiceovers for YT Clipper clips using ElevenLabs TTS.
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings
except ImportError:
    print("Error: elevenlabs package not installed. Run: pip install elevenlabs")
    sys.exit(1)

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def generate_voiceover(text, voice_id, api_key, output_path, model_id="eleven_multilingual_v2"):
    """
    Generate voiceover using ElevenLabs TTS.

    Args:
        text: Text to convert to speech
        voice_id: ElevenLabs voice ID
        api_key: ElevenLabs API key
        output_path: Path to save the audio file
        model_id: TTS model to use

    Returns:
        bool: Success status
    """
    try:
        client = ElevenLabs(api_key=api_key)

        # Generate audio
        audio = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id=model_id,
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
                style=0.0,
                use_speaker_boost=True
            )
        )

        # Save audio file
        with open(output_path, 'wb') as f:
            for chunk in audio:
                f.write(chunk)

        print(f"✓ Voiceover saved: {output_path}")
        return True

    except Exception as e:
        print(f"✗ Failed to generate voiceover: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Generate ElevenLabs voiceovers for clips')
    parser.add_argument('--clips-file', default='data/clips.json', help='Path to clips.json')
    parser.add_argument('--output-dir', default='assets/voiceovers', help='Output directory for voiceovers')
    parser.add_argument('--voice-id', help='ElevenLabs voice ID (overrides config.json)')
    parser.add_argument('--api-key', help='ElevenLabs API key (overrides .env)')
    parser.add_argument('--text', help='Custom text to generate (for testing)')
    args = parser.parse_args()

    # Load config
    config_path = Path(__file__).parent.parent / 'config.json'
    config = {}
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)

    # Get voice ID
    voice_id = args.voice_id or config.get('elevenlabsVoiceId') or os.getenv('ELEVENLABS_VOICE_ID')
    if not voice_id:
        print("Error: No voice ID provided. Set in config.json, --voice-id, or ELEVENLABS_VOICE_ID env var")
        sys.exit(1)

    # Get API key
    api_key = args.api_key or os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        print("Error: No API key provided. Set in .env, --api-key, or ELEVENLABS_API_KEY env var")
        sys.exit(1)

    # Create output directory
    output_dir = Path(__file__).parent.parent / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    # If custom text provided, generate single voiceover
    if args.text:
        output_path = output_dir / 'custom_voiceover.mp3'
        generate_voiceover(args.text, voice_id, api_key, output_path)
        return

    # Load clips.json
    clips_file = Path(__file__).parent.parent / args.clips_file
    if not clips_file.exists():
        print(f"Error: clips.json not found at {clips_file}")
        sys.exit(1)

    with open(clips_file) as f:
        clips_data = json.load(f)

    clips = clips_data.get('clips', [])
    if not clips:
        print("No clips found in clips.json")
        sys.exit(1)

    print(f"Generating voiceovers for {len(clips)} clips...")

    # Generate voiceover for each clip (using hook + title as text)
    for i, clip in enumerate(clips):
        # Combine hook and title for the voiceover
        text = f"{clip.get('hook', '')}. {clip.get('title', '')}"

        output_name = f"{clip.get('title', f'clip_{i+1}').replace(' ', '_').replace('/', '_')}_voiceover.mp3"
        output_path = output_dir / output_name

        print(f"  Clip {i+1}/{len(clips)}: {clip.get('title', 'Untitled')}")
        generate_voiceover(text, voice_id, api_key, output_path)

    print(f"\n✓ Voiceovers saved to: {output_dir}")


if __name__ == '__main__':
    main()