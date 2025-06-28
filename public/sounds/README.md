# Game Sound Files

This directory contains audio files for typing practice feedback.

## Required Sound Files

1. **error.mp3** (or .wav) - Wrong letter/mistake sound

   - Short, low-pitched buzz or beep
   - Duration: ~200-300ms
   - Suggested: 440Hz tone with slight distortion

2. **success.mp3** (or .wav) - Correct completion sound

   - Pleasant, higher-pitched chime or ding
   - Duration: ~500-800ms
   - Suggested: C major chord (261Hz, 329Hz, 392Hz)

3. **keystroke.mp3** (or .wav) - Optional typing sound
   - Very short click or tap sound
   - Duration: ~50-100ms
   - Suggested: Brief white noise burst

## Implementation Notes

- The GameSoundService will try to load these files first
- If files don't exist, it falls back to Web Audio API generated tones
- Sounds can be disabled in user settings
- All sounds should be normalized to prevent sudden volume changes

## Sound Sources

You can find suitable CC0/public domain game sounds at:

- freesound.org
- opengameart.org
- zapsplat.com (free tier)

Or generate them programmatically using tools like:

- Audacity (free)
- Chrome DevTools Audio tab
- Web Audio API directly
