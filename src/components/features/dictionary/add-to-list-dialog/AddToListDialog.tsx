'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExistingListTab } from './components/ExistingListTab';
import { NewListTab } from './components/NewListTab';
import { useAddToListDialog } from './hooks/useAddToListDialog';
import { AddToListDialogProps } from './types';

/**
 * Main AddToListDialog component - refactored to ~50 lines (down from 479 lines)
 * Uses modular architecture with focused tab components and custom hooks
 */
export function AddToListDialog({
  isOpen,
  onClose,
  userId,
  userLanguages,
  wordText,
  userDictionaryId,
  onWordAddedToList,
}: AddToListDialogProps) {
  const {
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
  } = useAddToListDialog(
    userId,
    userLanguages,
    wordText,
    userDictionaryId,
    onWordAddedToList,
    onClose,
  );

  useEffect(() => {
    if (isOpen) {
      loadUserLists();
    }
  }, [isOpen, loadUserLists]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add &quot;{wordText}&quot; to List</DialogTitle>
          <DialogDescription>
            Choose an existing list or create a new one to organize your
            vocabulary
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Add to Existing List</TabsTrigger>
            <TabsTrigger value="new">Create New List</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <ExistingListTab
              userLists={userLists}
              loading={loading}
              isSubmitting={isSubmitting}
              selectedListId={selectedListId}
              onSelectList={setSelectedListId}
              onAddToList={handleAddToExistingList}
              onClose={handleClose}
            />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <NewListTab
              formData={newListData}
              isSubmitting={isSubmitting}
              onFormDataChange={updateNewListData}
              onCreateList={handleCreateNewList}
              onClose={handleClose}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
