'use client';

import { Trash2, AlertTriangle } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BulkDeleteConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

/**
 * Confirmation dialog for bulk word deletion operations
 * Provides clear warnings about the destructive nature of the operation
 */
export function BulkDeleteConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  selectedCount,
  isLoading = false,
  title = 'Delete Selected Words',
  description,
}: BulkDeleteConfirmDialogProps) {
  const defaultDescription = `You are about to permanently delete ${selectedCount} word${
    selectedCount !== 1 ? 's' : ''
  } from the dictionary. This action will also remove:`;

  const finalDescription = description || defaultDescription;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="font-medium">
                {selectedCount} word{selectedCount !== 1 ? 's' : ''} selected
              </Badge>
            </div>

            <p className="text-sm">{finalDescription}</p>

            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                What will be deleted:
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                <li>• All word definitions and examples</li>
                <li>• Associated audio files and images</li>
                <li>• User learning progress for these words</li>
                <li>• Word relationships and translations</li>
                <li>• Words from user lists and study sessions</li>
              </ul>
            </div>

            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                This action cannot be undone!
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Make sure you have backups if you need to recover this data
                later.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedCount} Word{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
