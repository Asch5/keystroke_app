'use client';

import { useState, useEffect } from 'react';
import { DifficultyLevel } from '@prisma/client';
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
import { Loader2 } from 'lucide-react';
import { type UserListWithDetails } from '@/core/domains/dictionary';
import { ImageSelector } from './ImageSelector';

interface EditListDialogProps {
  list: UserListWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customName?: string;
    customDescription?: string;
    customDifficulty?: DifficultyLevel;
    customCoverImageUrl?: string;
  }) => Promise<void>;
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

export function EditListDialog({
  list,
  isOpen,
  onClose,
  onSubmit,
}: EditListDialogProps) {
  const [formData, setFormData] = useState({
    customName: '',
    customDescription: '',
    customDifficulty: '' as DifficultyLevel | '',
    customCoverImageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when list changes
  useEffect(() => {
    if (list) {
      setFormData({
        customName: list.customNameOfList || '',
        customDescription: list.customDescriptionOfList || '',
        customDifficulty: list.customDifficulty || '',
        customCoverImageUrl: list.customCoverImageUrl || '',
      });
    }
  }, [list]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const submissionData: {
        customName?: string;
        customDescription?: string;
        customDifficulty?: DifficultyLevel;
        customCoverImageUrl?: string;
      } = {};

      const customName = formData.customName.trim();
      if (customName) {
        submissionData.customName = customName;
      }

      const customDescription = formData.customDescription.trim();
      if (customDescription) {
        submissionData.customDescription = customDescription;
      }

      if (formData.customDifficulty) {
        submissionData.customDifficulty = formData.customDifficulty;
      }

      const customCoverImageUrl = formData.customCoverImageUrl.trim();
      if (customCoverImageUrl) {
        submissionData.customCoverImageUrl = customCoverImageUrl;
      }

      await onSubmit(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const isCustomList = !list.listId;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
          <DialogDescription>
            {isCustomList
              ? 'Edit your custom list details'
              : 'Customize how this list appears in your collection'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customName">
              {isCustomList ? 'List Name' : 'Custom Name'}
            </Label>
            <Input
              id="customName"
              value={formData.customName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, customName: e.target.value }))
              }
              placeholder={
                isCustomList
                  ? 'Enter list name...'
                  : list.originalList?.name || 'Custom name...'
              }
              disabled={isSubmitting}
            />
            {!isCustomList && (
              <p className="text-xs text-muted-foreground">
                Original name: {list.originalList?.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDescription">
              {isCustomList ? 'Description' : 'Custom Description'}
            </Label>
            <Textarea
              id="customDescription"
              value={formData.customDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customDescription: e.target.value,
                }))
              }
              placeholder={
                isCustomList
                  ? 'Describe your list...'
                  : list.originalList?.description || 'Custom description...'
              }
              rows={3}
              disabled={isSubmitting}
            />
            {!isCustomList && list.originalList?.description && (
              <p className="text-xs text-muted-foreground">
                Original: {list.originalList.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customDifficulty">
              {isCustomList ? 'Difficulty Level' : 'Custom Difficulty'}
            </Label>
            <Select
              value={formData.customDifficulty}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  customDifficulty: value as DifficultyLevel,
                }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isCustomList
                      ? 'Select difficulty...'
                      : `Original: ${difficultyDisplayNames[list.originalList?.difficultyLevel || 'beginner']}`
                  }
                />
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
            <Label>{isCustomList ? 'Cover Image' : 'Custom Cover Image'}</Label>
            <ImageSelector
              onImageSelect={(imageUrl) =>
                setFormData((prev) => ({
                  ...prev,
                  customCoverImageUrl: imageUrl,
                }))
              }
              selectedImageUrl={formData.customCoverImageUrl}
              searchPlaceholder="Search for list cover images..."
              triggerButtonText="Choose Cover Image"
              dialogTitle="Select Cover Image for List"
            />
            <Input
              id="customCoverImageUrl"
              value={formData.customCoverImageUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customCoverImageUrl: e.target.value,
                }))
              }
              placeholder="Or paste image URL directly"
              type="url"
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
