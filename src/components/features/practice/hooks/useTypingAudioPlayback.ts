'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import {
  debugLog,
  infoLog,
  warnLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

/**
 * Custom hook for audio playback in typing practice
 * NO Web Speech API fallback - only plays actual audio files from database
 */
export function useTypingAudioPlayback() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  /**
   * Play word audio automatically after word submission/skip
   * @param word - The word text for display purposes
   * @param audioUrl - Audio URL from database
   * @param isCorrect - Whether the word was typed correctly
   */
  const playWordAudio = useCallback(
    async (word: string, audioUrl: string | undefined, isCorrect: boolean) => {
      void debugLog('🎵 Attempting to play audio for word:', {
        word,
        audioUrl,
        isCorrect,
      });

      // Check if audio is available in database
      if (!audioUrl) {
        void warnLog('⚠️ No audio URL provided for word:', { word });
        toast.info('🔇 No audio available for this word', {
          description: 'Audio will be added to the database when available',
          duration: 2000,
        });
        return;
      }

      setIsPlayingAudio(true);

      try {
        void infoLog('🔊 Playing audio from database...');
        await AudioService.playAudioFromDatabase(audioUrl);
        void infoLog('✅ Audio playback successful for word:', { word });

        // Add visual feedback
        void infoLog('🎯 Audio played for answer type:', {
          word,
          isCorrect,
          answerType: isCorrect ? 'correct' : 'incorrect',
        });
      } catch (error) {
        await errorLog(
          '❌ Database audio playback failed for word',
          `${word}: ${error instanceof Error ? error.message : String(error)}`,
        );

        // NO FALLBACK - only notify user that audio is not available
        toast.error('🔇 Could not play audio', {
          description: 'Audio file not available or failed to load',
          duration: 3000,
        });
      } finally {
        // Add a small delay to ensure audio has time to start before clearing the flag
        setTimeout(() => {
          setIsPlayingAudio(false);
        }, 500);
      }
    },
    [],
  );

  /**
   * Stop any currently playing audio
   */
  const stopAudio = useCallback(async () => {
    try {
      AudioService.stopCurrentAudio();
      setIsPlayingAudio(false);
    } catch (error) {
      await errorLog(
        'Error stopping audio',
        error instanceof Error ? error.message : String(error),
      );
    }
  }, []);

  return {
    isPlayingAudio,
    playWordAudio,
    stopAudio,
  };
}
