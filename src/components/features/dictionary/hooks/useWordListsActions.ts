import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  addListToUserCollection,
  addPublicUserListToCollection,
  removeListFromUserCollection,
  createCustomUserList,
  updateUserList,
  type UserListWithDetails,
} from '@/core/domains/dictionary';
import { errorLog } from '@/core/infrastructure/monitoring/clientLogger';
import { LanguageCode, DifficultyLevel } from '@/core/types';

interface UseWordListsActionsProps {
  userId: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
  loadUserLists: () => Promise<void>;
  loadPublicLists: () => Promise<void>;
  loadPublicUserLists: () => Promise<void>;
  setIsCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingList: React.Dispatch<
    React.SetStateAction<UserListWithDetails | null>
  >;
}

export function useWordListsActions({
  userId,
  userLanguages,
  loadUserLists,
  loadPublicLists,
  loadPublicUserLists,
  setIsCreateDialogOpen,
  setEditingList,
}: UseWordListsActionsProps) {
  const [isPending, setIsPending] = useState(false);
  /**
   * Add public list to user collection
   */
  const handleAddToCollection = useCallback(
    async (listId: string) => {
      setIsPending(true);
      try {
        const result = await addListToUserCollection(
          userId,
          listId,
          userLanguages,
        );

        if (result.success) {
          toast.success(result.message);
          await Promise.all([loadUserLists(), loadPublicLists()]);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error adding list to collection',
          error instanceof Error ? error.message : String(error),
        );
        toast.error(
          error instanceof Error ? error.message : 'Failed to add list',
        );
      } finally {
        setIsPending(false);
      }
    },
    [userId, userLanguages, loadUserLists, loadPublicLists],
  );

  /**
   * Add public user list to collection
   */
  const handleAddPublicUserListToCollection = useCallback(
    async (publicUserListId: string) => {
      try {
        const result = await addPublicUserListToCollection(
          userId,
          publicUserListId,
          userLanguages,
        );

        if (result.success) {
          toast.success(result.message);
          await Promise.all([loadUserLists(), loadPublicUserLists()]);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error adding public user list to collection',
          error instanceof Error ? error.message : String(error),
        );
        toast.error(
          error instanceof Error ? error.message : 'Failed to add list',
        );
      } finally {
      }
    },
    [userId, userLanguages, loadUserLists, loadPublicUserLists],
  );

  /**
   * Remove list from user collection
   */
  const handleRemoveFromCollection = useCallback(
    async (userListId: string) => {
      try {
        const result = await removeListFromUserCollection(userId, userListId);

        if (result.success) {
          toast.success(result.message);
          await Promise.all([
            loadUserLists(),
            loadPublicLists(),
            loadPublicUserLists(),
          ]);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error removing list from collection',
          error instanceof Error ? error.message : String(error),
        );
        toast.error(
          error instanceof Error ? error.message : 'Failed to remove list',
        );
      } finally {
      }
    },
    [userId, loadUserLists, loadPublicLists, loadPublicUserLists],
  );

  /**
   * Create custom user list
   */
  const handleCreateList = useCallback(
    async (data: {
      name: string;
      description?: string;
      difficulty?: DifficultyLevel;
      coverImageUrl?: string;
    }) => {
      try {
        const result = await createCustomUserList(userId, {
          ...data,
          targetLanguageCode: userLanguages.target,
        });

        if (result.success) {
          toast.success(result.message);
          setIsCreateDialogOpen(false);
          await loadUserLists();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error creating list',
          error instanceof Error ? error.message : String(error),
        );
        toast.error(
          error instanceof Error ? error.message : 'Failed to create list',
        );
      } finally {
      }
    },
    [userId, userLanguages.target, loadUserLists, setIsCreateDialogOpen],
  );

  /**
   * Update user list
   */
  const handleUpdateList = useCallback(
    async (
      userListId: string,
      data: {
        customName?: string;
        customDescription?: string;
        customDifficulty?: DifficultyLevel;
        customCoverImageUrl?: string;
      },
    ) => {
      try {
        const result = await updateUserList(userId, userListId, data);

        if (result.success) {
          toast.success(result.message);
          setEditingList(null);
          await loadUserLists();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        await errorLog(
          'Error updating list',
          error instanceof Error ? error.message : String(error),
        );
        toast.error(
          error instanceof Error ? error.message : 'Failed to update list',
        );
      } finally {
      }
    },
    [userId, loadUserLists, setEditingList],
  );

  return {
    isPending,
    handleAddToCollection,
    handleAddPublicUserListToCollection,
    handleRemoveFromCollection,
    handleCreateList,
    handleUpdateList,
  };
}
