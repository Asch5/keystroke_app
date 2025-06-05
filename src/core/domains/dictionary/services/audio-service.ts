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
        // Stop any currently playing audio
        this.stopCurrentAudio();

        // Create new audio element
        const audio = new HTMLAudioElement();
        audio.src = audioUrl;
        audio.preload = 'auto';

        // Set up event listeners
        audio.addEventListener('canplaythrough', () => {
          // Audio is ready to play
          audio
            .play()
            .then(() => {
              this.currentAudio = audio;
              resolve();
            })
            .catch((error) => {
              console.error('Error playing audio:', error);
              reject(error);
            });
        });

        audio.addEventListener('error', (error) => {
          console.error('Error loading audio:', error);
          reject(new Error('Failed to load audio file'));
        });

        audio.addEventListener('ended', () => {
          // Clean up when audio finishes
          this.currentAudio = null;
        });

        // Start loading the audio
        audio.load();
      } catch (error) {
        console.error('Error setting up audio:', error);
        reject(error);
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
