import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  toggleWordFavorite,
  updateWordLearningStatus,
  removeWordFromUserDictionary,
} from '@/core/domains/user/actions/user-dictionary-actions';
import { LearningStatus } from '@prisma/client';

/**
 * Custom hook for managing dictionary word actions
 *
 * Handles all word-related actions like favorites, status updates,
 * removal, and dialog state management
 */
export function useDictionaryActions(userId: string, onRefresh: () => void) {
  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    wordId: string;
    wordText: string;
  }>({ open: false, wordId: '', wordText: '' });

  const [addToListDialog, setAddToListDialog] = useState<{
    open: boolean;
    wordText: string;
    definitionId: string;
  }>({ open: false, wordText: '', definitionId: '' });

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    async (wordId: string) => {
      try {
        const result = await toggleWordFavorite(userId, wordId);
        if ('success' in result && result.success) {
          toast.success('Favorite status updated');
          onRefresh();
        } else {
          toast.error('Failed to update favorite status');
        }
      } catch (error) {
        console.error('Error toggling favorite:', error);
        toast.error('Failed to update favorite status');
      }
    },
    [userId, onRefresh],
  );

  // Handle learning status update
  const handleStatusUpdate = useCallback(
    async (wordId: string, newStatus: LearningStatus) => {
      try {
        const result = await updateWordLearningStatus(
          userId,
          wordId,
          newStatus,
        );
        if ('success' in result && result.success) {
          toast.success('Learning status updated');
          onRefresh();
        } else {
          toast.error('Failed to update learning status');
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update learning status');
      }
    },
    [userId, onRefresh],
  );

  // Handle word removal
  const handleRemoveWord = useCallback((wordId: string, wordText: string) => {
    setDeleteDialog({ open: true, wordId, wordText });
  }, []);

  const confirmRemoveWord = useCallback(async () => {
    try {
      const result = await removeWordFromUserDictionary(
        userId,
        deleteDialog.wordId,
      );
      if ('success' in result && result.success) {
        toast.success('Word removed from dictionary');
        onRefresh();
      } else {
        toast.error('Failed to remove word');
      }
    } catch (error) {
      console.error('Error removing word:', error);
      toast.error('Failed to remove word');
    } finally {
      setDeleteDialog({ open: false, wordId: '', wordText: '' });
    }
  }, [userId, deleteDialog.wordId, onRefresh]);

  // Handle add to list
  const handleAddToList = useCallback(
    (wordText: string, userDictionaryId: string) => {
      setAddToListDialog({
        open: true,
        wordText,
        definitionId: userDictionaryId,
      });
    },
    [],
  );

  const handleWordAddedToList = useCallback(
    (listName: string) => {
      toast.success(`Word added to "${listName}"`);
      onRefresh();
    },
    [onRefresh],
  );

  // Dialog handlers
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({ open: false, wordId: '', wordText: '' });
  }, []);

  const closeAddToListDialog = useCallback(() => {
    setAddToListDialog({ open: false, wordText: '', definitionId: '' });
  }, []);

  return {
    // Dialog states
    deleteDialog,
    addToListDialog,

    // Action handlers
    handleToggleFavorite,
    handleStatusUpdate,
    handleRemoveWord,
    confirmRemoveWord,
    handleAddToList,
    handleWordAddedToList,

    // Dialog handlers
    closeDeleteDialog,
    closeAddToListDialog,
  };
}
