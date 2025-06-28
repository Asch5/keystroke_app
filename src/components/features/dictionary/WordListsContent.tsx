'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageCode, DifficultyLevel } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  BookOpen,
  Globe,
  Loader2,
  Heart,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserLists,
  getAvailablePublicLists,
  getPublicUserLists,
  addListToUserCollection,
  addPublicUserListToCollection,
  removeListFromUserCollection,
  createCustomUserList,
  updateUserList,
  type UserListWithDetails,
  type PublicListSummary,
  type PublicUserListSummary,
  type UserListFilters,
} from '@/core/domains/dictionary';
import { CreateListDialog } from './CreateListDialog';
import { EditListDialog } from './EditListDialog';
import { PublicListPreviewDialog } from './PublicListPreviewDialog';

interface WordListsContentProps {
  userId: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: 'bg-green-100 text-green-800',
  elementary: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  proficient: 'bg-red-100 text-red-800',
};

export function WordListsContent({
  userId,
  userLanguages,
}: WordListsContentProps) {
  const router = useRouter();
  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [publicLists, setPublicLists] = useState<PublicListSummary[]>([]);
  const [publicUserLists, setPublicUserLists] = useState<
    PublicUserListSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  // Discover tab state
  const [discoverTab, setDiscoverTab] = useState<'official' | 'community'>(
    'official',
  );

  // Filter states
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

  // Memoized values to prevent unnecessary re-renders
  const totalDiscoverLists = useMemo(
    () => publicLists.length + publicUserLists.length,
    [publicLists.length, publicUserLists.length],
  );

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserListWithDetails | null>(
    null,
  );
  const [previewingList, setPreviewingList] =
    useState<PublicListSummary | null>(null);
  const [previewingUserList, setPreviewingUserList] =
    useState<PublicUserListSummary | null>(null);

  /**
   * Load user lists
   */
  const loadUserLists = useCallback(async () => {
    try {
      const result = await getUserLists(userId, userListFilters);
      console.log('WordListsContent - loadUserLists result:', {
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
  const loadPublicUserLists = async () => {
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
  };

  /**
   * Load all data
   */
  const loadData = async () => {
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
  };

  /**
   * Handle adding a public list to user collection
   */
  const handleAddToCollection = async (listId: string) => {
    // Set pending state and optimistic update
    setIsPending(true);
    setPublicLists((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, isInUserCollection: true } : list,
      ),
    );

    try {
      const result = await addListToUserCollection(
        userId,
        listId,
        userLanguages,
      );

      if (result.success) {
        toast.success(result.message);
        // Update with actual userListId from server
        if (result.userListId) {
          setPublicLists((prev) =>
            prev.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    isInUserCollection: true,
                    userListId: result.userListId,
                  }
                : list,
            ),
          );
        }
        // Refresh user lists to show the new list
        await loadUserLists();
      } else {
        // Revert optimistic update on failure
        setPublicLists((prev) =>
          prev.map((list) =>
            list.id === listId
              ? { ...list, isInUserCollection: false, userListId: undefined }
              : list,
          ),
        );
        toast.error(result.message);
      }
    } catch (error) {
      // Revert optimistic update on error
      setPublicLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? { ...list, isInUserCollection: false, userListId: undefined }
            : list,
        ),
      );
      console.error('Error adding list to collection:', error);
      toast.error('Failed to add list to collection');
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Handle removing a list from user collection
   */
  const handleRemoveFromCollection = async (userListId: string) => {
    setIsPending(true);

    // Find which list is being removed to update optimistically
    const listToRemove = publicLists.find(
      (list) => list.userListId === userListId,
    );
    const communityListToRemove = publicUserLists.find(
      (list) => list.userListId === userListId,
    );
    const userListToRemove = userLists.find((list) => list.id === userListId);

    // Optimistic updates
    if (listToRemove) {
      setPublicLists((prev) =>
        prev.map((list) =>
          list.userListId === userListId
            ? { ...list, isInUserCollection: false, userListId: undefined }
            : list,
        ),
      );
    }

    if (communityListToRemove) {
      setPublicUserLists((prev) =>
        prev.map((list) =>
          list.userListId === userListId
            ? { ...list, isInUserCollection: false, userListId: undefined }
            : list,
        ),
      );
    }

    // Remove from user lists immediately
    setUserLists((prev) => prev.filter((list) => list.id !== userListId));

    try {
      const result = await removeListFromUserCollection(userId, userListId);

      if (result.success) {
        toast.success(result.message);
        // The optimistic update is already applied, no need to refresh
      } else {
        // Revert optimistic updates on failure
        if (listToRemove) {
          setPublicLists((prev) =>
            prev.map((list) =>
              list.id === listToRemove.id
                ? { ...list, isInUserCollection: true, userListId }
                : list,
            ),
          );
        }

        if (communityListToRemove) {
          setPublicUserLists((prev) =>
            prev.map((list) =>
              list.id === communityListToRemove.id
                ? { ...list, isInUserCollection: true, userListId }
                : list,
            ),
          );
        }

        if (userListToRemove) {
          setUserLists((prev) => [...prev, userListToRemove]);
        }

        toast.error(result.message);
      }
    } catch (error) {
      // Revert optimistic updates on error
      if (listToRemove) {
        setPublicLists((prev) =>
          prev.map((list) =>
            list.id === listToRemove.id
              ? { ...list, isInUserCollection: true, userListId }
              : list,
          ),
        );
      }

      if (communityListToRemove) {
        setPublicUserLists((prev) =>
          prev.map((list) =>
            list.id === communityListToRemove.id
              ? { ...list, isInUserCollection: true, userListId }
              : list,
          ),
        );
      }

      if (userListToRemove) {
        setUserLists((prev) => [...prev, userListToRemove]);
      }

      console.error('Error removing list from collection:', error);
      toast.error('Failed to remove list from collection');
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Handle adding a public user list to collection
   */
  const handleAddPublicUserListToCollection = async (
    publicUserListId: string,
  ) => {
    setIsPending(true);

    // Optimistic update: immediately update the UI
    setPublicUserLists((prev) =>
      prev.map((list) =>
        list.id === publicUserListId
          ? { ...list, isInUserCollection: true }
          : list,
      ),
    );

    try {
      const result = await addPublicUserListToCollection(
        userId,
        publicUserListId,
        userLanguages,
      );

      if (result.success) {
        toast.success(result.message);
        // Update with actual userListId from server
        if (result.userListId) {
          setPublicUserLists((prev) =>
            prev.map((list) =>
              list.id === publicUserListId
                ? {
                    ...list,
                    isInUserCollection: true,
                    userListId: result.userListId,
                  }
                : list,
            ),
          );
        }
        // Refresh user lists to show the new list
        await loadUserLists();
      } else {
        // Revert optimistic update on failure
        setPublicUserLists((prev) =>
          prev.map((list) =>
            list.id === publicUserListId
              ? { ...list, isInUserCollection: false, userListId: undefined }
              : list,
          ),
        );
        toast.error(result.message);
      }
    } catch (error) {
      // Revert optimistic update on error
      setPublicUserLists((prev) =>
        prev.map((list) =>
          list.id === publicUserListId
            ? { ...list, isInUserCollection: false, userListId: undefined }
            : list,
        ),
      );
      console.error('Error adding community list to collection:', error);
      toast.error('Failed to add community list to collection');
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Handle creating a custom list
   */
  const handleCreateList = async (data: {
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
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    }
  };

  /**
   * Handle updating a list
   */
  const handleUpdateList = async (
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
      console.error('Error updating list:', error);
      toast.error('Failed to update list');
    }
  };

  // Load data on mount only
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for filtering user lists when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        loadUserLists();
      },
      userListFilters.search ? 300 : 0, // 300ms delay for search, immediate for other filters
    );

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userListFilters]);

  // Separate effect for filtering public lists when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        if (discoverTab === 'official') {
          loadPublicLists();
        } else {
          loadPublicUserLists();
        }
      },
      publicListFilters.search ? 300 : 0, // 300ms delay for search, immediate for other filters
    );

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicListFilters, discoverTab]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-lists" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-lists">
            My Lists ({userLists.length})
          </TabsTrigger>
          <TabsTrigger value="discover">
            Discover ({totalDiscoverLists})
          </TabsTrigger>
        </TabsList>

        {/* My Lists Tab */}
        <TabsContent value="my-lists" className="space-y-6">
          {/* My Lists Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    My Word Lists
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your personal vocabulary collections
                  </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* My Lists Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search your lists..."
                    value={userListFilters.search}
                    onChange={(e) =>
                      setUserListFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <Select
                  value={userListFilters.difficulty || 'all'}
                  onValueChange={(value) => {
                    const newFilters: UserListFilters = { ...userListFilters };
                    if (value && value !== 'all') {
                      newFilters.difficulty = value as DifficultyLevel;
                    } else {
                      delete newFilters.difficulty;
                    }
                    setUserListFilters(newFilters);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Object.entries(difficultyDisplayNames).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Select
                  value={userListFilters.sortBy || 'createdAt'}
                  onValueChange={(value) =>
                    setUserListFilters((prev) => ({
                      ...prev,
                      sortBy: value as
                        | 'name'
                        | 'createdAt'
                        | 'progress'
                        | 'wordCount',
                    }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="wordCount">Word Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* My Lists Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-48 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userLists.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No lists yet</h3>
                  <p className="text-muted-foreground mt-2 mb-6">
                    Create your first word list or discover public lists to add
                    to your collection
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create List
                    </Button>
                    <Button variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      Discover Lists
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userLists.map((list) => (
                <UserListCard
                  key={list.id}
                  list={list}
                  onEdit={() => setEditingList(list)}
                  onRemove={() => handleRemoveFromCollection(list.id)}
                  onNavigate={() =>
                    router.push(`/dashboard/dictionary/lists/${list.id}`)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Discover Lists Tab */}
        <TabsContent value="discover" className="space-y-6">
          {/* Discover Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Discover Word Lists
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Explore official lists and community-created collections
              </p>
            </CardHeader>
          </Card>

          {/* Discover Sub-tabs */}
          <Tabs
            value={discoverTab}
            onValueChange={(value) =>
              setDiscoverTab(value as 'official' | 'community')
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="official">
                Official Lists ({publicLists.length})
              </TabsTrigger>
              <TabsTrigger value="community">
                Community Lists ({publicUserLists.length})
              </TabsTrigger>
            </TabsList>

            {/* Official Lists Tab */}
            <TabsContent value="official" className="space-y-6">
              {/* Discover Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search official lists..."
                        value={publicListFilters.search}
                        onChange={(e) =>
                          setPublicListFilters((prev) => ({
                            ...prev,
                            search: e.target.value,
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    <Select
                      value={publicListFilters.difficulty || 'all'}
                      onValueChange={(value) => {
                        const newFilters = { ...publicListFilters };
                        if (value && value !== 'all') {
                          newFilters.difficulty = value as DifficultyLevel;
                        } else {
                          delete newFilters.difficulty;
                        }
                        setPublicListFilters(newFilters);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {Object.entries(difficultyDisplayNames).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Official Lists Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-48 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : publicLists.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">
                        No official lists found
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Try adjusting your search criteria or check back later
                        for new lists
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicLists.map((list) => (
                    <PublicListCard
                      key={list.id}
                      list={list}
                      onAddToCollection={() => handleAddToCollection(list.id)}
                      onRemoveFromCollection={() =>
                        list.userListId &&
                        handleRemoveFromCollection(list.userListId)
                      }
                      onPreview={() => setPreviewingList(list)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Community Lists Tab */}
            <TabsContent value="community" className="space-y-6">
              {/* Community Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search community lists..."
                        value={publicListFilters.search}
                        onChange={(e) =>
                          setPublicListFilters((prev) => ({
                            ...prev,
                            search: e.target.value,
                          }))
                        }
                        className="w-full"
                      />
                    </div>

                    <Select
                      value={publicListFilters.difficulty || 'all'}
                      onValueChange={(value) => {
                        const newFilters = { ...publicListFilters };
                        if (value && value !== 'all') {
                          newFilters.difficulty = value as DifficultyLevel;
                        } else {
                          delete newFilters.difficulty;
                        }
                        setPublicListFilters(newFilters);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {Object.entries(difficultyDisplayNames).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Community Lists Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-48 animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : publicUserLists.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">
                        No community lists found
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Be the first to share your list with the community or
                        try different search criteria
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicUserLists.map((list) => (
                    <PublicUserListCard
                      key={list.id}
                      list={list}
                      onAddToCollection={() =>
                        handleAddPublicUserListToCollection(list.id)
                      }
                      onRemoveFromCollection={() =>
                        list.userListId &&
                        handleRemoveFromCollection(list.userListId)
                      }
                      onPreview={() => setPreviewingUserList(list)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateListDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateList}
        userLanguages={userLanguages}
      />

      {editingList && (
        <EditListDialog
          list={editingList}
          isOpen={!!editingList}
          onClose={() => setEditingList(null)}
          onSubmit={(data) => handleUpdateList(editingList.id, data)}
        />
      )}

      {previewingList && (
        <PublicListPreviewDialog
          list={previewingList}
          isOpen={!!previewingList}
          onClose={() => setPreviewingList(null)}
          onAddToCollection={() => {
            handleAddToCollection(previewingList.id);
            setPreviewingList(null);
          }}
          userLanguages={userLanguages}
          isPending={isPending}
        />
      )}

      {previewingUserList && (
        <PublicListPreviewDialog
          list={{
            id: previewingUserList.id,
            name: previewingUserList.name,
            description: previewingUserList.description,
            categoryName: 'Community',
            targetLanguageCode: previewingUserList.targetLanguageCode,
            difficultyLevel: previewingUserList.difficultyLevel,
            tags: [],
            coverImageUrl: previewingUserList.coverImageUrl,
            wordCount: previewingUserList.wordCount,
            userCount: 1,
            sampleWords: previewingUserList.sampleWords,
            isInUserCollection: previewingUserList.isInUserCollection,
            userListId: previewingUserList.userListId,
          }}
          isOpen={!!previewingUserList}
          onClose={() => setPreviewingUserList(null)}
          onAddToCollection={() => {
            handleAddPublicUserListToCollection(previewingUserList.id);
            setPreviewingUserList(null);
          }}
          userLanguages={userLanguages}
          isPending={isPending}
          isUserList={true}
        />
      )}
    </div>
  );
}

/**
 * User List Card Component
 */
function UserListCard({
  list,
  onEdit,
  onRemove,
  onNavigate,
}: {
  list: UserListWithDetails;
  onEdit: () => void;
  onRemove: () => void;
  onNavigate: () => void;
}) {
  const isCustomList = !list.listId;
  const progressPercentage =
    list.wordCount > 0 ? (list.learnedWordCount / list.wordCount) * 100 : 0;

  return (
    <Card
      className="group hover:shadow-md transition-shadow cursor-pointer"
      onClick={onNavigate}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{list.displayName}</h3>
              {isCustomList && (
                <Badge variant="secondary" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Custom
                </Badge>
              )}
            </div>

            {list.displayDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {list.displayDescription}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate();
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open List
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">{list.wordCount}</div>
              <div className="text-muted-foreground">Words</div>
            </div>
            <div>
              <div className="font-medium">{list.learnedWordCount}</div>
              <div className="text-muted-foreground">Learned</div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center justify-between">
            <Badge className={difficultyColors[list.displayDifficulty]}>
              {difficultyDisplayNames[list.displayDifficulty]}
            </Badge>
            {list.sampleWords.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {list.sampleWords.join(', ')}...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Public User List Card Component
 */
function PublicUserListCard({
  list,
  onAddToCollection,
  onRemoveFromCollection,
  onPreview,
  isPending,
}: {
  list: PublicUserListSummary;
  onAddToCollection: () => void;
  onRemoveFromCollection: () => void;
  onPreview?: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{list.name}</h3>
              <Badge
                className={difficultyColors[list.difficultyLevel]}
                variant="secondary"
              >
                {difficultyDisplayNames[list.difficultyLevel]}
              </Badge>
            </div>

            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {list.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>by {list.createdBy.name}</span>
              <span>•</span>
              <span>{list.wordCount} words</span>
            </div>

            {list.sampleWords.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Sample words:
                </p>
                <div className="flex flex-wrap gap-1">
                  {list.sampleWords.slice(0, 3).map((word, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {word}
                    </Badge>
                  ))}
                  {list.sampleWords.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{list.sampleWords.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Created {new Date(list.createdAt).toLocaleDateString()}
          </div>

          <div className="space-y-2">
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Words
              </Button>
            )}

            {list.isInUserCollection ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemoveFromCollection}
                disabled={isPending}
                className="w-full text-red-600 hover:text-red-700"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Remove'
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onAddToCollection}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add to Collection'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Public List Card Component
 */
function PublicListCard({
  list,
  onAddToCollection,
  onRemoveFromCollection,
  onPreview,
  isPending,
}: {
  list: PublicListSummary;
  onAddToCollection: () => void;
  onRemoveFromCollection: () => void;
  onPreview: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium truncate">{list.name}</h3>
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            </div>

            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {list.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">{list.wordCount}</div>
              <div className="text-muted-foreground">Words</div>
            </div>
            <div>
              <div className="font-medium">{list.userCount}</div>
              <div className="text-muted-foreground">Users</div>
            </div>
          </div>

          {/* Category and Difficulty */}
          <div className="flex items-center justify-between">
            <Badge className={difficultyColors[list.difficultyLevel]}>
              {difficultyDisplayNames[list.difficultyLevel]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {list.categoryName}
            </span>
          </div>

          {/* Sample Words */}
          {list.sampleWords.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {list.sampleWords.join(', ')}...
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Words
              </Button>

              {list.isInUserCollection ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemoveFromCollection}
                  disabled={isPending}
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                  Remove from Collection
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onAddToCollection}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add to Collection
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
