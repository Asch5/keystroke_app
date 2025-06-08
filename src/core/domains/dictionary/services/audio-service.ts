/**
 * Audio Service for playing database audio files
 * Simplified approach based on the working admin implementation
 */

export class AudioService {
  private static currentAudio: HTMLAudioElement | null = null;

  /**
   * Plays audio from database URL
   * @param audioUrl - The audio file URL from the database
   * @returns Promise that resolves when audio starts playing or rejects on error
   */
  static async playAudioFromDatabase(audioUrl: string): Promise<void> {
    try {
      // Validate URL
      if (!audioUrl || typeof audioUrl !== 'string') {
        throw new Error('Invalid audio URL provided');
      }

      console.log('🎵 Attempting to play audio from:', audioUrl);

      // Check if we need to use proxy for external URLs
      let finalAudioUrl = audioUrl;
      try {
        const url = new URL(audioUrl);
        const isExternalUrl = !url.hostname.includes(window.location.hostname);

        if (isExternalUrl) {
          // Use proxy for external URLs like static.ordnet.dk
          finalAudioUrl = `/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
          console.log('🔄 Using proxy for external URL');
        }
      } catch {
        // If URL parsing fails, use original URL
        console.warn('⚠️ Could not parse URL, using as-is');
      }

      // Stop any currently playing audio
      this.stopCurrentAudio();

      // Create new audio element - simple approach like admin page
      const audio = new Audio(finalAudioUrl);

      // Set up basic event handlers like admin page
      audio.onended = () => {
        this.currentAudio = null;
        console.log('🏁 Audio playback completed');
      };

      audio.onerror = () => {
        this.currentAudio = null;
        console.error('❌ Audio playback error occurred');
        // Don't throw here - just cleanup like admin page
      };

      // Try to play the audio
      await audio.play();

      // If successful, store reference
      this.currentAudio = audio;
      console.log('🔊 Audio playback started successfully');
    } catch (error) {
      console.error('❌ Audio service error:', error);

      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error(
            'Audio playback was prevented by browser policy. Please interact with the page first.',
          );
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Audio format not supported by your browser');
        } else if (error.name === 'AbortError') {
          throw new Error('Audio loading was aborted');
        } else if (error.message.includes('fetch')) {
          throw new Error(
            'Network error while loading audio - check your internet connection',
          );
        }
      }

      throw new Error('Failed to play audio file');
    }
  }

  /**
   * Plays audio with a fallback to Web Speech API if no URL is provided
   * @param audioUrl - Optional audio URL from database
   * @param text - Text to speak if no audio URL
   * @param language - Language code for speech synthesis
   */
  static async playAudioWithFallback(
    audioUrl: string | undefined,
    text: string,
    language: string = 'da-DK',
  ): Promise<void> {
    if (audioUrl) {
      try {
        await this.playAudioFromDatabase(audioUrl);
        return;
      } catch (error) {
        console.warn('⚠️ Database audio failed, falling back to TTS:', error);
      }
    }

    // Fallback to Web Speech API
    return this.playTextToSpeech(text, language);
  }

  /**
   * Plays text using Web Speech API (fallback)
   * @param text - Text to speak
   * @param language - Language code
   */
  static async playTextToSpeech(
    text: string,
    language: string = 'da-DK',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported in this browser'));
        return;
      }

      // Stop any currently playing audio first
      this.stopCurrentAudio();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8; // Slightly slower for learning
      utterance.pitch = 1.0;

      utterance.onend = () => {
        console.log('🔊 Text-to-speech completed');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Text-to-speech error:', event);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      speechSynthesis.speak(utterance);
      console.log('🗣️ Text-to-speech started for:', text);
    });
  }

  /**
   * Stops any currently playing audio
   */
  static stopCurrentAudio(): void {
    if (this.currentAudio) {
      console.log('⏹️ Stopping current audio');
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Also stop speech synthesis if active
    if ('speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
  }

  /**
   * Check if audio is currently playing
   */
  static isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
