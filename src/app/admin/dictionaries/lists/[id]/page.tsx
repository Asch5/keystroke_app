'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  getListDetails,
  type ListWithDetails,
} from '@/core/domains/dictionary/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  Edit,
  Globe,
  Lock,
  Users,
  BookOpen,
  Tag,
  BarChart3,
  Clock,
  Languages,
  Target,
} from 'lucide-react';
import { LanguageCode, DifficultyLevel } from '@/core/types';

// Language and difficulty display names
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

export default function ListDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<ListWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const listDetails = await getListDetails(listId);
        if (listDetails) {
          setList(listDetails);
        } else {
          setError('List not found');
        }
      } catch (err) {
        console.error('Error loading list details:', err);
        setError('Failed to load list details');
      } finally {
        setIsLoading(false);
      }
    };

    if (listId) {
      loadListDetails();
    }
  }, [listId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span>Loading list details...</span>
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
          <AlertDescription>{error || 'List not found'}</AlertDescription>
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
                onClick={() => router.push('/admin/dictionaries/lists')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Lists
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{list.name}</h1>
                <p className="text-sm text-muted-foreground">
                  List ID: {list.id}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/admin/dictionaries/lists/${list.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit List
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Image */}
              {list.coverImageUrl && (
                <div>
                  <h4 className="font-medium mb-2">Cover Image</h4>
                  <div className="w-full h-48 relative bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={list.coverImageUrl}
                      alt={`${list.name} cover`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 66vw"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">
                  {list.description || 'No description provided'}
                </p>
              </div>

              {/* Category */}
              <div>
                <h4 className="font-medium mb-2">Category</h4>
                <Badge variant="outline" className="text-sm">
                  {list.categoryName}
                </Badge>
                {list.categoryDescription && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {list.categoryDescription}
                  </p>
                )}
              </div>

              {/* Languages */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Languages className="h-4 w-4 mr-1" />
                  Languages
                </h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {languageDisplayNames[list.targetLanguageCode]}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    Vocabulary Language
                  </span>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  Difficulty Level
                </h4>
                <Badge
                  className={difficultyColors[list.difficultyLevel]}
                  variant="secondary"
                >
                  {difficultyDisplayNames[list.difficultyLevel]}
                </Badge>
              </div>

              {/* Tags */}
              {list.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {list.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Visibility */}
              <div>
                <h4 className="font-medium mb-2">Visibility</h4>
                <div className="flex items-center">
                  {list.isPublic ? (
                    <Badge variant="outline" className="text-green-600">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-600">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Words */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Words</CardTitle>
              <p className="text-sm text-muted-foreground">
                First {Math.min(list.sampleWords.length, 10)} words in this list
              </p>
            </CardHeader>
            <CardContent>
              {list.sampleWords.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {list.sampleWords.slice(0, 10).map((word, index) => (
                    <div
                      key={index}
                      className="p-2 rounded text-sm text-center"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No words in this list yet
                </p>
              )}
              {list.wordCount > 10 && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  ...and {list.wordCount - 10} more words
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Words
                  </span>
                  <span className="font-medium">{list.wordCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Words Learned
                  </span>
                  <span className="font-medium">{list.learnedWordCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Progress
                  </span>
                  <span className="font-medium">
                    {list.wordCount > 0
                      ? Math.round(
                          (list.learnedWordCount / list.wordCount) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    Active Users
                  </span>
                  <span className="font-medium">{list.userListCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Creators
                  </span>
                  <span className="font-medium">{list.creatorCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(list.createdAt).toLocaleDateString()} at{' '}
                      {new Date(list.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(list.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(list.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Modified</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(list.lastModified).toLocaleDateString()} at{' '}
                      {new Date(list.lastModified).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/admin/dictionaries/lists/${list.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit List Details
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/admin/dictionaries/lists/${list.id}/words`)
                }
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Words
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/admin/dictionaries/lists/${list.id}/analytics`)
                }
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
