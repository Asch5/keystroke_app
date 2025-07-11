import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getUserLists,
  createCustomUserList,
  addWordToUserList,
  type UserListWithDetails,
} from '@/core/domains/dictionary/actions/user-list-actions';
import { errorLog } from '@/core/infrastructure/monitoring/clientLogger';
import { LanguageCode, DifficultyLevel } from '@/core/types';
import { NewListFormData } from '../types';

/**
 * Main state management hook for AddToListDialog
 * Handles all dialog state, form data, and API interactions
 */
export function useAddToListDialog(
  userId: string,
  userLanguages: { base: LanguageCode; target: LanguageCode },
  wordText: string,
  userDictionaryId: string,
  onWordAddedToList: (listName: string) => void,
  onClose: () => void,
) {
  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');

  // New list form state
  const [newListData, setNewListData] = useState<NewListFormData>({
    name: '',
    description: '',
    difficulty: '',
    coverImageUrl: '',
  });

  // Load user lists when dialog opens
  const loadUserLists = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserLists(userId);
      setUserLists(result.userLists);
    } catch (error) {
      errorLog('Error loading user lists', { error, userId });
      toast.error('Failed to load your lists');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleAddToExistingList = async () => {
    if (!selectedListId) {
      toast.error('Please select a list');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addWordToUserList(
        userId,
        selectedListId,
        userDictionaryId,
      );

      if (result.success) {
        const selectedList = userLists.find(
          (list) => list.id === selectedListId,
        );
        toast.success(
          `Word "${wordText}" added to ${selectedList?.displayName}`,
        );
        onWordAddedToList(selectedList?.displayName ?? 'list');
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      errorLog('Error adding word to list', {
        error,
        userId,
        selectedListId,
        userDictionaryId,
      });
      toast.error('Failed to add word to list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewList = async () => {
    if (!newListData.name.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData: {
        name: string;
        description?: string;
        difficulty?: DifficultyLevel;
        coverImageUrl?: string;
      } = {
        name: newListData.name.trim(),
      };

      const description = newListData.description.trim();
      if (description) {
        submissionData.description = description;
      }

      if (newListData.difficulty) {
        submissionData.difficulty = newListData.difficulty;
      }

      const coverImageUrl = newListData.coverImageUrl.trim();
      if (coverImageUrl) {
        submissionData.coverImageUrl = coverImageUrl;
      }

      const result = await createCustomUserList(userId, {
        ...submissionData,
        targetLanguageCode: userLanguages.target,
      });

      if (result.success && result.userListId) {
        // Add word to the newly created list
        const addResult = await addWordToUserList(
          userId,
          result.userListId,
          userDictionaryId,
        );

        if (addResult.success) {
          toast.success(
            `Created list "${newListData.name}" and added word "${wordText}"`,
          );
          onWordAddedToList(newListData.name);
        } else {
          toast.success(`Created list "${newListData.name}"`);
          toast.error(`Failed to add word: ${addResult.message}`);
          onWordAddedToList(newListData.name);
        }

        // Reset form
        setNewListData({
          name: '',
          description: '',
          difficulty: '',
          coverImageUrl: '',
        });

        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      errorLog('Error creating list', {
        error,
        userId,
        listName: newListData.name,
      });
      toast.error('Failed to create list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedListId('');
      setNewListData({
        name: '',
        description: '',
        difficulty: '',
        coverImageUrl: '',
      });
    }
  };

  const updateNewListData = (updates: Partial<NewListFormData>) => {
    setNewListData((prev) => ({ ...prev, ...updates }));
  };

  return {
    userLists,
    loading,
    isSubmitting,
    selectedListId,
    setSelectedListId,
    newListData,
    updateNewListData,
    loadUserLists,
    handleAddToExistingList,
    handleCreateNewList,
    handleClose,
  };
}
