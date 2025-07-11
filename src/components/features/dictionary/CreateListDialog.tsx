'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LanguageCode, DifficultyLevel } from '@/core/types';
import { ImageSelector } from './ImageSelector';

interface CreateListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    difficulty?: DifficultyLevel;
    coverImageUrl?: string;
  }) => Promise<void>;
  userLanguages: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

export function CreateListDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateListDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty: '' as DifficultyLevel | '',
    coverImageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const submissionData: {
        name: string;
        description?: string;
        difficulty?: DifficultyLevel;
        coverImageUrl?: string;
      } = {
        name: formData.name.trim(),
      };

      const description = formData.description.trim();
      if (description) {
        submissionData.description = description;
      }

      if (formData.difficulty) {
        submissionData.difficulty = formData.difficulty;
      }

      const coverImageUrl = formData.coverImageUrl.trim();
      if (coverImageUrl) {
        submissionData.coverImageUrl = coverImageUrl;
      }

      await onSubmit(submissionData);

      // Reset form
      setFormData({
        name: '',
        description: '',
        difficulty: '',
        coverImageUrl: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setFormData({
        name: '',
        description: '',
        difficulty: '',
        coverImageUrl: '',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
          <DialogDescription>
            Create a custom word list for your vocabulary learning
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">List Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter list name..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
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
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) =>
                setFormData((prev) => ({
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
                setFormData((prev) => ({
                  ...prev,
                  coverImageUrl: imageUrl,
                }))
              }
              selectedImageUrl={formData.coverImageUrl}
              searchPlaceholder="Search for list cover images..."
              triggerButtonText="Choose Cover Image"
              dialogTitle="Select Cover Image for List"
            />
            <Input
              id="coverImageUrl"
              value={formData.coverImageUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  coverImageUrl: e.target.value,
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
            <Button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create List'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
