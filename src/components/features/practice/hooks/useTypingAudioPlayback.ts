'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

/**
 * Custom hook for audio playback in typing practice
 * Follows the established pattern from other audio hooks in the app
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
        toast.error('🔇 No audio available for this word', {
          description: 'Audio will be added to the database soon',
          duration: 3000,
        });
        return;
      }

      setIsPlayingAudio(true);

      try {
        console.log('🔊 Playing audio from database...');
        await AudioService.playAudioFromDatabase(audioUrl);
        console.log('✅ Audio playback successful for word:', word);

        // Add visual feedback without additional toast spam
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

        // Try to provide a fallback using browser's speech synthesis
        try {
          console.log('🗣️ Attempting TTS fallback for word:', word);
          await AudioService.playTextToSpeech(word, 'da-DK');
          console.log('✅ TTS fallback successful');

          toast.info('🗣️ Using text-to-speech for audio', {
            description: 'Database audio not available',
            duration: 2000,
          });
        } catch (ttsError) {
          console.error('❌ TTS fallback also failed:', ttsError);
          toast.error('🔇 Could not play audio', {
            description: 'Both database audio and text-to-speech failed',
            duration: 3000,
          });
        }
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
      await AudioService.stopCurrentAudio();
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
