import { useState } from 'react';

/**
 * Custom hook for managing audio playback state and functionality
 * Ensures only one audio file plays at a time and handles errors gracefully
 */
export function useAudioPlayback() {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const playAudio = async (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      return;
    }

    try {
      const audio = new Audio(audioUrl);
      setPlayingAudio(audioUrl);

      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  const stopAudio = () => {
    setPlayingAudio(null);
  };

  const isPlaying = (audioUrl: string) => playingAudio === audioUrl;

  return {
    playingAudio,
    playAudio,
    stopAudio,
    isPlaying,
  };
}
