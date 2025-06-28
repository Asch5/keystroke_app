'use client';

import { useState, useEffect, useCallback } from 'react';
import { LanguageCode, DifficultyLevel } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, ListIcon, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserLists,
  createCustomUserList,
  addWordToUserList,
  type UserListWithDetails,
} from '@/core/domains/dictionary/actions/user-list-actions';
import { ImageSelector } from './ImageSelector';

interface AddToListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
  wordText: string;
  userDictionaryId: string;
  onWordAddedToList: (listName: string) => void;
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

export function AddToListDialog({
  isOpen,
  onClose,
  userId,
  userLanguages,
  wordText,
  userDictionaryId,
  onWordAddedToList,
}: AddToListDialogProps) {
  const [userLists, setUserLists] = useState<UserListWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');

  // New list form state
  const [newListData, setNewListData] = useState({
    name: '',
    description: '',
    difficulty: '' as DifficultyLevel | '',
    coverImageUrl: '',
  });

  // Load user lists when dialog opens
  const loadUserLists = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUserLists(userId);
      setUserLists(result.userLists);
    } catch (error) {
      console.error('Error loading user lists:', error);
      toast.error('Failed to load your lists');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      loadUserLists();
    }
  }, [isOpen, loadUserLists]);

  const handleAddToExistingList = async () => {
    if (!selectedListId) {
      toast.error('Please select a list');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addWordToUserList(
        userId,
        selectedListId,
        userDictionaryId,
      );

      if (result.success) {
        const selectedList = userLists.find(
          (list) => list.id === selectedListId,
        );
        toast.success(
          `Word "${wordText}" added to ${selectedList?.displayName}`,
        );
        onWordAddedToList(selectedList?.displayName || 'list');
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding word to list:', error);
      toast.error('Failed to add word to list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewList = async () => {
    if (!newListData.name.trim()) {
      toast.error('Please enter a list name');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData: {
        name: string;
        description?: string;
        difficulty?: DifficultyLevel;
        coverImageUrl?: string;
      } = {
        name: newListData.name.trim(),
      };

      const description = newListData.description.trim();
      if (description) {
        submissionData.description = description;
      }

      if (newListData.difficulty) {
        submissionData.difficulty = newListData.difficulty;
      }

      const coverImageUrl = newListData.coverImageUrl.trim();
      if (coverImageUrl) {
        submissionData.coverImageUrl = coverImageUrl;
      }

      const result = await createCustomUserList(userId, {
        ...submissionData,
        targetLanguageCode: userLanguages.target,
      });

      if (result.success && result.userListId) {
        // Add word to the newly created list
        const addResult = await addWordToUserList(
          userId,
          result.userListId,
          userDictionaryId,
        );

        if (addResult.success) {
          toast.success(
            `Created list "${newListData.name}" and added word "${wordText}"`,
          );
          onWordAddedToList(newListData.name);
        } else {
          toast.success(`Created list "${newListData.name}"`);
          toast.error(`Failed to add word: ${addResult.message}`);
          onWordAddedToList(newListData.name);
        }

        // Reset form
        setNewListData({
          name: '',
          description: '',
          difficulty: '',
          coverImageUrl: '',
        });

        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedListId('');
      setNewListData({
        name: '',
        description: '',
        difficulty: '',
        coverImageUrl: '',
      });
    }
  };

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

          {/* Add to Existing List */}
          <TabsContent value="existing" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading your lists...</span>
              </div>
            ) : userLists.length === 0 ? (
              <div className="text-center py-8">
                <ListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No lists yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first list to start organizing your vocabulary
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Select a list:</Label>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {userLists.map((list) => (
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
                                  {list.displayName}
                                </h4>
                                {!list.listId && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Custom
                                  </Badge>
                                )}
                              </div>
                              {list.displayDescription && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {list.displayDescription}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  className={`text-xs ${difficultyColors[list.displayDifficulty]}`}
                                >
                                  {
                                    difficultyDisplayNames[
                                      list.displayDifficulty
                                    ]
                                  }
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {list.wordCount} words
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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToExistingList}
                disabled={!selectedListId || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to List
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Create New List */}
          <TabsContent value="new" className="space-y-4">
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="list-name">List Name *</Label>
                  <Input
                    id="list-name"
                    value={newListData.name}
                    onChange={(e) =>
                      setNewListData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter list name..."
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="list-description">Description</Label>
                  <Textarea
                    id="list-description"
                    value={newListData.description}
                    onChange={(e) =>
                      setNewListData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your list..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="list-difficulty">Difficulty Level</Label>
                  <Select
                    value={newListData.difficulty}
                    onValueChange={(value) =>
                      setNewListData((prev) => ({
                        ...prev,
                        difficulty: value as DifficultyLevel,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty..." />
                    </SelectTrigger>
                    <SelectContent>
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

                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <ImageSelector
                    onImageSelect={(imageUrl) =>
                      setNewListData((prev) => ({
                        ...prev,
                        coverImageUrl: imageUrl,
                      }))
                    }
                    selectedImageUrl={newListData.coverImageUrl}
                    searchPlaceholder="Search for list cover images..."
                    triggerButtonText="Choose Cover Image"
                    dialogTitle="Select Cover Image for List"
                  />
                  <Input
                    id="cover-image-url"
                    value={newListData.coverImageUrl}
                    onChange={(e) =>
                      setNewListData((prev) => ({
                        ...prev,
                        coverImageUrl: e.target.value,
                      }))
                    }
                    placeholder="Or paste image URL directly"
                    type="url"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewList}
                disabled={!newListData.name.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Create & Add Word
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
