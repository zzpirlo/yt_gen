#!/usr/bin/env python3
"""
Test suite for the YouTube Transcript API wrapper
"""

import subprocess
import json
import os
import sys

def test_transcript_fetching():
    """Test fetching a transcript from a YouTube video."""
    print("=" * 60)
    print("TEST 1: Fetching transcript with Video ID")
    print("=" * 60)
    
    cmd = [
        "python", "python/transcript.py", "dQw4w9WgXcQ",
        "data/test_rickroll.json"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✓ Transcript fetched successfully")
        print(f"  STDERR: {result.stderr.strip()}")
        
        # Verify JSON output
        with open("data/test_rickroll.json", "r") as f:
            data = json.load(f)
            print(f"✓ Valid JSON with {len(data)} segments")
            print(f"  First segment: {data[0]['text'][:30]}...")
            print(f"  Duration: ~{data[-1]['end']:.1f} seconds")
    else:
        print("✗ Failed to fetch transcript")
        print(f"  Error: {result.stderr}")
        return False
    
    return True

def test_url_parsing():
    """Test URL parsing functionality."""
    print("\n" + "=" * 60)
    print("TEST 2: URL Parsing")
    print("=" * 60)
    
    test_urls = [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "Standard URL"),
        ("https://youtu.be/dQw4w9WgXcQ", "Short URL"),
        ("dQw4w9WgXcQ", "Direct Video ID"),
    ]
    
    for url, desc in test_urls:
        cmd = ["python", "python/transcript.py", url, "/tmp/test.json"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if "dQw4w9WgXcQ" in result.stderr:
            print(f"✓ {desc}: ID extracted correctly")
        else:
            print(f"✗ {desc}: Failed to extract ID")
    
    return True

def test_error_handling():
    """Test error handling for invalid inputs."""
    print("\n" + "=" * 60)
    print("TEST 3: Error Handling")
    print("=" * 60)
    
    # Test with no arguments
    cmd = ["python", "python/transcript.py"]
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print("✓ Correctly handles missing arguments")
    else:
        print("✗ Should have failed with missing arguments")
        return False
    
    # Test with invalid video ID
    cmd = ["python", "python/transcript.py", "invalid123"]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    
    if result.returncode != 0:
        print("✓ Correctly handles invalid video ID")
    else:
        print("✗ Should have failed with invalid video ID")
    
    return True

if __name__ == "__main__":
    os.chdir("/workspaces/yt_gen")
    
    try:
        print("\n🧪 YouTube Transcript API Test Suite\n")
        
        results = [
            test_transcript_fetching(),
            test_url_parsing(),
            test_error_handling(),
        ]
        
        print("\n" + "=" * 60)
        print(f"SUMMARY: {sum(results)}/{len(results)} test groups passed")
        print("=" * 60)
        
        sys.exit(0 if all(results) else 1)
    except Exception as e:
        print(f"\n✗ Test execution failed: {e}")
        sys.exit(1)
