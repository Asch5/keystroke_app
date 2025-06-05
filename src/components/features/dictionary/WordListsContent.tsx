'use client';

import { useState, useEffect, useTransition } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserLists,
  getAvailablePublicLists,
  addListToUserCollection,
  removeListFromUserCollection,
  createCustomUserList,
  updateUserList,
  type UserListWithDetails,
  type PublicListSummary,
  type UserListFilters,
} from '@/core/domains/dictionary';
import { CreateListDialog } from './CreateListDialog';
import { EditListDialog } from './EditListDialog';

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
  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [publicLists, setPublicLists] = useState<PublicListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<UserListWithDetails | null>(
    null,
  );

  /**
   * Load user lists
   */
  const loadUserLists = async () => {
    try {
      const result = await getUserLists(userId, userListFilters);
      setUserLists(result.userLists);
    } catch (error) {
      console.error('Error loading user lists:', error);
      toast.error('Failed to load your lists');
    }
  };

  /**
   * Load public lists
   */
  const loadPublicLists = async () => {
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
  };

  /**
   * Load all data
   */
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadUserLists(), loadPublicLists()]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle adding a public list to user collection
   */
  const handleAddToCollection = async (listId: string) => {
    startTransition(async () => {
      try {
        const result = await addListToUserCollection(
          userId,
          listId,
          userLanguages,
        );

        if (result.success) {
          toast.success(result.message);
          await loadData(); // Refresh both lists
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error adding list to collection:', error);
        toast.error('Failed to add list to collection');
      }
    });
  };

  /**
   * Handle removing a list from user collection
   */
  const handleRemoveFromCollection = async (userListId: string) => {
    startTransition(async () => {
      try {
        const result = await removeListFromUserCollection(userId, userListId);

        if (result.success) {
          toast.success(result.message);
          await loadData(); // Refresh both lists
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error removing list from collection:', error);
        toast.error('Failed to remove list from collection');
      }
    });
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
        baseLanguageCode: userLanguages.base,
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

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [userListFilters, publicListFilters]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="my-lists" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-lists">
            My Lists ({userLists.length})
          </TabsTrigger>
          <TabsTrigger value="discover">
            Discover ({publicLists.length})
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
                Explore public word lists created by the community
              </p>
            </CardHeader>
          </Card>

          {/* Discover Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search public lists..."
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

          {/* Public Lists Grid */}
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
                  <h3 className="text-lg font-medium">No lists found</h3>
                  <p className="text-muted-foreground mt-2">
                    Try adjusting your search criteria or check back later for
                    new lists
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
                  isPending={isPending}
                />
              ))}
            </div>
          )}
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
}: {
  list: UserListWithDetails;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const isCustomList = !list.listId;
  const progressPercentage =
    list.wordCount > 0 ? (list.learnedWordCount / list.wordCount) * 100 : 0;

  return (
    <Card className="group hover:shadow-md transition-shadow">
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
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
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
 * Public List Card Component
 */
function PublicListCard({
  list,
  onAddToCollection,
  onRemoveFromCollection,
  isPending,
}: {
  list: PublicListSummary;
  onAddToCollection: () => void;
  onRemoveFromCollection: () => void;
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
      </CardContent>
    </Card>
  );
}
