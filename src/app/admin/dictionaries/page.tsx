'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchDictionaryWordDetails,
  deleteSelectedWords,
  deleteWordAudio,
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
import { BulkDeleteConfirmDialog } from '@/components/shared/dialogs';
import { TTSControls } from '@/components/features/admin/dictionary/TTSControls';
import { toast } from 'sonner';
import {
  ArrowUpDown,
  Edit,
  Search,
  Plus,
  Play,
  Pause,
  ChevronDown,
  Filter,
  List,
  Trash2,
} from 'lucide-react';
import { LanguageCode, PartOfSpeech, SourceType } from '@prisma/client';
import Image from 'next/image';

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
  const router = useRouter();
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
  // Word selection state
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  // Delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Word selection handlers
  const toggleWordSelection = (wordDetailId: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordDetailId)) {
      newSelected.delete(wordDetailId);
    } else {
      newSelected.add(wordDetailId);
    }
    setSelectedWords(newSelected);
  };

  const selectAllWords = () => {
    const allWordIds = new Set(
      filteredWordDetails.map((word) => word.id.toString()),
    );
    setSelectedWords(allWordIds);
  };

  const clearSelection = () => {
    setSelectedWords(new Set());
  };

  const handleCreateWordList = () => {
    if (selectedWords.size === 0) {
      alert('Please select at least one word to create a list.');
      return;
    }

    // Convert selected word detail IDs to definition IDs
    const selectedDefinitionIds = filteredWordDetails
      .filter((word) => selectedWords.has(word.id.toString()))
      .map((word) => word.definitionId)
      .filter((id) => id !== undefined) as number[];

    // Navigate to list creation page with selected words
    const params = new URLSearchParams({
      language: selectedLanguage,
      selectedDefinitions: selectedDefinitionIds.join(','),
    });

    router.push(`/admin/dictionaries/create-list?${params.toString()}`);
  };

  const handleDeleteSelectedWords = async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word to delete.');
      return;
    }

    setIsDeleting(true);
    try {
      const wordDetailIds = Array.from(selectedWords);
      const result = await deleteSelectedWords(wordDetailIds);

      if (result.success) {
        toast.success(result.message);

        // Refresh the word list
        const fetchedWordDetails =
          await fetchDictionaryWordDetails(selectedLanguage);
        setWordDetails(fetchedWordDetails);

        // Clear selection
        setSelectedWords(new Set());
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting words:', error);
      toast.error('An unexpected error occurred while deleting words.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word to delete.');
      return;
    }
    setIsDeleteDialogOpen(true);
  };

  const handleAudioGenerated = async () => {
    // Refresh the word list to show updated audio status
    const fetchedWordDetails =
      await fetchDictionaryWordDetails(selectedLanguage);
    setWordDetails(fetchedWordDetails);
  };

  const handleDeleteAudio = async (wordId: number) => {
    try {
      const result = await deleteWordAudio(wordId);
      if (result.success) {
        toast.success(result.message);
        handleAudioGenerated(); // Refresh the list
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to delete audio');
      console.error('Audio deletion error:', error);
    }
  };

  const columns: ColumnDef<DictionaryWordDetails>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                selectAllWords();
              } else {
                clearSelection();
              }
            }}
            aria-label="Select all"
          />
          <span className="text-sm">Select</span>
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedWords.has(row.original.id.toString())}
          onCheckedChange={() =>
            toggleWordSelection(row.original.id.toString())
          }
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
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
          POS
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
          F.G.
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
          Freq.
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
      header: 'Definition of the word',
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
        const wordDetail = row.original;

        if (!audioUrl) {
          return <span className="text-muted-foreground">—</span>;
        }

        const isVercelBlob = audioUrl.includes(
          'public.blob.vercel-storage.com',
        );

        return (
          <div className="flex items-center space-x-2">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`text-xs px-1 py-0.5 rounded ${
                      isVercelBlob
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {isVercelBlob ? 'Blob' : 'B64'}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-sm">
                    {isVercelBlob
                      ? 'Stored in Vercel Blob Storage'
                      : 'Base64 encoded audio'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {audioUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAudio(wordDetail.wordId)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
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
                  <Image
                    src={imageUrl}
                    alt="Word illustration"
                    width={100}
                    height={100}
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
            <Link href={`/admin/dictionaries/edit-word/${wordDetail.wordId}`}>
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
            <div className="flex items-center space-x-2">
              <Link
                href={`/admin/dictionaries/add-new-word?language=${selectedLanguage}`}
              >
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Word
                </Button>
              </Link>
              <TTSControls
                selectedWords={selectedWords}
                selectedLanguage={selectedLanguage}
                wordDetails={filteredWordDetails}
                onAudioGenerated={handleAudioGenerated}
              />
              <Button
                onClick={handleCreateWordList}
                disabled={selectedWords.size === 0}
                variant="default"
              >
                <List className="h-4 w-4 mr-2" />
                Create Word List ({selectedWords.size})
              </Button>
              <Button
                onClick={openDeleteDialog}
                disabled={selectedWords.size === 0}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedWords.size})
              </Button>
            </div>
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

      {/* Delete Confirmation Dialog */}
      <BulkDeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteSelectedWords}
        selectedCount={selectedWords.size}
        isLoading={isDeleting}
      />
    </div>
  );
}
