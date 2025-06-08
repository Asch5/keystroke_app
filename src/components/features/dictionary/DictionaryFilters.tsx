'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SortAsc, SortDesc, Star, Clock, Edit } from 'lucide-react';
import { LearningStatus, PartOfSpeech } from '@prisma/client';

interface DictionaryFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedStatus: LearningStatus[];
  onSelectedStatusChange: (value: LearningStatus[]) => void;
  selectedPartOfSpeech: PartOfSpeech[];
  onSelectedPartOfSpeechChange: (value: PartOfSpeech[]) => void;
  showFavoritesOnly: boolean;
  onShowFavoritesOnlyChange: (value: boolean) => void;
  showModifiedOnly: boolean;
  onShowModifiedOnlyChange: (value: boolean) => void;
  showNeedsReview: boolean;
  onShowNeedsReviewChange: (value: boolean) => void;
  sortBy: 'word' | 'progress' | 'lastReviewedAt' | 'masteryScore' | 'createdAt';
  onSortByChange: (
    value:
      | 'word'
      | 'progress'
      | 'lastReviewedAt'
      | 'masteryScore'
      | 'createdAt',
  ) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

/**
 * Dictionary Filters Component
 *
 * Handles search, filtering, and sorting controls for the dictionary
 * Extracted from MyDictionaryContent to improve component modularity
 */
export function DictionaryFilters({
  searchQuery,
  onSearchQueryChange,
  selectedStatus,
  onSelectedStatusChange,
  selectedPartOfSpeech,
  onSelectedPartOfSpeechChange,
  showFavoritesOnly,
  onShowFavoritesOnlyChange,
  showModifiedOnly,
  onShowModifiedOnlyChange,
  showNeedsReview,
  onShowNeedsReviewChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
}: DictionaryFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filters
        </CardTitle>
        <CardDescription>Find and filter your vocabulary words</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search words, definitions, or notes..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Learning Status Filter */}
          <Select
            value={
              selectedStatus.length === 1
                ? (selectedStatus[0] as string)
                : 'all'
            }
            onValueChange={(value) =>
              onSelectedStatusChange(
                value === 'all' ? [] : [value as LearningStatus],
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Learning Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={LearningStatus.learned}>Learned</SelectItem>
              <SelectItem value={LearningStatus.inProgress}>
                Learning
              </SelectItem>
              <SelectItem value={LearningStatus.needsReview}>
                Needs Review
              </SelectItem>
              <SelectItem value={LearningStatus.difficult}>
                Difficult
              </SelectItem>
              <SelectItem value={LearningStatus.notStarted}>
                Not Started
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Part of Speech Filter */}
          <Select
            value={
              selectedPartOfSpeech.length === 1
                ? (selectedPartOfSpeech[0] as string)
                : 'all'
            }
            onValueChange={(value) =>
              onSelectedPartOfSpeechChange(
                value === 'all' ? [] : [value as PartOfSpeech],
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Part of Speech" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parts</SelectItem>
              <SelectItem value={PartOfSpeech.noun}>Noun</SelectItem>
              <SelectItem value={PartOfSpeech.verb}>Verb</SelectItem>
              <SelectItem value={PartOfSpeech.adjective}>Adjective</SelectItem>
              <SelectItem value={PartOfSpeech.adverb}>Adverb</SelectItem>
              <SelectItem value={PartOfSpeech.preposition}>
                Preposition
              </SelectItem>
              <SelectItem value={PartOfSpeech.conjunction}>
                Conjunction
              </SelectItem>
              <SelectItem value={PartOfSpeech.interjection}>
                Interjection
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={sortBy}
            onValueChange={(value) => onSortByChange(value as typeof sortBy)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Added</SelectItem>
              <SelectItem value="word">Word</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="lastReviewedAt">Last Reviewed</SelectItem>
              <SelectItem value="masteryScore">Mastery Score</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            onClick={() =>
              onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className="flex items-center gap-2"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => onShowFavoritesOnlyChange(!showFavoritesOnly)}
            className="flex items-center gap-1"
          >
            <Star className="h-3 w-3" />
            Favorites Only
          </Button>
          <Button
            variant={showNeedsReview ? 'default' : 'outline'}
            size="sm"
            onClick={() => onShowNeedsReviewChange(!showNeedsReview)}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Needs Review
          </Button>
          <Button
            variant={showModifiedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => onShowModifiedOnlyChange(!showModifiedOnly)}
            className="flex items-center gap-1"
          >
            <Edit className="h-3 w-3" />
            Modified Only
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
