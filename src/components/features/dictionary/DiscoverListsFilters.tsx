'use client';

import { DifficultyLevel } from '@/core/types';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DiscoverListsFiltersProps {
  publicListFilters: { search: string; difficulty?: DifficultyLevel };
  setPublicListFilters: React.Dispatch<
    React.SetStateAction<{ search: string; difficulty?: DifficultyLevel }>
  >;
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

/**
 * DiscoverListsFilters component for filtering public and community vocabulary lists
 * Features search and difficulty level controls
 */
export function DiscoverListsFilters({
  publicListFilters,
  setPublicListFilters,
}: DiscoverListsFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search public lists..."
              value={publicListFilters.search}
              onChange={(e) =>
                setPublicListFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="w-full"
            />
          </div>

          <Select
            value={publicListFilters.difficulty || 'all'}
            onValueChange={(value) => {
              const newFilters = { ...publicListFilters };
              if (value && value !== 'all') {
                newFilters.difficulty = value as DifficultyLevel;
              } else {
                delete newFilters.difficulty;
              }
              setPublicListFilters(newFilters);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Object.entries(difficultyDisplayNames).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
