import { useState, useTransition, useCallback } from 'react';
import { toast } from 'sonner';
import {
  removeWordFromUserList,
  populateInheritedListWithWords,
} from '@/core/domains/dictionary/actions/user-list-actions';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import {
  debugLog,
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';
import type { RemoveDialogState, AddWordsDialogState } from '../types';

interface UseListDetailActionsProps {
  userId: string;
  listId: string;
  loadData: () => Promise<void>;
}

interface UseListDetailActionsReturn {
  // Audio state
  isPlayingAudio: boolean;
  playingWordId: string | null;

  // Dialog state
  removeDialog: RemoveDialogState;
  addWordsDialog: AddWordsDialogState;
  isPending: boolean;

  // Actions
  playWordAudio: (
    word: string,
    audioUrl: string | null,
    wordId: string,
  ) => Promise<void>;
  handleRemoveFromList: () => Promise<void>;
  handlePopulateList: () => Promise<void>;
  setRemoveDialog: (state: RemoveDialogState) => void;
  setAddWordsDialog: (state: AddWordsDialogState) => void;
}

/**
 * Custom hook for managing list detail actions
 * Handles word removal, audio playback, and list population
 */
export function useListDetailActions({
  userId,
  listId,
  loadData,
}: UseListDetailActionsProps): UseListDetailActionsReturn {
  const [isPending, startTransition] = useTransition();

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Dialog state
  const [removeDialog, setRemoveDialog] = useState<RemoveDialogState>({
    open: false,
    wordId: '',
    wordText: '',
    userDictionaryId: '',
  });

  const [addWordsDialog, setAddWordsDialog] = useState<AddWordsDialogState>({
    open: false,
  });

  // Play word audio from database only (no fallback)
  const playWordAudio = useCallback(
    async (word: string, audioUrl: string | null, wordId: string) => {
      // Debug logging
      await debugLog('🔊 Audio playback requested:', {
        word,
        audioUrl,
        wordId,
        urlType: typeof audioUrl,
        urlLength: audioUrl?.length,
      });

      // Check if audio is available in database
      if (!audioUrl) {
        await infoLog('❌ No audio URL provided');
        toast.error('🔇 No audio available for this word', {
          description: 'Audio will be added to the database soon',
          duration: 3000,
        });
        return;
      }

      if (isPlayingAudio && playingWordId === wordId) {
        // Stop if already playing this word
        await infoLog('⏹️ Stopping current audio playback');
        setIsPlayingAudio(false);
        setPlayingWordId(null);
        return;
      }

      setIsPlayingAudio(true);
      setPlayingWordId(wordId);

      try {
        await infoLog('🎵 Starting audio playback via AudioService');
        await AudioService.playAudioFromDatabase(audioUrl);
        await infoLog('✅ Audio playback completed successfully');
      } catch (error) {
        await errorLog(
          '❌ Audio playback failed',
          error instanceof Error ? error.message : String(error),
        );
        toast.error('Failed to play audio', {
          description: 'There was an issue playing the audio file',
          duration: 3000,
        });
      } finally {
        setIsPlayingAudio(false);
        setPlayingWordId(null);
      }
    },
    [isPlayingAudio, playingWordId],
  );

  // Handle remove word from list
  const handleRemoveFromList = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await removeWordFromUserList(
          userId,
          listId,
          removeDialog.userDictionaryId,
        );

        if (result.success) {
          toast.success(result.message);
          await loadData();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error removing word from list',
          error instanceof Error ? error.message : String(error),
        );
        toast.error('Failed to remove word from list');
      } finally {
        setRemoveDialog({
          open: false,
          wordId: '',
          wordText: '',
          userDictionaryId: '',
        });
      }
    });
  }, [userId, listId, removeDialog.userDictionaryId, loadData]);

  // Handle populate inherited list with words
  const handlePopulateList = useCallback(async () => {
    startTransition(async () => {
      try {
        const result = await populateInheritedListWithWords(userId, listId);
        if (result.success) {
          toast.success(result.message);
          await loadData();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error populating list',
          error instanceof Error ? error.message : String(error),
        );
        toast.error('Failed to populate list');
      }
    });
  }, [userId, listId, loadData]);

  return {
    // Audio state
    isPlayingAudio,
    playingWordId,

    // Dialog state
    removeDialog,
    addWordsDialog,
    isPending,

    // Actions
    playWordAudio,
    handleRemoveFromList,
    handlePopulateList,
    setRemoveDialog,
    setAddWordsDialog,
  };
}
