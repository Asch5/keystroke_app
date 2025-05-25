'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  fetchDictionaryWordDetails,
  type DictionaryWordDetails,
} from '@/core/domains/dictionary/actions';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowUpDown,
  Edit,
  Search,
  Plus,
  Play,
  Pause,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { LanguageCode, PartOfSpeech, SourceType } from '@prisma/client';

// Map for display names of language codes
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
};

// Map for display names of parts of speech
const partOfSpeechDisplayNames: Record<PartOfSpeech, string> = {
  noun: 'Noun',
  verb: 'Verb',
  phrasal_verb: 'Phrasal Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
  numeral: 'Numeral',
  article: 'Article',
  exclamation: 'Exclamation',
  abbreviation: 'Abbreviation',
  suffix: 'Suffix',
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Undefined',
};

// Map for display names of source types
const sourceTypeDisplayNames: Record<SourceType, string> = {
  ai_generated: 'AI Generated',
  merriam_learners: 'Merriam Learners',
  merriam_intermediate: 'Merriam Intermediate',
  helsinki_nlp: 'Helsinki NLP',
  danish_dictionary: 'Danish Dictionary',
  user: 'User',
  admin: 'Admin',
};

interface FilterState {
  partOfSpeech: PartOfSpeech[];
  source: SourceType[];
  hasAudio: boolean | null;
  hasImage: boolean | null;
  hasVariant: boolean | null;
}

export default function DictionariesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    LanguageCode.en,
  );
  const [wordDetails, setWordDetails] = useState<DictionaryWordDetails[]>([]);
  const [filteredWordDetails, setFilteredWordDetails] = useState<
    DictionaryWordDetails[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    partOfSpeech: [],
    source: [],
    hasAudio: null,
    hasImage: null,
    hasVariant: null,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const applyFilters = useCallback(() => {
    let filtered = wordDetails;

    // Filter by part of speech
    if (filters.partOfSpeech.length > 0) {
      filtered = filtered.filter((item) =>
        filters.partOfSpeech.includes(item.partOfSpeech),
      );
    }

    // Filter by source
    if (filters.source.length > 0) {
      filtered = filtered.filter((item) =>
        filters.source.includes(item.source),
      );
    }

    // Filter by audio
    if (filters.hasAudio !== null) {
      filtered = filtered.filter(
        (item) => !!item.audioUrl === filters.hasAudio,
      );
    }

    // Filter by image
    if (filters.hasImage !== null) {
      filtered = filtered.filter((item) => item.hasImage === filters.hasImage);
    }

    // Filter by variant
    if (filters.hasVariant !== null) {
      filtered = filtered.filter(
        (item) => !!item.variant === filters.hasVariant,
      );
    }

    setFilteredWordDetails(filtered);
  }, [wordDetails, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    async function loadWordDetails() {
      setIsLoading(true);
      try {
        const fetchedWordDetails =
          await fetchDictionaryWordDetails(selectedLanguage);
        setWordDetails(fetchedWordDetails);
      } catch (error) {
        console.error('Error loading word details:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWordDetails();
  }, [selectedLanguage]);

  const playAudio = async (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      return;
    }

    try {
      const audio = new Audio(audioUrl);
      setPlayingAudio(audioUrl);

      audio.onended = () => setPlayingAudio(null);
      audio.onerror = () => setPlayingAudio(null);

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlayingAudio(null);
    }
  };

  const handleFilterChange = (
    filterType: keyof FilterState,
    value: PartOfSpeech | SourceType | boolean | null,
    checked?: boolean,
  ) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (filterType === 'partOfSpeech') {
        const currentArray = newFilters.partOfSpeech;
        if (checked) {
          newFilters.partOfSpeech = [...currentArray, value as PartOfSpeech];
        } else {
          newFilters.partOfSpeech = currentArray.filter(
            (item) => item !== value,
          );
        }
      } else if (filterType === 'source') {
        const currentArray = newFilters.source;
        if (checked) {
          newFilters.source = [...currentArray, value as SourceType];
        } else {
          newFilters.source = currentArray.filter((item) => item !== value);
        }
      } else {
        newFilters[filterType] = value as boolean | null;
      }

      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      partOfSpeech: [],
      source: [],
      hasAudio: null,
      hasImage: null,
      hasVariant: null,
    });
  };

  const columns: ColumnDef<DictionaryWordDetails>[] = [
    {
      accessorKey: 'wordText',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Word
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'partOfSpeech',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Part of Speech
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const pos = row.getValue('partOfSpeech') as PartOfSpeech;
        return (
          <span className="capitalize">
            {partOfSpeechDisplayNames[pos] || pos}
          </span>
        );
      },
    },
    {
      accessorKey: 'variant',
      header: 'Variant',
      cell: ({ row }) => {
        const variant = row.getValue('variant') as string | null;
        return variant ? (
          <span className="text-muted-foreground italic">{variant}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'frequencyGeneral',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Freq. General
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const freq = row.getValue('frequencyGeneral') as number | null;
        return freq ? (
          <span className="tabular-nums">{freq.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'frequency',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Frequency
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const freq = row.getValue('frequency') as number | null;
        return freq ? (
          <span className="tabular-nums">{freq.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'source',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Source
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const source = row.getValue('source') as SourceType;
        return (
          <span className="text-sm">
            {sourceTypeDisplayNames[source] || source}
          </span>
        );
      },
    },
    {
      accessorKey: 'definition',
      header: 'Definition',
      cell: ({ row }) => {
        const definition = row.getValue('definition') as string;
        const fullDefinition = row.original.definitionFull;

        if (!definition) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-sm">{definition}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-md">
                <p className="text-sm">{fullDefinition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'audioUrl',
      header: 'Audio',
      cell: ({ row }) => {
        const audioUrl = row.getValue('audioUrl') as string | null;

        if (!audioUrl) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playAudio(audioUrl)}
            className="h-8 w-8 p-0"
          >
            {playingAudio === audioUrl ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        );
      },
    },
    {
      accessorKey: 'hasImage',
      header: 'Image',
      cell: ({ row }) => {
        const hasImage = row.getValue('hasImage') as boolean;
        const imageUrl = row.original.imageUrl;

        if (!hasImage || !imageUrl) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-green-600 font-medium">
                  ✓
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="max-w-xs">
                  <img
                    src={imageUrl}
                    alt="Word illustration"
                    className="max-w-full h-auto rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const wordDetail = row.original;

        return (
          <div className="flex space-x-2">
            <Link href={`/admin/dictionaries/edit-word/${wordDetail.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Link
              href={`/admin/dictionaries/word-details/${encodeURIComponent(wordDetail.wordText)}?lang=${selectedLanguage}`}
            >
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-1" />
                Check
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dictionary Word Details</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Language:</span>
              <Select
                value={selectedLanguage}
                onValueChange={(value) =>
                  setSelectedLanguage(value as LanguageCode)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
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
            <Link
              href={`/admin/dictionaries/add-new-word?language=${selectedLanguage}`}
            >
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Word
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters ({filteredWordDetails.length} of {wordDetails.length}{' '}
                items)
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
                              handleFilterChange(
                                'partOfSpeech',
                                pos,
                                checked as boolean,
                              )
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
                        <div
                          key={source}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`source-${source}`}
                            checked={filters.source.includes(source)}
                            onCheckedChange={(checked) =>
                              handleFilterChange(
                                'source',
                                source,
                                checked as boolean,
                              )
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
                            handleFilterChange(
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
                            handleFilterChange(
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
                            handleFilterChange(
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
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredWordDetails}
              searchColumn="wordText"
              searchPlaceholder="Search words..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
