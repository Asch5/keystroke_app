/**
 * Audio Service for playing database audio files
 * Handles playing real audio files from the database instead of using Web Speech API
 */

export class AudioService {
  private static currentAudio: HTMLAudioElement | null = null;

  /**
   * Plays audio from database URL
   * @param audioUrl - The audio file URL from the database
   * @returns Promise that resolves when audio starts playing or rejects on error
   */
  static async playAudioFromDatabase(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Validate URL
        if (!audioUrl || typeof audioUrl !== 'string') {
          reject(new Error('Invalid audio URL provided'));
          return;
        }

        console.log('Attempting to play audio from:', audioUrl);

        // Check if it's an external URL that needs proxying
        let finalAudioUrl = audioUrl;
        try {
          const url = new URL(audioUrl);
          const isExternalUrl = !url.hostname.includes(
            window.location.hostname,
          );

          if (isExternalUrl) {
            // Use proxy for external URLs to avoid CORS issues
            finalAudioUrl = `/api/audio/proxy?url=${encodeURIComponent(audioUrl)}`;
            console.log('Using proxy for external URL:', finalAudioUrl);
          }
        } catch (urlError) {
          console.warn('Could not parse URL, using as-is:', urlError);
        }

        // Stop any currently playing audio
        this.stopCurrentAudio();

        // Create new audio element
        const audio = new Audio();
        audio.src = finalAudioUrl;
        audio.preload = 'auto';

        // Add crossOrigin attribute for external URLs
        audio.crossOrigin = 'anonymous';

        // Set timeout for loading
        const timeoutId = setTimeout(() => {
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('error', onError);
          audio.removeEventListener('loadeddata', onLoadedData);
          reject(new Error('Audio loading timeout - file may be inaccessible'));
        }, 15000); // Increased to 15 seconds for external URLs

        const cleanup = () => {
          clearTimeout(timeoutId);
        };

        // Try multiple events to ensure compatibility
        const onCanPlayThrough = () => {
          cleanup();
          audio.removeEventListener('error', onError);
          audio.removeEventListener('loadeddata', onLoadedData);

          console.log('Audio ready to play');
          audio
            .play()
            .then(() => {
              this.currentAudio = audio;
              console.log('Audio playback started successfully');
              resolve();
            })
            .catch((error) => {
              console.error('Error during audio.play():', error);
              reject(new Error(`Playback failed: ${error.message}`));
            });
        };

        const onLoadedData = () => {
          // Fallback if canplaythrough doesn't fire
          if (!audio.readyState || audio.readyState < 2) {
            return;
          }

          console.log('Audio data loaded, attempting playback');
          cleanup();
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('error', onError);

          audio
            .play()
            .then(() => {
              this.currentAudio = audio;
              console.log('Audio playback started via loadeddata');
              resolve();
            })
            .catch((error) => {
              console.error('Error during audio.play() via loadeddata:', error);
              reject(new Error(`Playback failed: ${error.message}`));
            });
        };

        const onError = (event: Event) => {
          cleanup();
          audio.removeEventListener('canplaythrough', onCanPlayThrough);
          audio.removeEventListener('loadeddata', onLoadedData);

          console.error('Audio loading error:', event);
          console.error('Audio error details:', {
            error: audio.error,
            networkState: audio.networkState,
            readyState: audio.readyState,
            src: audio.src,
          });

          let errorMessage = 'Failed to load audio file';
          if (audio.error) {
            switch (audio.error.code) {
              case 1:
                errorMessage = 'Audio loading was aborted';
                break;
              case 2:
                errorMessage =
                  'Network error while loading audio - this may be a CORS issue with external audio files';
                break;
              case 3:
                errorMessage = 'Audio file is corrupted or invalid format';
                break;
              case 4:
                errorMessage = 'Audio format not supported';
                break;
              default:
                errorMessage = `Audio error (code: ${audio.error.code})`;
            }
          }

          reject(new Error(errorMessage));
        };

        // Set up event listeners
        audio.addEventListener('canplaythrough', onCanPlayThrough, {
          once: true,
        });
        audio.addEventListener('loadeddata', onLoadedData, { once: true });
        audio.addEventListener('error', onError, { once: true });

        audio.addEventListener('ended', () => {
          // Clean up when audio finishes
          this.currentAudio = null;
          console.log('Audio playback completed');
        });

        // Start loading the audio
        audio.load();
      } catch (error) {
        console.error('Error setting up audio element:', error);
        reject(
          new Error(
            `Setup failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.warn('Database audio failed, falling back to TTS:', error);
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
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any currently playing audio
      this.stopCurrentAudio();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.8;

      // Adjust pitch based on context
      utterance.pitch = 1.0;

      utterance.onstart = () => resolve();
      utterance.onerror = (event) =>
        reject(new Error(`Speech error: ${event.error}`));

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stops any currently playing audio
   */
  static stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Checks if audio is currently playing
   */
  static isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
