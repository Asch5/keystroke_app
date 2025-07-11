'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LanguageCode } from '@/core/types';
import { AddToListDialog } from './AddToListDialog';
import { DictionaryEmptyState } from './DictionaryEmptyState';
import { DictionaryFilters } from './DictionaryFilters';
import { DictionaryLoadingSkeleton } from './DictionaryLoadingSkeleton';
import { DictionaryPagination } from './DictionaryPagination';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useDictionaryActions } from './hooks/useDictionaryActions';
import { useDictionaryState } from './hooks/useDictionaryState';
import { WordTable } from './WordTable';

interface MyDictionaryContentProps {
  userId: string;
}

/**
 * My Dictionary Content Component
 *
 * Main container component for dictionary management.
 * Now uses custom hooks and smaller components for better modularity.
 */
export function MyDictionaryContent({ userId }: MyDictionaryContentProps) {
  const router = useRouter();

  // Custom hooks for state management
  const dictionaryState = useDictionaryState(userId);
  const { isPlayingAudio, playingWordId, playWordAudio } = useAudioPlayback();
  const dictionaryActions = useDictionaryActions(
    userId,
    dictionaryState.fetchWords,
  );

  // Handle word detail view - navigate to separate page
  const handleViewWordDetail = (
    wordText: string,
    languageCode: LanguageCode,
  ) => {
    const params = new URLSearchParams();
    params.set('lang', languageCode);
    router.push(
      `/dashboard/dictionary/word-details/${encodeURIComponent(wordText)}?${params.toString()}`,
    );
  };

  // Early return for loading state
  if (dictionaryState.loading && dictionaryState.words.length === 0) {
    return <DictionaryLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <DictionaryFilters
        searchQuery={dictionaryState.searchQuery}
        onSearchQueryChange={dictionaryState.setSearchQuery}
        selectedStatus={dictionaryState.selectedStatus}
        onSelectedStatusChange={dictionaryState.setSelectedStatus}
        selectedPartOfSpeech={dictionaryState.selectedPartOfSpeech}
        onSelectedPartOfSpeechChange={dictionaryState.setSelectedPartOfSpeech}
        showFavoritesOnly={dictionaryState.showFavoritesOnly}
        onShowFavoritesOnlyChange={dictionaryState.setShowFavoritesOnly}
        showModifiedOnly={dictionaryState.showModifiedOnly}
        onShowModifiedOnlyChange={dictionaryState.setShowModifiedOnly}
        showNeedsReview={dictionaryState.showNeedsReview}
        onShowNeedsReviewChange={dictionaryState.setShowNeedsReview}
        sortBy={dictionaryState.sortBy}
        onSortByChange={dictionaryState.setSortBy}
        sortOrder={dictionaryState.sortOrder}
        onSortOrderChange={dictionaryState.setSortOrder}
        onClearFilters={dictionaryState.clearFilters}
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {dictionaryState.words.length} of {dictionaryState.totalCount}{' '}
          words
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {dictionaryState.currentPage} of {dictionaryState.totalPages}
          </span>
        </div>
      </div>

      {/* Words Table or Empty State */}
      {dictionaryState.words.length === 0 && !dictionaryState.loading ? (
        <DictionaryEmptyState
          searchQuery={dictionaryState.searchQuery}
          selectedStatus={dictionaryState.selectedStatus}
          selectedPartOfSpeech={dictionaryState.selectedPartOfSpeech}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <WordTable
              words={dictionaryState.words}
              userLanguages={dictionaryState.userLanguages}
              isPlayingAudio={isPlayingAudio}
              playingWordId={playingWordId}
              onToggleFavorite={dictionaryActions.handleToggleFavorite}
              onStatusUpdate={dictionaryActions.handleStatusUpdate}
              onRemoveWord={dictionaryActions.handleRemoveWord}
              onAddToList={dictionaryActions.handleAddToList}
              onPlayAudio={playWordAudio}
              onViewWordDetail={handleViewWordDetail}
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <DictionaryPagination
        currentPage={dictionaryState.currentPage}
        totalPages={dictionaryState.totalPages}
        onPageChange={dictionaryState.setCurrentPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={dictionaryActions.deleteDialog.open}
        onOpenChange={dictionaryActions.closeDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Word from Dictionary</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;
              {dictionaryActions.deleteDialog.wordText}
              &quot; from your dictionary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={dictionaryActions.closeDeleteDialog}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={dictionaryActions.confirmRemoveWord}
            >
              Remove Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      {dictionaryState.userLanguages && (
        <AddToListDialog
          isOpen={dictionaryActions.addToListDialog.open}
          onClose={dictionaryActions.closeAddToListDialog}
          userId={userId}
          userLanguages={dictionaryState.userLanguages}
          wordText={dictionaryActions.addToListDialog.wordText}
          userDictionaryId={dictionaryActions.addToListDialog.definitionId}
          onWordAddedToList={dictionaryActions.handleWordAddedToList}
        />
      )}
    </div>
  );
}
