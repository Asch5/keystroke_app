'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';

/**
 * Custom hook for audio playback functionality
 *
 * Extracted from MyDictionaryContent to improve component modularity
 * Handles audio state management and playback logic
 */
export function useAudioPlayback() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Play word audio from database only (no fallback)
  const playWordAudio = useCallback(
    async (word: string, audioUrl: string | null, wordId: string) => {
      // Debug logging
      console.log('🔊 Audio playback requested:', {
        word,
        audioUrl,
        wordId,
        urlType: typeof audioUrl,
        urlLength: audioUrl?.length,
      });

      // Check if audio is available in database
      if (!audioUrl) {
        console.log('❌ No audio URL provided');
        toast.error('🔇 No audio available for this word', {
          description: 'Audio will be added to the database soon',
          duration: 3000,
        });
        return;
      }

      if (isPlayingAudio && playingWordId === wordId) {
        // Stop if already playing this word
        console.log('⏹️ Stopping current audio playback');
        setIsPlayingAudio(false);
        setPlayingWordId(null);
        return;
      }

      setIsPlayingAudio(true);
      setPlayingWordId(wordId);

      try {
        console.log('🎵 Attempting to play audio from URL:', audioUrl);
        // Only play from database - no fallback
        await AudioService.playAudioFromDatabase(audioUrl);
        console.log('✅ Audio playback successful');
        toast.success('🔊 Playing pronunciation', { duration: 2000 });
      } catch (error) {
        console.error('❌ Database audio playback failed:', error);
        console.error('Error details:', {
          error,
          audioUrl,
          word,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        // More specific error message based on the error
        let errorDescription = 'Please try again or contact support';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorDescription =
              'Audio file is taking too long to load. Check your internet connection.';
          } else if (
            error.message.includes('Network error') ||
            error.message.includes('proxy')
          ) {
            errorDescription =
              'Network error while loading audio. The external audio file may be temporarily unavailable.';
          } else if (
            error.message.includes('not supported') ||
            error.message.includes('format')
          ) {
            errorDescription =
              'Audio format not supported by your browser. Try using Chrome or Firefox.';
          } else if (
            error.message.includes('corrupted') ||
            error.message.includes('invalid')
          ) {
            errorDescription = 'Audio file appears to be corrupted or invalid.';
          } else if (
            error.message.includes('browser policy') ||
            error.message.includes('NotAllowedError')
          ) {
            errorDescription =
              'Browser prevented audio playback. Try clicking the audio button again.';
          }
        }

        toast.error('Failed to play audio from database', {
          description: errorDescription,
          duration: 4000,
        });
      } finally {
        setIsPlayingAudio(false);
        setPlayingWordId(null);
      }
    },
    [isPlayingAudio, playingWordId],
  );

  return {
    isPlayingAudio,
    playingWordId,
    playWordAudio,
  };
}
