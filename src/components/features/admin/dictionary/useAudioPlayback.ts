import { useState } from 'react';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

/**
 * Custom hook for managing audio playback state and functionality in admin context
 * Ensures only one audio file plays at a time and handles errors gracefully
 * Updated to use AudioService for consistent blob storage and proxy handling
 */
export function useAdminAudioPlayback() {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const playAudio = async (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      AudioService.stopCurrentAudio();
      return;
    }

    try {
      setPlayingAudio(audioUrl);
      await AudioService.playAudioFromDatabase(audioUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  const stopAudio = () => {
    setPlayingAudio(null);
    AudioService.stopCurrentAudio();
  };

  const isPlaying = (audioUrl: string) => playingAudio === audioUrl;

  return {
    playingAudio,
    playAudio,
    stopAudio,
    isPlaying,
  };
}
