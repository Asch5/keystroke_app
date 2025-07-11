'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type UserListFilters } from '@/core/domains/dictionary';
import { DifficultyLevel } from '@/core/types';

interface MyListsFiltersProps {
  userListFilters: UserListFilters;
  setUserListFilters: React.Dispatch<React.SetStateAction<UserListFilters>>;
}

const difficultyDisplayNames: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  proficient: 'Proficient',
};

/**
 * MyListsFilters component for filtering user's personal vocabulary lists
 * Features search, difficulty level, and sorting controls
 */
export function MyListsFilters({
  userListFilters,
  setUserListFilters,
}: MyListsFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search your lists..."
              value={userListFilters.search}
              onChange={(e) =>
                setUserListFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="w-full"
            />
          </div>

          <Select
            value={userListFilters.difficulty || 'all'}
            onValueChange={(value) => {
              const newFilters: UserListFilters = { ...userListFilters };
              if (value && value !== 'all') {
                newFilters.difficulty = value as DifficultyLevel;
              } else {
                delete newFilters.difficulty;
              }
              setUserListFilters(newFilters);
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

          <Select
            value={userListFilters.sortBy || 'createdAt'}
            onValueChange={(value) =>
              setUserListFilters((prev) => ({
                ...prev,
                sortBy: value as
                  | 'name'
                  | 'createdAt'
                  | 'progress'
                  | 'wordCount',
              }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="wordCount">Word Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
