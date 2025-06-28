'use client';

import { useState, useEffect } from 'react';
import { LanguageCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, ListIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllLists,
  addWordsToList,
  type ListWithDetails,
} from '@/core/domains/dictionary/actions';

interface AddWordsToListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWords: Set<string>;
  selectedDefinitionIds: number[];
  selectedLanguage: LanguageCode;
  onWordsAdded: () => void;
}

// Difficulty level display names and colors
const difficultyDisplayNames = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  elementary: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  proficient: 'bg-red-100 text-red-800',
};

/**
 * Dialog component for adding selected words to an existing list
 */
export function AddWordsToListDialog({
  isOpen,
  onClose,
  selectedWords,
  selectedDefinitionIds,
  selectedLanguage,
  onWordsAdded,
}: AddWordsToListDialogProps) {
  const [availableLists, setAvailableLists] = useState<ListWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedListId, setSelectedListId] = useState('');

  /**
   * Load available lists when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedLanguage]);

  /**
   * Load all available lists for the selected language
   */
  const loadLists = async () => {
    setIsLoading(true);
    try {
      const result = await fetchAllLists({
        language: selectedLanguage,
        isPublic: true,
        sortBy: 'name',
        sortOrder: 'asc',
        pageSize: 100, // Get more lists to ensure good selection
      });

      // Filter lists to ensure language compatibility
      // Only show lists that match the selected language exactly
      const compatibleLists = result.lists.filter((list) => {
        return list.isPublic && list.targetLanguageCode === selectedLanguage;
      });

      setAvailableLists(compatibleLists);
    } catch (error) {
      console.error('Error loading lists:', error);
      toast.error('Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle adding words to the selected list
   */
  const handleAddWordsToList = async () => {
    if (!selectedListId) {
      toast.error('Please select a list');
      return;
    }

    if (selectedDefinitionIds.length === 0) {
      toast.error('No words selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addWordsToList(
        selectedListId,
        selectedDefinitionIds,
      );

      if (result.success) {
        const selectedList = availableLists.find(
          (list) => list.id === selectedListId,
        );
        toast.success(
          `Successfully added ${selectedDefinitionIds.length} words to "${selectedList?.name}"`,
        );
        onWordsAdded();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add words to list');
      }
    } catch (error) {
      console.error('Error adding words to list:', error);
      toast.error('Failed to add words to list');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedListId('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Words to Existing List</DialogTitle>
          <DialogDescription>
            Select a list to add {selectedWords.size} selected words to an
            existing vocabulary list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading lists...</span>
            </div>
          ) : availableLists.length === 0 ? (
            <div className="text-center py-8">
              <ListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No lists available
              </h3>
              <p className="text-gray-500 mb-4">
                No compatible public lists found for {selectedLanguage}. Lists
                must share at least one language with your selected words.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Create a new public list that includes {selectedLanguage} as
                either the base or target language.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  window.open('/admin/dictionaries/lists', '_blank');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Go to Lists Management
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Label>Select a list to add words to:</Label>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {availableLists.map((list) => (
                    <Card
                      key={list.id}
                      className={`cursor-pointer transition-colors ${
                        selectedListId === list.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedListId(list.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">
                                {list.name}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {list.categoryName}
                              </Badge>
                            </div>
                            {list.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {list.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={`text-xs ${difficultyColors[list.difficultyLevel]}`}
                              >
                                {difficultyDisplayNames[list.difficultyLevel]}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {list.targetLanguageCode}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {list.wordCount} words
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {list.userListCount} users
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddWordsToList}
            disabled={
              !selectedListId || isSubmitting || availableLists.length === 0
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedWords.size} Words
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
