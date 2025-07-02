'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageCode } from '@/core/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, Globe } from 'lucide-react';
import { CreateListDialog } from './CreateListDialog';
import { EditListDialog } from './EditListDialog';
import { PublicListPreviewDialog } from './PublicListPreviewDialog';
import { UserListCard } from './UserListCard';
import { PublicUserListCard } from './PublicUserListCard';
import { PublicListCard } from './PublicListCard';
import { MyListsFilters } from './MyListsFilters';
import { DiscoverListsFilters } from './DiscoverListsFilters';
import { useWordListsState } from './hooks/useWordListsState';

interface WordListsContentProps {
  userId: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

/**
 * WordListsContent component for managing user's vocabulary lists
 * Refactored to use custom hooks and extracted card components
 * Memoized to prevent unnecessary re-renders when parent updates but props remain same
 */
const WordListsContent = memo(function WordListsContent({
  userId,
  userLanguages,
}: WordListsContentProps) {
  const router = useRouter();

  // Use the extracted state management hook
  const {
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
    handleAddToCollection,
    handleAddPublicUserListToCollection,
    handleRemoveFromCollection,
    handleCreateList,
    handleUpdateList,
  } = useWordListsState({ userId, userLanguages });

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
          <MyListsFilters
            userListFilters={userListFilters}
            setUserListFilters={setUserListFilters}
          />

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
              <DiscoverListsFilters
                publicListFilters={publicListFilters}
                setPublicListFilters={setPublicListFilters}
              />

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
                      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No lists found</h3>
                      <p className="text-muted-foreground mt-2">
                        Try adjusting your search filters
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
                      <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">
                        No community lists found
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Try adjusting your search filters
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
          isOpen={!!editingList}
          onClose={() => setEditingList(null)}
          onSubmit={(data) => handleUpdateList(editingList.id, data)}
          list={editingList}
        />
      )}

      {previewingList && (
        <PublicListPreviewDialog
          isOpen={!!previewingList}
          onClose={() => setPreviewingList(null)}
          list={previewingList}
          onAddToCollection={() => handleAddToCollection(previewingList.id)}
          userLanguages={userLanguages}
          isPending={isPending}
        />
      )}

      {previewingUserList && (
        <PublicListPreviewDialog
          isOpen={!!previewingUserList}
          onClose={() => setPreviewingUserList(null)}
          list={{
            ...previewingUserList,
            categoryName: 'User Created',
            tags: [],
            userCount: 0,
          }}
          onAddToCollection={() =>
            handleAddPublicUserListToCollection(previewingUserList.id)
          }
          userLanguages={userLanguages}
          isPending={isPending}
          isUserList={true}
        />
      )}
    </div>
  );
});

export default WordListsContent;
