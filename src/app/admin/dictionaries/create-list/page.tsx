'use client';

import { ArrowLeft, List, Plus, X } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';
import { useFormState } from 'react-dom';
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
  fetchDictionaryWordDetails,
  fetchCategories,
  createListAction,
  createCategory,
  type CategoryData,
} from '@/core/domains/dictionary/actions';
import { errorLog } from '@/core/infrastructure/monitoring/clientLogger';
import { LanguageCode, DifficultyLevel } from '@/core/types';

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

interface SelectedWordInfo {
  id: string;
  wordText: string;
  definition: string;
  partOfSpeech: string;
}

function CreateListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Form state
  const [state, formAction] = useFormState(createListAction, null);

  // Component state
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selectedWords, setSelectedWords] = useState<SelectedWordInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    difficultyLevel: DifficultyLevel.intermediate,
    isPublic: false,
    coverImageUrl: '',
  });

  // Get data from URL params
  const language =
    (searchParams.get('language') as LanguageCode) || LanguageCode.en;
  const selectedDefinitionIds =
    searchParams
      .get('selectedDefinitions')
      ?.split(',')
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id)) || [];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load categories
        const categoriesResult = await fetchCategories();
        if (categoriesResult.success && categoriesResult.categories) {
          setCategories(categoriesResult.categories);
        }

        // Load selected word details
        if (selectedDefinitionIds.length > 0) {
          const wordDetails = await fetchDictionaryWordDetails(language);
          const selectedWordInfo = wordDetails
            .filter((word) =>
              selectedDefinitionIds.includes(word.definitionId!),
            )
            .map((word) => ({
              id: word.id.toString(),
              wordText: word.wordText,
              definition: word.definition ?? '',
              partOfSpeech: word.partOfSpeech,
            }));
          setSelectedWords(selectedWordInfo);
        }
      } catch (error) {
        await errorLog(
          'Error loading data',
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Only depend on language, not selectedDefinitionIds to prevent infinite loops

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

  const removeWord = (wordId: string) => {
    setSelectedWords((prev) => prev.filter((word) => word.id !== wordId));
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
        await errorLog(
          'Failed to create category',
          result.error ?? 'Unknown error',
        );
        // Could add toast notification here for better UX
      }
    } catch (error) {
      await errorLog(
        'Error creating category',
        error instanceof Error ? error.message : String(error),
      );
      // Could add toast notification here for better UX
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = (formDataSubmit: FormData) => {
    // Add our component state to form data
    formDataSubmit.set('targetLanguageCode', language);
    formDataSubmit.set('tags', tags.join(','));
    formDataSubmit.set(
      'selectedDefinitionIds',
      selectedDefinitionIds.join(','),
    );

    formAction(formDataSubmit);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedWords.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertDescription>
                No words selected. Please go back to the dictionary page and
                select words first.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dictionaries')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dictionary
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <List className="h-5 w-5 mr-2" />
                Create Word List
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new vocabulary list with {selectedWords.length}{' '}
                selected words
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/dictionaries')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dictionary
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List Details Form */}
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
                    onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
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
                  triggerButtonText="Choose Cover Image"
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
                  onClick={() => router.push('/admin/dictionaries')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  Create Word List
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Selected Words Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Words ({selectedWords.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Language: {languageDisplayNames[language]}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedWords.map((word) => (
                <div
                  key={word.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{word.wordText}</span>
                      <Badge variant="outline" className="text-xs">
                        {word.partOfSpeech}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {word.definition}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWord(word.id)}
                    className="h-8 w-8 p-0 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreateListPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center items-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <span>Loading...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CreateListContent />
    </Suspense>
  );
}
