'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BulkDeleteConfirmDialog } from '@/components/shared/dialogs';
import { AddWordsToListDialog } from '@/components/features/admin/dictionary/AddWordsToListDialog';
import {
  AdminDictionaryPageHeader,
  AdminDictionaryFilters,
  AdminDictionaryTable,
  useAdminDictionaryState,
} from '@/components/features/admin';

/**
 * Admin dictionaries page - main dictionary management interface
 * Refactored to use modular components following Cursor Rules for maintainability
 */
export default function DictionariesPage() {
  const {
    // State
    selectedLanguage,
    wordDetails,
    filteredWordDetails,
    isLoading,
    filters,
    filtersOpen,
    selectedWords,
    isDeleteDialogOpen,
    isDeleting,
    isAddWordsToListDialogOpen,

    // Actions
    setSelectedLanguage,
    handleFilterChange,
    clearAllFilters,
    setFiltersOpen,
    toggleWordSelection,
    selectAllWords,
    clearSelection,
    handleCreateWordList,
    handleDeleteSelectedWords,
    handleDeleteAudio,
    handleAudioGenerated,
    openDeleteDialog,
    openAddWordsToListDialog,
    handleWordsAddedToList,
    setIsDeleteDialogOpen,
    setIsAddWordsToListDialogOpen,
  } = useAdminDictionaryState();

  return (
    <div className="container mx-auto py-6">
      <Card>
        <AdminDictionaryPageHeader
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          selectedWords={selectedWords}
          filteredWordDetails={filteredWordDetails}
          onCreateWordList={handleCreateWordList}
          onDeleteSelected={openDeleteDialog}
          onAudioGenerated={handleAudioGenerated}
          onAddWordsToList={openAddWordsToListDialog}
        />

        <CardContent className="space-y-4">
          <AdminDictionaryFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAllFilters={clearAllFilters}
            filtersOpen={filtersOpen}
            onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
            wordDetails={wordDetails}
            filteredWordDetails={filteredWordDetails}
          />

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <AdminDictionaryTable
              data={filteredWordDetails}
              selectedWords={selectedWords}
              onWordSelectionToggle={toggleWordSelection}
              onSelectAllWords={selectAllWords}
              onClearSelection={clearSelection}
              onDeleteAudio={handleDeleteAudio}
              selectedLanguage={selectedLanguage}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteSelectedWords}
        selectedCount={selectedWords.size}
        isLoading={isDeleting}
      />

      {/* Add Words to List Dialog */}
      <AddWordsToListDialog
        isOpen={isAddWordsToListDialogOpen}
        onClose={() => setIsAddWordsToListDialogOpen(false)}
        selectedWords={selectedWords}
        selectedDefinitionIds={
          filteredWordDetails
            .filter((word) => selectedWords.has(word.id.toString()))
            .map((word) => word.definitionId)
            .filter((id) => id !== undefined) as number[]
        }
        selectedLanguage={selectedLanguage}
        onWordsAdded={handleWordsAddedToList}
      />
    </div>
  );
}
