'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BulkDeleteConfirmDialog } from '@/components/shared/dialogs';
import { AddWordsToListDialog } from '@/components/features/admin/dictionary/AddWordsToListDialog';
import { DeepSeekWordExtractionDialog } from '@/components/features/admin/dictionary/DeepSeekWordExtractionDialog';
import { ManualFormsDialog } from '@/components/features/admin/dictionary/ManualFormsDialog';
import {
  AdminDictionaryPageHeader,
  AdminDictionaryFilters,
  AdminDictionaryTable,
  useAdminDictionaryState,
} from '@/components/features/admin';

/**
 * Admin Dictionary Page Content Component
 * Contains the main logic for the admin dictionaries page
 * Separated for better code splitting and performance
 */
export function AdminDictionaryPageContent() {
  const {
    // State
    selectedLanguage,
    wordDetails,
    filteredWordDetails,
    filters,
    filtersOpen,
    selectedWords,
    isDeleteDialogOpen,
    isDeleting,
    isAddWordsToListDialogOpen,
    isDeepSeekDialogOpen,
    isManualFormsDialogOpen,
    selectedWordForForms,

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
    openDeepSeekDialog,
    handleDeepSeekSuccess,
    getSelectedWordDetailIds,
    setIsDeepSeekDialogOpen,
    openManualFormsDialog,
    handleManualFormsSuccess,
    setIsManualFormsDialogOpen,
  } = useAdminDictionaryState();

  return (
    <div className="container mx-auto py-8">
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
          onDeepSeekExtract={openDeepSeekDialog}
        />

        <CardContent>
          <AdminDictionaryFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAllFilters={clearAllFilters}
            filtersOpen={filtersOpen}
            onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
            wordDetails={wordDetails}
            filteredWordDetails={filteredWordDetails}
          />

          <AdminDictionaryTable
            data={filteredWordDetails}
            selectedWords={selectedWords}
            onWordSelectionToggle={toggleWordSelection}
            onSelectAllWords={selectAllWords}
            onClearSelection={clearSelection}
            onDeleteAudio={handleDeleteAudio}
            selectedLanguage={selectedLanguage}
            onAddManualForms={openManualFormsDialog}
          />
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
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

      {/* DeepSeek Word Extraction Dialog */}
      <DeepSeekWordExtractionDialog
        open={isDeepSeekDialogOpen}
        onOpenChange={setIsDeepSeekDialogOpen}
        selectedWordDetailIds={getSelectedWordDetailIds()}
        onSuccess={handleDeepSeekSuccess}
      />

      {/* Manual Forms Dialog */}
      <ManualFormsDialog
        isOpen={isManualFormsDialogOpen}
        onOpenChange={setIsManualFormsDialogOpen}
        wordDetail={selectedWordForForms}
        onSuccess={handleManualFormsSuccess}
      />
    </div>
  );
}
