import { Filter, Search } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LanguageCode, DifficultyLevel } from '@/core/types';
import type {
  ListFilters,
  CategoryData,
} from '@/core/domains/dictionary/actions';

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

interface AdminListsFiltersProps {
  filters: ListFilters;
  categories: CategoryData[];
  onFiltersChange: (filters: ListFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export function AdminListsFilters({
  filters,
  categories,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
}: AdminListsFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-content-tertiary" />
              <Input
                placeholder="Search lists..."
                value={filters.search}
                onChange={(e) =>
                  onFiltersChange({ ...filters, search: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category || ''}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  category: value === 'all' ? '' : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={filters.difficulty || ''}
              onValueChange={(value) => {
                const newFilters = { ...filters };
                if (value === 'all') {
                  delete newFilters.difficulty;
                } else {
                  newFilters.difficulty = value as DifficultyLevel;
                }
                onFiltersChange(newFilters);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All difficulties</SelectItem>
                {Object.entries(difficultyDisplayNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={filters.language || ''}
              onValueChange={(value) => {
                const newFilters = { ...filters };
                if (value === 'all') {
                  delete newFilters.language;
                } else {
                  newFilters.language = value as LanguageCode;
                }
                onFiltersChange(newFilters);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {Object.entries(languageDisplayNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 mt-4">
          <Button onClick={onApplyFilters}>Apply Filters</Button>
          <Button variant="outline" onClick={onResetFilters}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
