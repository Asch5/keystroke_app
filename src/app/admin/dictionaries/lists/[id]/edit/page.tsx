'use client';

import { ArrowLeft, Save, Plus, X, Edit } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import React, { useState, useEffect, useActionState } from 'react';
import { ImageSelector } from '@/components/features/dictionary';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  getListDetails,
  fetchCategories,
  updateListAction,
  createCategory,
  type ListWithDetails,
  type CategoryData,
} from '@/core/domains/dictionary/actions';
import { DifficultyLevel } from '@/core/types';

// Difficulty level display names
const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

export default function EditListPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;

  // Form state
  const [state, formAction] = useActionState(
    updateListAction.bind(null, listId),
    null,
  );

  // Component state
  const [list, setList] = useState<ListWithDetails | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Form data
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    categoryId: string;
    difficultyLevel: DifficultyLevel;
    isPublic: boolean;
    coverImageUrl: string;
  }>({
    name: '',
    description: '',
    categoryId: '',
    difficultyLevel: DifficultyLevel.intermediate,
    isPublic: false,
    coverImageUrl: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [listDetails, categoriesResult] = await Promise.all([
          getListDetails(listId),
          fetchCategories(),
        ]);

        if (listDetails) {
          setList(listDetails);
          setFormData({
            name: listDetails.name,
            description: listDetails.description ?? '',
            categoryId: listDetails.categoryId.toString(),
            difficultyLevel: listDetails.difficultyLevel,
            isPublic: listDetails.isPublic,
            coverImageUrl: listDetails.coverImageUrl ?? '',
          });
          setTags(listDetails.tags);
        } else {
          setError('List not found');
        }

        if (categoriesResult.success && categoriesResult.categories) {
          setCategories(categoriesResult.categories);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load list data');
      } finally {
        setIsLoading(false);
      }
    };

    if (listId) {
      loadData();
    }
  }, [listId]);

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

  /**
   * Handle creating a new category
   */
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    setIsCreatingCategory(true);
    try {
      const result = await createCategory(
        newCategoryName,
        newCategoryDescription ?? undefined,
      );

      if (result.success && result.category) {
        // Update categories list with the new category
        setCategories((prev) => [...prev, result.category!]);

        // Select the new category
        setFormData((prev) => ({
          ...prev,
          categoryId: result.category!.id.toString(),
        }));

        // Reset and close the form
        setNewCategoryName('');
        setNewCategoryDescription('');
        setShowNewCategoryForm(false);
      } else {
        console.error('Failed to create category:', result.error);
        // Could add toast notification here for better UX
      }
    } catch (error) {
      console.error('Error creating category:', error);
      // Could add toast notification here for better UX
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = (formDataSubmit: FormData) => {
    // Add our component state to form data
    formDataSubmit.set('tags', tags.join(','));
    formAction(formDataSubmit);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span>Loading list data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>{error ?? 'List not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dictionaries/lists')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/admin/dictionaries/lists/${list.id}`)
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <div>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Edit List: {list.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  List ID: {list.id}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>List Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className="space-y-4">
                {/* Show form state messages */}
                {state && !state.success && (
                  <Alert variant="destructive">
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                )}

                {state && state.success && (
                  <Alert>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                )}

                {/* List Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">List Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter list name"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Describe this word list"
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select
                    name="categoryId"
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      handleInputChange('categoryId', value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowNewCategoryForm(!showNewCategoryForm)
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Category
                    </Button>
                  </div>
                </div>

                {/* New Category Form */}
                {showNewCategoryForm && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Create New Category</h4>
                    <div className="space-y-2">
                      <Label htmlFor="newCategoryName">Category Name</Label>
                      <Input
                        id="newCategoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCategoryDescription">
                        Category Description
                      </Label>
                      <Input
                        id="newCategoryDescription"
                        value={newCategoryDescription}
                        onChange={(e) =>
                          setNewCategoryDescription(e.target.value)
                        }
                        placeholder="Enter category description"
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

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                  <Select
                    name="difficultyLevel"
                    value={formData.difficultyLevel}
                    onValueChange={(value) =>
                      handleInputChange(
                        'difficultyLevel',
                        value as DifficultyLevel,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(difficultyDisplayNames).map(
                        ([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="pr-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                    triggerButtonText="Change Cover Image"
                    dialogTitle="Select Cover Image for List"
                  />
                  <Input
                    id="coverImageUrl"
                    name="coverImageUrl"
                    value={formData.coverImageUrl}
                    onChange={(e) =>
                      handleInputChange('coverImageUrl', e.target.value)
                    }
                    placeholder="Or paste image URL directly"
                    className="mt-2"
                  />
                </div>

                {/* Public/Private */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      handleInputChange('isPublic', !!checked)
                    }
                  />
                  <Label htmlFor="isPublic">Make this list public</Label>
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      router.push(`/admin/dictionaries/lists/${list.id}`)
                    }
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Current List Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current List Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Current Name</Label>
                <p className="text-sm text-muted-foreground">{list.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <p className="text-sm text-muted-foreground">
                  {list.categoryName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Word Count</Label>
                <p className="text-sm text-muted-foreground">
                  {list.wordCount} words
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Active Users</Label>
                <p className="text-sm text-muted-foreground">
                  {list.userListCount} users
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(list.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Modified</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(list.lastModified).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <Alert>
            <AlertDescription>
              <strong>Note:</strong> Changes to this list will affect all users
              who have added it to their personal collections. Consider the
              impact on {list.userListCount} active users before making
              significant changes.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
