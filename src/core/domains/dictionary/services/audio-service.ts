/**
 * Audio Service for playing database audio files
 * Improved error handling with Promise-based approach
 * NO Web Speech API fallback - only plays actual audio files from database
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
   * Stops any currently playing audio
   */
  static stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      console.log('⏹️ Audio stopped');
    }
  }

  /**
   * Checks if audio is currently playing
   */
  static isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }
}
