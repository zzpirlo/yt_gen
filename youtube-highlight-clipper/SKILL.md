---
name: youtube-highlight-clipper
description: >
  Transforms long-form YouTube transcripts into short, high-impact clips optimized for TikTok, Instagram Reels, and YouTube Shorts.
  Use when user provides a YouTube transcript and asks to "create viral clips", "extract highlights", "make YouTube shorts", 
  "find engaging moments", or "generate clip timestamps from transcript". Works with structured transcript JSON or text files.
license: MIT
metadata:
  author: Claude Code Assistant
  version: 1.0.0
  category: content-creation
  tags: [youtube, video-editing, shorts, transcription, clips]
---

# YouTube Highlight Clipper

Converts long-form video content into multiple short-form clips that capture attention within 1-3 seconds and deliver complete, self-contained ideas.

## ## When to Use This Skill
- User provides a YouTube video transcript (JSON or text format)
- Requests to create shorts, reels, or TikTok-style clips from long-form content
- Needs to extract engaging moments with strong hooks for short-form platforms
- Wants to identify timestamp ranges for video clipping automation
- Working with podcasts, interviews, lectures, or educational content

## ## Step 1: Analyze Transcript Input
Examine the provided transcript to understand:
- Overall structure and key topics
- Speaker patterns and emotional tones
- Potential hook-worthy statements
- Context dependencies between segments

Supported input formats:
- Structured JSON with timestamped segments
- Plain text transcripts with or without timestamps
- Video title, topic, and target audience (if provided)

## ## Step 2: Identify Clip Candidates
Scan the transcript for segments that meet these criteria:

### **Strong Hooks** (priority)
- Bold statements or surprising claims
- Contrarian opinions or challenges to common beliefs
- Direct, emotionally charged openings

### **Emotional Peaks** 
- Moments of passion, frustration, or excitement
- Personal stories, turning points, or vulnerabilitie
- Insightful revelations or "aha" moments

### **Insight Density**
- Clear, valuable takeaways or advice
- Actionable frameworks or principles
- Counterintuitive findings or discoveries

### **Controversy / Tension**
- Disagreements or debates
- Challenging established norms
- Thought-provoking questions

## ## Step 3: Define Clip Boundaries
For each candidate segment:
- Ensure clip length is 10-25 seconds (ideal: ~15 seconds)
- Verify the hook appears within the first 1-3 seconds
- Confirm the clip is contextually complete (doesn't rely heavily on prior context)
- Adjust boundaries to capture complete thoughts or sentences

## ## Step 4: Optimize Hooks
For each selected clip:
- Extract or rewrite the first line to maximize engagement
- Make it direct, clear, and emotionally charged
- Example transformation:
  - Original: "I think consistency is important"
  - Optimized: "Most people fail because they're not consistent"

## ## Step 5: Add Reasoning
For each clip, provide a brief explanation covering:
- Why this clip would perform well on short-form platforms
- What makes it engaging or shareable
- The specific retention factor (hook, emotion, insight, controversy)

## ## Step 6: Generate Structured Output
Create machine-readable JSON compatible with downstream processing:

```json
{
  "clips": [
    {
      "title": "Short descriptive title",
      "start": 123,
      "end": 138,
      "hook": "Compelling opening line",
      "reason": "Why this clip works for retention"
    }
  ]
}
```

### Output Requirements:
- Strict JSON format (no trailing commas, proper quoting)
- Timestamps in seconds (numeric values)
- Title: concise descriptive label (under 60 characters)
- Hook: optimized opening sentence for maximum engagement
- Reason: 1-2 sentence explanation of clip effectiveness

## ## Examples

### **Example 1: Podcast Interview Clip**
**User says:** "Create 3 viral clips from this podcast transcript about productivity"

**Actions:**
1. Analyze transcript for high-energy moments with actionable advice
2. Identify 3 segments with strong hooks in first 3 seconds
3. Verify each clip is 12-18 seconds long and contextually complete
4. Optimize hooks for maximum scroll-stopping power
5. Add reasoning explaining why each clip would drive shares

**Result:** JSON with 3 clip objects, each containing:
- Title: Productivity-focused descriptive title
- Start/end: Precise second timestamps
- Hook: Rewritten opening for maximum impact
- Reason: Explanation of viral potential

### **Example 2: Educational Lecture Clip**
**User says:** "Extract highlights from this lecture transcript for YouTube Shorts"

**Actions:**
1. Scan for insight-dense segments with clear takeaways
2. Prioritize moments with surprising counterintuitive claims
3. Ensure clips avoid heavy reliance on lecture prerequisites
4. Generate timestamps aligned with natural speech breaks
5. Provide educator-focused reasoning for clip selection

**Result:** JSON array of clips optimized for educational short-form content

## ## Troubleshooting

### **Error: Transcript format not recognized**
**Cause:** Input transcript lacks expected structure or timestamps
**Solution:** 
- For JSON: Ensure format matches [speaker, text, start_time, end_time] or similar
- For text: Add basic timestamp parsing or request structured input
- Fallback: Process as plain text with estimated timing

### **Error: No suitable clips found**
**Cause:** Transcript lacks engaging moments or hooks
**Solution:**
- Lower hook threshold slightly while maintaining quality
- Consider combining shorter moments into cohesive clips
- Suggest user provide different content segment
- Explain what makes a moment "clip-worthy" for guidance

### **Error: Clips too long/short**
**Cause:** Difficulty finding natural breaks at target duration
**Solution:**
- Adjust boundaries to complete sentences rather than exact timing
- Prioritize content quality over strict duration adherence
- Note: 8-30 second range acceptable if content justifies it

## ## Quality Checklist

Before finishing, verify:

- [ ] Each clip is 10-25 seconds long (with flexibility for exceptional content)
- [ ] Hook appears within first 3 seconds of each clip
- [ ] Clips are contextually complete (standalone understandable)
- [ ] Output is valid JSON matching required schema
- [ ] Each clip includes reasoning explaining selection rationale
- [ ] No clips rely heavily on prior video context (>20% dependency)
- [ ] Titles are descriptive and under 60 characters
- [ ] Hooks are rewritten for maximum engagement when needed

## ## Performance Notes
- Take time to identify truly engaging moments rather than first acceptable options
- Quality of hook and reasoning matters more than quantity of clips
- When uncertain, favor clips with strong emotional or insight components
- Remember: The goal is scroll-stopping content, not just time-bound segments

## ## Progressive Disclosure
For advanced usage patterns, consult:
- `references/advanced-hook-techniques.md` for sophisticated hook optimization
- `references/platform-specific-guidelines.md` for TikTok vs Reels vs Shorts nuances
- `references/timestamp-validation.md` for ensuring FFmpeg/Remotion compatibility