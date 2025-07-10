import React from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2, BookOpen } from 'lucide-react';
import { ImageSelector } from '../../ImageSelector';
import { NewListTabProps, difficultyDisplayNames } from '../types';
import { DifficultyLevel } from '@/core/types';

/**
 * New list tab component for creating new lists with form fields
 * Includes name, description, difficulty, and cover image selection
 */
export function NewListTab({
  formData,
  isSubmitting,
  onFormDataChange,
  onCreateList,
  onClose,
}: NewListTabProps) {
  return (
    <>
      <ScrollArea className="h-96">
        <div className="space-y-4 pr-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">List Name *</Label>
            <Input
              id="list-name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
              placeholder="Enter list name..."
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-description">Description</Label>
            <Textarea
              id="list-description"
              value={formData.description}
              onChange={(e) =>
                onFormDataChange({ description: e.target.value })
              }
              placeholder="Describe your list..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="list-difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value) =>
                onFormDataChange({ difficulty: value as DifficultyLevel | '' })
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
                onFormDataChange({ coverImageUrl: imageUrl })
              }
              selectedImageUrl={formData.coverImageUrl}
              searchPlaceholder="Search for list cover images..."
              triggerButtonText="Choose Cover Image"
              dialogTitle="Select Cover Image for List"
            />
            <Input
              id="cover-image-url"
              value={formData.coverImageUrl}
              onChange={(e) =>
                onFormDataChange({ coverImageUrl: e.target.value })
              }
              placeholder="Or paste image URL directly"
              type="url"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </ScrollArea>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={onCreateList}
          disabled={!formData.name.trim() || isSubmitting}
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
    </>
  );
}
