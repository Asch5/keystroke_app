/**
 * Audio Service for playing database audio files
 * Improved error handling with Promise-based approach
 */

export class AudioService {
  private static currentAudio: HTMLAudioElement | null = null;

  /**
   * Plays audio from database URL
   * @param audioUrl - The audio file URL from the database
   * @returns Promise that resolves when audio starts playing or rejects on error
   */
  static async playAudioFromDatabase(audioUrl: string): Promise<void> {
    // Validate URL
    if (!audioUrl || typeof audioUrl !== 'string') {
      throw new Error('Invalid audio URL provided');
    }

    console.log('🎵 Attempting to play audio from:', audioUrl);

    // Check if we need to use proxy for external URLs
    let finalAudioUrl = audioUrl;
    try {
      const url = new URL(audioUrl);
      const isVercelBlob = url.hostname.includes('blob.vercel-storage.com');
      const isLocalhost =
        url.hostname.includes('localhost') ||
        url.hostname.includes('127.0.0.1');
      const isSameOrigin = url.hostname === window.location.hostname;

      // Only use proxy for truly external URLs (not Vercel Blob Storage)
      const needsProxy = !isVercelBlob && !isLocalhost && !isSameOrigin;

      if (needsProxy) {
        // Use proxy for external URLs like static.ordnet.dk
        finalAudioUrl = `/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
        console.log('🔄 Using proxy for external URL');
      } else if (isVercelBlob) {
        console.log('☁️ Playing directly from Vercel Blob Storage');
      } else {
        console.log('🏠 Playing from same origin or localhost');
      }
    } catch {
      // If URL parsing fails, use original URL
      console.warn('⚠️ Could not parse URL, using as-is');
    }

    // Stop any currently playing audio
    this.stopCurrentAudio();

    return new Promise((resolve, reject) => {
      try {
        // Create new audio element
        const audio = new Audio(finalAudioUrl);

        // Set up event handlers with proper Promise resolution
        audio.onloadstart = () => {
          console.log('📥 Audio loading started');
        };

        audio.oncanplay = () => {
          console.log('🎵 Audio ready to play');
        };

        audio.onplay = () => {
          this.currentAudio = audio;
          console.log('🔊 Audio playback started successfully');
          resolve();
        };

        audio.onended = () => {
          this.currentAudio = null;
          console.log('🏁 Audio playback completed');
        };

        audio.onerror = () => {
          this.currentAudio = null;
          const error = audio.error;

          let errorMessage = 'Audio playback failed';
          if (error) {
            switch (error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Audio loading was aborted';
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error while loading audio';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Audio format not supported or corrupted';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Audio source not supported';
                break;
              default:
                errorMessage = 'Unknown audio error occurred';
            }
          }

          reject(new Error(errorMessage));
        };

        audio.onabort = () => {
          this.currentAudio = null;
          reject(new Error('Audio loading was aborted'));
        };

        // Try to play the audio
        audio.play().catch((playError) => {
          this.currentAudio = null;

          // Provide user-friendly error messages based on play() promise rejection
          if (playError.name === 'NotAllowedError') {
            reject(
              new Error(
                'Audio playback was prevented by browser policy. Please interact with the page first.',
              ),
            );
          } else if (playError.name === 'NotSupportedError') {
            reject(new Error('Audio format not supported by your browser'));
          } else if (playError.name === 'AbortError') {
            reject(new Error('Audio loading was aborted'));
          } else {
            reject(
              new Error(
                `Failed to play audio: ${playError.message || 'Unknown error'}`,
              ),
            );
          }
        });
      } catch (error) {
        reject(
          new Error(
            `Audio service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        );
      }
    });
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
