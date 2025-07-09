import { useRouter } from 'next/navigation';
import { LanguageCode } from '@/core/types';
import { useListDetailState } from '../hooks/useListDetailState';
import { useListDetailActions } from '../hooks/useListDetailActions';
import { ListDetailHeader } from './ListDetailHeader';
import { ListStatsCards } from './ListStatsCards';
import { ProgressBarCard } from './ProgressBarCard';
import { SearchBar } from './SearchBar';
import { WordsTable } from './WordsTable';
import { ListDetailDialogs } from './ListDetailDialogs';
import { ListDetailLoadingSkeleton } from './ListDetailLoadingSkeleton';
import { ListNotFound } from './ListNotFound';
import type { ListDetailContentProps } from '../types';

/**
 * Main orchestrator component for list detail content
 * Brings together all modular components with state management
 */
export function ListDetailContentMain({
  userId,
  listId,
  userLanguages: initialUserLanguages = {
    base: 'en' as LanguageCode,
    target: 'da' as LanguageCode,
  },
}: ListDetailContentProps) {
  const router = useRouter();

  // State management hooks
  const state = useListDetailState({
    userId,
    listId,
    initialUserLanguages,
  });

  const actions = useListDetailActions({
    userId,
    listId,
    loadData: state.loadData,
  });

  // Navigation handlers
  const handleBackToLists = () => {
    router.push('/dashboard/dictionary/lists');
  };

  const handleGoToDictionary = () => {
    actions.setAddWordsDialog({ open: false });
    router.push('/dashboard/dictionary/my-dictionary');
  };

  // Loading state
  if (state.loading) {
    return <ListDetailLoadingSkeleton />;
  }

  // Not found state
  if (!state.listInfo) {
    return <ListNotFound onBackToLists={handleBackToLists} />;
  }

  // Main content
  return (
    <div className="space-y-6">
      {/* Header */}
      <ListDetailHeader
        listInfo={state.listInfo}
        onBackClick={handleBackToLists}
        onAddWordsClick={() => actions.setAddWordsDialog({ open: true })}
      />

      {/* Stats Cards */}
      <ListStatsCards listInfo={state.listInfo} />

      {/* Progress Bar */}
      <ProgressBarCard listInfo={state.listInfo} />

      {/* Search Bar */}
      <SearchBar
        searchTerm={state.searchTerm}
        onSearchChange={state.setSearchTerm}
      />

      {/* Words Table */}
      <WordsTable
        words={state.filteredWords}
        userLanguages={state.userLanguages}
        isPlayingAudio={actions.isPlayingAudio}
        playingWordId={actions.playingWordId}
        isPending={actions.isPending}
        onPlayAudio={actions.playWordAudio}
        onRemoveWord={actions.setRemoveDialog}
        onAddWords={() => actions.setAddWordsDialog({ open: true })}
        onPopulateList={actions.handlePopulateList}
        onClearSearch={() => state.setSearchTerm('')}
        searchTerm={state.searchTerm}
      />

      {/* Dialogs */}
      <ListDetailDialogs
        removeDialog={actions.removeDialog}
        addWordsDialog={actions.addWordsDialog}
        onRemoveConfirm={actions.handleRemoveFromList}
        onRemoveCancel={() =>
          actions.setRemoveDialog({
            open: false,
            wordId: '',
            wordText: '',
            userDictionaryId: '',
          })
        }
        onAddWordsCancel={() => actions.setAddWordsDialog({ open: false })}
        onGoToDictionary={handleGoToDictionary}
      />
    </div>
  );
}
