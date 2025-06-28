/**
 * GameSoundService - Handles typing practice feedback sounds
 *
 * Features:
 * - Static audio file playback (error.mp3, success.mp3, keystroke.mp3)
 * - Web Audio API fallback for programmatic sound generation
 * - Volume control and muting capabilities
 * - Performance optimized with sound caching
 */

interface GameSoundConfig {
  volume: number; // 0.0 to 1.0
  enabled: boolean;
  useStaticFiles: boolean;
}

type SoundType = 'error' | 'success' | 'keystroke';

class GameSoundService {
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private config: GameSoundConfig = {
    volume: 0.5,
    enabled: true,
    useStaticFiles: true,
  };

  /**
   * Initialize the service and preload sound files
   */
  async initialize(config?: Partial<GameSoundConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      return;
    }

    // Initialize Web Audio Context for fallbacks
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }

    // Preload static sound files if enabled
    if (this.config.useStaticFiles) {
      await this.preloadSounds();
    }
  }

  /**
   * Preload static sound files with error handling
   */
  private async preloadSounds(): Promise<void> {
    const soundFiles: Array<{ type: SoundType; path: string }> = [
      { type: 'error', path: '/sounds/error.mp3' },
      { type: 'success', path: '/sounds/success.mp3' },
      { type: 'keystroke', path: '/sounds/keystroke.mp3' },
    ];

    for (const { type, path } of soundFiles) {
      try {
        const audio = new Audio(path);
        audio.volume = this.config.volume;
        audio.preload = 'auto';

        // Test if file exists and is loadable
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => resolve(), {
            once: true,
          });
          audio.addEventListener('error', reject, { once: true });
          audio.load();
        });

        this.audioCache.set(type, audio);
        console.log(`✅ Loaded game sound: ${type}`);
      } catch (error) {
        console.warn(`⚠️ Failed to load sound file for ${type}:`, error);
        // Will fall back to Web Audio API
      }
    }
  }

  /**
   * Play error sound - for wrong letters/mistakes
   */
  async playError(): Promise<void> {
    if (!this.config.enabled) return;

    const cachedAudio = this.audioCache.get('error');
    if (cachedAudio) {
      try {
        cachedAudio.currentTime = 0; // Reset to start
        await cachedAudio.play();
        return;
      } catch (error) {
        console.warn('Failed to play cached error sound:', error);
      }
    }

    // Fallback to generated tone
    this.generateErrorTone();
  }

  /**
   * Play success sound - for correct word completion
   */
  async playSuccess(): Promise<void> {
    if (!this.config.enabled) return;

    const cachedAudio = this.audioCache.get('success');
    if (cachedAudio) {
      try {
        cachedAudio.currentTime = 0; // Reset to start
        await cachedAudio.play();
        return;
      } catch (error) {
        console.warn('Failed to play cached success sound:', error);
      }
    }

    // Fallback to generated tone
    this.generateSuccessTone();
  }

  /**
   * Play keystroke sound - for typing feedback (optional)
   */
  async playKeystroke(): Promise<void> {
    if (!this.config.enabled) return;

    const cachedAudio = this.audioCache.get('keystroke');
    if (cachedAudio) {
      try {
        cachedAudio.currentTime = 0; // Reset to start
        await cachedAudio.play();
        return;
      } catch (error) {
        console.warn('Failed to play cached keystroke sound:', error);
      }
    }

    // Fallback to generated click
    this.generateKeystrokeTone();
  }

  /**
   * Generate error tone using Web Audio API
   * Low-pitched buzz/beep
   */
  private generateErrorTone(): void {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Low-pitched buzz
      oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime); // A3
      oscillator.type = 'sawtooth'; // Harsh sound for errors

      // Envelope: quick attack, moderate decay
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        this.config.volume * 0.3,
        this.audioContext.currentTime + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + 0.25,
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.25);
    } catch (error) {
      console.warn('Failed to generate error tone:', error);
    }
  }

  /**
   * Generate success tone using Web Audio API
   * Pleasant chime/ding
   */
  private generateSuccessTone(): void {
    if (!this.audioContext) return;

    try {
      // Create a simple major chord
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      const duration = 0.6;

      frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.setValueAtTime(
          freq,
          this.audioContext!.currentTime,
        );
        oscillator.type = 'sine'; // Clean, pleasant tone

        // Staggered start for chord effect
        const startTime = this.audioContext!.currentTime + index * 0.05;

        // Envelope: quick attack, slow decay
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(
          this.config.volume * 0.15,
          startTime + 0.05,
        );
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.warn('Failed to generate success tone:', error);
    }
  }

  /**
   * Generate keystroke sound using Web Audio API
   * Brief click/tap
   */
  private generateKeystrokeTone(): void {
    if (!this.audioContext) return;

    try {
      const bufferSize = this.audioContext.sampleRate * 0.05; // 50ms
      const buffer = this.audioContext.createBuffer(
        1,
        bufferSize,
        this.audioContext.sampleRate,
      );
      const data = buffer.getChannelData(0);

      // Generate brief white noise burst
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.1; // Low volume white noise
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Quick fade envelope
      gainNode.gain.setValueAtTime(
        this.config.volume * 0.2,
        this.audioContext.currentTime,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + 0.05,
      );

      source.start();
    } catch (error) {
      console.warn('Failed to generate keystroke tone:', error);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<GameSoundConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update volume for cached audio files
    this.audioCache.forEach((audio) => {
      audio.volume = this.config.volume;
    });
  }

  /**
   * Enable/disable all game sounds
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Set volume for all game sounds
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach((audio) => {
      audio.volume = this.config.volume;
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Export singleton instance
export const gameSoundService = new GameSoundService();
