'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ImageSelector } from '@/components/features/dictionary';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  fetchCategories,
  createCategory,
  createListWithWords,
  type CategoryData,
} from '@/core/domains/dictionary/actions';
import { initializeBasicCategories } from '@/core/domains/dictionary/actions/init-basic-data';
import { LanguageCode, DifficultyLevel } from '@/core/types';

interface AdminCreateListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onListCreated: () => void;
}

// Language display names
const languageDisplayNames: Record<LanguageCode, string> = {
  en: 'English',
  ru: 'Russian',
  da: 'Danish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  pl: 'Polish',
  hi: 'Hindi',
  ne: 'Nepali',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  ur: 'Urdu',
  fa: 'Persian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  nl: 'Dutch',
  vi: 'Vietnamese',
  bn: 'Bengali',
  id: 'Indonesian',
};

// Difficulty level display names
const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

/**
 * Admin dialog for creating public lists
 */
export function AdminCreateListDialog({
  isOpen,
  onClose,
  onListCreated,
}: AdminCreateListDialogProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    targetLanguageCode: LanguageCode.da,
    difficultyLevel: DifficultyLevel.intermediate,
    isPublic: true,
    coverImageUrl: '',
  });

  // Load categories when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      // First try to initialize basic categories if none exist
      await initializeBasicCategories();

      // Then fetch all categories
      const result = await fetchCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags((prev) => [...prev, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    setIsCreatingCategory(true);
    try {
      const result = await createCategory(
        newCategoryName,
        newCategoryDescription || undefined,
      );

      if (result.success && result.category) {
        setCategories((prev) => [...prev, result.category!]);
        setFormData((prev) => ({
          ...prev,
          categoryId: result.category!.id.toString(),
        }));
        setNewCategoryName('');
        setNewCategoryDescription('');
        setShowNewCategoryForm(false);
        toast.success(`Category "${newCategoryName}" created successfully`);
      } else {
        toast.error(result.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('List name is required');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createListWithWords({
        name: formData.name.trim(),
        description: formData.description?.trim(),
        categoryId: parseInt(formData.categoryId),
        targetLanguageCode: formData.targetLanguageCode,
        difficultyLevel: formData.difficultyLevel,
        isPublic: formData.isPublic,
        tags,
        coverImageUrl: formData.coverImageUrl?.trim(),
        selectedDefinitionIds: [], // Empty list - words can be added later
      });

      if (result.success) {
        toast.success(`List "${formData.name}" created successfully`);
        onListCreated();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to create list');
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
      // Reset form
      setFormData({
        name: '',
        description: '',
        categoryId: '',
        targetLanguageCode: LanguageCode.da,
        difficultyLevel: DifficultyLevel.intermediate,
        isPublic: true,
        coverImageUrl: '',
      });
      setTags([]);
      setCurrentTag('');
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Public List</DialogTitle>
          <DialogDescription>
            Create a new public vocabulary list that can be used by all users
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* List Name */}
          <div className="space-y-2">
            <Label htmlFor="name">List Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter list name..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe this word list..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => handleInputChange('categoryId', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* New Category Form */}
            {!showNewCategoryForm ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewCategoryForm(true)}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Category
              </Button>
            ) : (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="newCategoryName">New Category Name</Label>
                  <Input
                    id="newCategoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name..."
                    disabled={isCreatingCategory}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newCategoryDescription">Description</Label>
                  <Input
                    id="newCategoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Enter category description..."
                    disabled={isCreatingCategory}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isCreatingCategory}
                  >
                    {isCreatingCategory ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isCreatingCategory}
                    onClick={() => {
                      setShowNewCategoryForm(false);
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Target Language - now single column since base language removed */}
          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Target Language</Label>
            <Select
              value={formData.targetLanguageCode}
              onValueChange={(value) =>
                handleInputChange('targetLanguageCode', value as LanguageCode)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languageDisplayNames).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={formData.difficultyLevel}
              onValueChange={(value) =>
                handleInputChange('difficultyLevel', value as DifficultyLevel)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-info-subtle text-info-foreground px-2 py-1 rounded text-sm"
                >
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeTag(tag)}
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!currentTag.trim() || isSubmitting}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ImageSelector
              onImageSelect={(imageUrl) =>
                handleInputChange('coverImageUrl', imageUrl)
              }
              selectedImageUrl={formData.coverImageUrl}
              searchPlaceholder="Search for list cover images..."
              triggerButtonText="Choose Cover Image"
              dialogTitle="Select Cover Image for List"
            />
            <Input
              value={formData.coverImageUrl}
              onChange={(e) =>
                handleInputChange('coverImageUrl', e.target.value)
              }
              placeholder="Or paste image URL directly"
              type="url"
              disabled={isSubmitting}
            />
          </div>

          {/* Public/Private */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) =>
                handleInputChange('isPublic', !!checked)
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isPublic">Make this list public</Label>
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
              disabled={
                !formData.name.trim() || !formData.categoryId || isSubmitting
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create List
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
