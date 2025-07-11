'use client';

import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LearningStatus, PartOfSpeech } from '@/core/types';

interface DictionaryEmptyStateProps {
  searchQuery: string;
  selectedStatus: LearningStatus[];
  selectedPartOfSpeech: PartOfSpeech[];
}

/**
 * Dictionary Empty State Component
 *
 * Displays appropriate empty state message based on current filters
 * Extracted from MyDictionaryContent to improve component modularity
 */
export function DictionaryEmptyState({
  searchQuery,
  selectedStatus,
  selectedPartOfSpeech,
}: DictionaryEmptyStateProps) {
  const hasFilters =
    searchQuery || selectedStatus.length > 0 || selectedPartOfSpeech.length > 0;

  return (
    <Card>
      <CardContent className="text-center py-12">
        <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No words found</h3>
        <p className="text-muted-foreground mb-6">
          {hasFilters
            ? 'Try adjusting your search or filters'
            : 'Start building your vocabulary by adding your first word'}
        </p>
        {!hasFilters && (
          <Button asChild>
            <a href="/dashboard/dictionary/add-word">Add Your First Word</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
