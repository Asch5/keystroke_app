'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, ChevronDown } from 'lucide-react';
import { PartOfSpeech, SourceType } from '@prisma/client';
import type { DictionaryWordDetails } from '@/core/domains/dictionary/actions';
import {
  FilterState,
  partOfSpeechDisplayNames,
  sourceTypeDisplayNames,
} from './AdminDictionaryConstants';

interface AdminDictionaryFiltersProps {
  filters: FilterState;
  onFilterChange: (
    filterType: keyof FilterState,
    value: PartOfSpeech | SourceType | boolean | null,
    checked?: boolean,
  ) => void;
  onClearAllFilters: () => void;
  filtersOpen: boolean;
  onFiltersToggle: () => void;
  wordDetails: DictionaryWordDetails[];
  filteredWordDetails: DictionaryWordDetails[];
}

/**
 * Filters section for the admin dictionaries page
 * Provides comprehensive filtering options for word details
 */
export function AdminDictionaryFilters({
  filters,
  onFilterChange,
  onClearAllFilters,
  filtersOpen,
  onFiltersToggle,
  wordDetails,
  filteredWordDetails,
}: AdminDictionaryFiltersProps) {
  // Get unique values for filters
  const availablePartsOfSpeech = React.useMemo(() => {
    const unique = Array.from(
      new Set(wordDetails.map((item) => item.partOfSpeech)),
    );
    return unique.sort();
  }, [wordDetails]);

  const availableSources = React.useMemo(() => {
    const unique = Array.from(new Set(wordDetails.map((item) => item.source)));
    return unique.sort();
  }, [wordDetails]);

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={onFiltersToggle}
      >
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters ({filteredWordDetails.length} of {wordDetails.length} items)
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
        />
      </Button>
      {filtersOpen && (
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Part of Speech Filter */}
            <div className="space-y-2">
              <h4 className="font-medium">Part of Speech</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availablePartsOfSpeech.map((pos) => (
                  <div key={pos} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pos-${pos}`}
                      checked={filters.partOfSpeech.includes(pos)}
                      onCheckedChange={(checked) =>
                        onFilterChange('partOfSpeech', pos, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`pos-${pos}`}
                      className="text-sm cursor-pointer"
                    >
                      {partOfSpeechDisplayNames[pos] || pos}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Filter */}
            <div className="space-y-2">
              <h4 className="font-medium">Source</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableSources.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={filters.source.includes(source)}
                      onCheckedChange={(checked) =>
                        onFilterChange('source', source, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`source-${source}`}
                      className="text-sm cursor-pointer"
                    >
                      {sourceTypeDisplayNames[source] || source}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Boolean Filters */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Media & Variants</h4>

                {/* Audio Filter */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Audio</span>
                  <Select
                    value={filters.hasAudio?.toString() || 'all'}
                    onValueChange={(value) =>
                      onFilterChange(
                        'hasAudio',
                        value === 'all' ? null : value === 'true',
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Has Audio</SelectItem>
                      <SelectItem value="false">No Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Filter */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Image</span>
                  <Select
                    value={filters.hasImage?.toString() || 'all'}
                    onValueChange={(value) =>
                      onFilterChange(
                        'hasImage',
                        value === 'all' ? null : value === 'true',
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Has Image</SelectItem>
                      <SelectItem value="false">No Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Variant Filter */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Variant</span>
                  <Select
                    value={filters.hasVariant?.toString() || 'all'}
                    onValueChange={(value) =>
                      onFilterChange(
                        'hasVariant',
                        value === 'all' ? null : value === 'true',
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Has Variant</SelectItem>
                      <SelectItem value="false">No Variant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Definition Filter */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Definition</span>
                  <Select
                    value={filters.hasDefinition?.toString() || 'all'}
                    onValueChange={(value) =>
                      onFilterChange(
                        'hasDefinition',
                        value === 'all' ? null : value === 'true',
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="true">Has Definition</SelectItem>
                      <SelectItem value="false">No Definition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClearAllFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
