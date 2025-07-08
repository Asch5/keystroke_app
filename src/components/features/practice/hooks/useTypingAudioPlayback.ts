'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

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
      console.log('🎵 Attempting to play audio for word:', word, {
        audioUrl,
        isCorrect,
      });

      // Check if audio is available in database
      if (!audioUrl) {
        console.warn('⚠️ No audio URL provided for word:', word);
        toast.info('🔇 No audio available for this word', {
          description: 'Audio will be added to the database when available',
          duration: 2000,
        });
        return;
      }

      setIsPlayingAudio(true);

      try {
        console.log('🔊 Playing audio from database...');
        await AudioService.playAudioFromDatabase(audioUrl);
        console.log('✅ Audio playback successful for word:', word);

        // Add visual feedback
        console.log(
          '🎯 Audio played for',
          isCorrect ? 'correct' : 'incorrect',
          'answer',
        );
      } catch (error) {
        console.error(
          '❌ Database audio playback failed for word:',
          word,
          error,
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
      console.error('Error stopping audio:', error);
    }
  }, []);

  return {
    isPlayingAudio,
    playWordAudio,
    stopAudio,
  };
}
