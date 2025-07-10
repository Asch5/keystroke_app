import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, ListIcon } from 'lucide-react';
import { ListItem } from './ListItem';
import { ExistingListTabProps } from '../types';

/**
 * Existing list tab component for selecting and adding to existing lists
 * Shows loading state, empty state, or list of user's existing lists
 */
export function ExistingListTab({
  userLists,
  loading,
  isSubmitting,
  selectedListId,
  onSelectList,
  onAddToList,
  onClose,
}: ExistingListTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading your lists...</span>
      </div>
    );
  }

  if (userLists.length === 0) {
    return (
      <>
        <div className="text-center py-8">
          <ListIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No lists yet</h3>
          <p className="text-muted-foreground mt-2">
            Create your first list to start organizing your vocabulary
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <Label>Select a list:</Label>
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {userLists.map((list) => (
              <ListItem
                key={list.id}
                list={list}
                isSelected={selectedListId === list.id}
                onSelect={onSelectList}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={onAddToList}
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
    </>
  );
}
