import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getUserLists,
  getAvailablePublicLists,
  getPublicUserLists,
  type UserListWithDetails,
  type PublicListSummary,
  type PublicUserListSummary,
  type UserListFilters,
} from '@/core/domains/dictionary';
import { LanguageCode, DifficultyLevel } from '@/core/types';
import { useWordListsActions } from './useWordListsActions';

interface UseWordListsStateProps {
  userId: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

interface UseWordListsStateReturn {
  // Data state
  userLists: UserListWithDetails[];
  publicLists: PublicListSummary[];
  publicUserLists: PublicUserListSummary[];
  isLoading: boolean;
  isPending: boolean;

  // Filter state
  userListFilters: UserListFilters;
  setUserListFilters: React.Dispatch<React.SetStateAction<UserListFilters>>;
  publicListFilters: { search: string; difficulty?: DifficultyLevel };
  setPublicListFilters: React.Dispatch<
    React.SetStateAction<{ search: string; difficulty?: DifficultyLevel }>
  >;
  discoverTab: 'official' | 'community';
  setDiscoverTab: React.Dispatch<
    React.SetStateAction<'official' | 'community'>
  >;

  // Dialog state
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editingList: UserListWithDetails | null;
  setEditingList: React.Dispatch<
    React.SetStateAction<UserListWithDetails | null>
  >;
  previewingList: PublicListSummary | null;
  setPreviewingList: React.Dispatch<
    React.SetStateAction<PublicListSummary | null>
  >;
  previewingUserList: PublicUserListSummary | null;
  setPreviewingUserList: React.Dispatch<
    React.SetStateAction<PublicUserListSummary | null>
  >;

  // Computed values
  totalDiscoverLists: number;

  // Actions
  loadUserLists: () => Promise<void>;
  loadPublicLists: () => Promise<void>;
  loadPublicUserLists: () => Promise<void>;
  loadData: () => Promise<void>;
  handleAddToCollection: (listId: string) => Promise<void>;
  handleAddPublicUserListToCollection: (
    publicUserListId: string,
  ) => Promise<void>;
  handleRemoveFromCollection: (userListId: string) => Promise<void>;
  handleCreateList: (data: {
    name: string;
    description?: string;
    difficulty?: DifficultyLevel;
    coverImageUrl?: string;
  }) => Promise<void>;
  handleUpdateList: (
    userListId: string,
    data: {
      customName?: string;
      customDescription?: string;
      customDifficulty?: DifficultyLevel;
      customCoverImageUrl?: string;
    },
  ) => Promise<void>;
}

export function useWordListsState({
  userId,
  userLanguages,
}: UseWordListsStateProps): UseWordListsStateReturn {
  // Data state
  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [publicLists, setPublicLists] = useState<PublicListSummary[]>([]);
  const [publicUserLists, setPublicUserLists] = useState<
    PublicUserListSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [discoverTab, setDiscoverTab] = useState<'official' | 'community'>(
    'official',
  );
  const [userListFilters, setUserListFilters] = useState<UserListFilters>({
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [publicListFilters, setPublicListFilters] = useState<{
    search: string;
    difficulty?: DifficultyLevel;
  }>({
    search: '',
  });

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserListWithDetails | null>(
    null,
  );
  const [previewingList, setPreviewingList] =
    useState<PublicListSummary | null>(null);
  const [previewingUserList, setPreviewingUserList] =
    useState<PublicUserListSummary | null>(null);

  // Computed values
  const totalDiscoverLists = useMemo(
    () => publicLists.length + publicUserLists.length,
    [publicLists.length, publicUserLists.length],
  );

  /**
   * Load user lists
   */
  const loadUserLists = useCallback(async () => {
    try {
      const result = await getUserLists(userId, userListFilters);
      console.log('useWordListsState - loadUserLists result:', {
        userListsCount: result.userLists.length,
        totalCount: result.totalCount,
        userLists: result.userLists.map((list) => ({
          id: list.id,
          displayName: list.displayName,
          wordCount: list.wordCount,
        })),
      });
      setUserLists(result.userLists);
    } catch (error) {
      console.error('Error loading user lists:', error);
      toast.error('Failed to load your lists');
    }
  }, [userId, userListFilters]);

  /**
   * Load public lists (official)
   */
  const loadPublicLists = useCallback(async () => {
    try {
      const filterData: { search?: string; difficulty?: DifficultyLevel } = {};
      if (publicListFilters.search) {
        filterData.search = publicListFilters.search;
      }
      if (publicListFilters.difficulty) {
        filterData.difficulty = publicListFilters.difficulty;
      }

      const result = await getAvailablePublicLists(
        userId,
        userLanguages,
        filterData,
      );
      setPublicLists(result.publicLists);
    } catch (error) {
      console.error('Error loading public lists:', error);
      toast.error('Failed to load public lists');
    }
  }, [userId, userLanguages, publicListFilters]);

  /**
   * Load public user lists (community)
   */
  const loadPublicUserLists = useCallback(async () => {
    try {
      const filterData: { search?: string; difficulty?: DifficultyLevel } = {};
      if (publicListFilters.search) {
        filterData.search = publicListFilters.search;
      }
      if (publicListFilters.difficulty) {
        filterData.difficulty = publicListFilters.difficulty;
      }

      const result = await getPublicUserLists(
        userId,
        userLanguages,
        filterData,
      );
      setPublicUserLists(result.publicUserLists);
    } catch (error) {
      console.error('Error loading public user lists:', error);
      toast.error('Failed to load community lists');
    }
  }, [userId, userLanguages, publicListFilters]);

  /**
   * Load all data
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserLists(),
        loadPublicLists(),
        loadPublicUserLists(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserLists, loadPublicLists, loadPublicUserLists]);

  // Use extracted actions hook
  const {
    isPending,
    handleAddToCollection,
    handleAddPublicUserListToCollection,
    handleRemoveFromCollection,
    handleCreateList,
    handleUpdateList,
  } = useWordListsActions({
    userId,
    userLanguages,
    loadUserLists,
    loadPublicLists,
    loadPublicUserLists,
    setIsCreateDialogOpen,
    setEditingList,
  });

  // Effects for data loading and filtering
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        loadUserLists();
      },
      userListFilters.search ? 300 : 0,
    );

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userListFilters]);

  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        if (discoverTab === 'official') {
          loadPublicLists();
        } else {
          loadPublicUserLists();
        }
      },
      publicListFilters.search ? 300 : 0,
    );

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicListFilters, discoverTab]);

  return {
    // Data state
    userLists,
    publicLists,
    publicUserLists,
    isLoading,
    isPending,

    // Filter state
    userListFilters,
    setUserListFilters,
    publicListFilters,
    setPublicListFilters,
    discoverTab,
    setDiscoverTab,

    // Dialog state
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    editingList,
    setEditingList,
    previewingList,
    setPreviewingList,
    previewingUserList,
    setPreviewingUserList,

    // Computed values
    totalDiscoverLists,

    // Actions
    loadUserLists,
    loadPublicLists,
    loadPublicUserLists,
    loadData,
    handleAddToCollection,
    handleAddPublicUserListToCollection,
    handleRemoveFromCollection,
    handleCreateList,
    handleUpdateList,
  };
}
