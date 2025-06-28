'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getListWords,
  removeWordsFromList,
  getListDetails,
  type AdminListWordWithDetails,
  type ListWithDetails,
} from '@/core/domains/dictionary/actions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Search,
  Trash2,
  SortAsc,
  SortDesc,
  Play,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import { partOfSpeechDisplayNames } from '@/components/features/admin/dictionary/AdminDictionaryConstants';

// Types for the delete dialog
interface DeleteDialogState {
  open: boolean;
  wordTexts: string[];
  definitionIds: number[];
}

export default function AdminListWordsPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;

  const [list, setList] = useState<ListWithDetails | null>(null);
  const [words, setWords] = useState<AdminListWordWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'word' | 'orderIndex' | 'partOfSpeech'>(
    'orderIndex',
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Selection states
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    wordTexts: [],
    definitionIds: [],
  });

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Language functionality removed - now only using DefinitionToOneWord translations

  // Fetch list details and words
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch list details
      const listDetails = await getListDetails(listId);
      if (!listDetails) {
        setError('List not found');
        return;
      }
      setList(listDetails);

      // Fetch words with current filters
      const wordsResult = await getListWords(listId, {
        search: searchQuery,
        sortBy,
        sortOrder,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });

      setWords(wordsResult.words);
      setTotalCount(wordsResult.totalCount);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load list data');
    } finally {
      setLoading(false);
    }
  }, [listId, searchQuery, sortBy, sortOrder, currentPage]);

  // Initial load and refetch on filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle word selection
  const handleWordSelect = (definitionId: number, checked: boolean) => {
    const newSelected = new Set(selectedWords);
    if (checked) {
      newSelected.add(definitionId);
    } else {
      newSelected.delete(definitionId);
    }
    setSelectedWords(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allDefinitionIds = new Set(words.map((word) => word.definitionId));
      setSelectedWords(allDefinitionIds);
    } else {
      setSelectedWords(new Set());
    }
  };

  // Handle remove words
  const handleRemoveWords = () => {
    if (selectedWords.size === 0) {
      toast.error('Please select words to remove');
      return;
    }

    const selectedWordTexts = words
      .filter((word) => selectedWords.has(word.definitionId))
      .map((word) => word.word);

    setDeleteDialog({
      open: true,
      wordTexts: selectedWordTexts,
      definitionIds: Array.from(selectedWords),
    });
  };

  // Confirm remove words
  const confirmRemoveWords = async () => {
    if (deleteDialog.definitionIds.length === 0) return;

    try {
      const result = await removeWordsFromList(
        listId,
        deleteDialog.definitionIds,
      );

      if (result.success) {
        toast.success(result.message);
        setSelectedWords(new Set());
        await fetchData(); // Refresh data
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error removing words:', error);
      toast.error('Failed to remove words from list');
    } finally {
      setDeleteDialog({ open: false, wordTexts: [], definitionIds: [] });
    }
  };

  // Handle audio playback
  const handlePlayAudio = async (wordText: string, audioUrl: string | null) => {
    if (isPlayingAudio) {
      AudioService.stopCurrentAudio();
      setIsPlayingAudio(false);
      setPlayingWordId(null);
      return;
    }

    // Only play if audio URL exists in database
    if (!audioUrl) {
      toast.error('No audio available for this word');
      return;
    }

    try {
      setIsPlayingAudio(true);
      setPlayingWordId(wordText);

      await AudioService.playAudioFromDatabase(audioUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    } finally {
      setIsPlayingAudio(false);
      setPlayingWordId(null);
    }
  };

  // Handle sort change
  const handleSort = (column: 'word' | 'orderIndex' | 'partOfSpeech') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading && !words.length) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Loading list words...</span>
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
                onClick={() =>
                  router.push(`/admin/dictionaries/lists/${listId}`)
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List Details
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Manage Words</h1>
                <p className="text-sm text-muted-foreground">
                  {list.name} • {totalCount} words
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Sort */}
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [column, order] = value.split('-') as [
                    typeof sortBy,
                    'asc' | 'desc',
                  ];
                  setSortBy(column);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orderIndex-asc">Order (A→Z)</SelectItem>
                  <SelectItem value="orderIndex-desc">Order (Z→A)</SelectItem>
                  <SelectItem value="word-asc">Word (A→Z)</SelectItem>
                  <SelectItem value="word-desc">Word (Z→A)</SelectItem>
                  <SelectItem value="partOfSpeech-asc">
                    Part of Speech (A→Z)
                  </SelectItem>
                  <SelectItem value="partOfSpeech-desc">
                    Part of Speech (Z→A)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedWords.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleRemoveWords}
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove ({selectedWords.size})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Words Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      words.length > 0 && selectedWords.size === words.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('orderIndex')}
                >
                  <div className="flex items-center">
                    Order
                    {sortBy === 'orderIndex' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('word')}
                >
                  <div className="flex items-center">
                    Word
                    {sortBy === 'word' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>Translation</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('partOfSpeech')}
                >
                  <div className="flex items-center">
                    Part of Speech
                    {sortBy === 'partOfSpeech' &&
                      (sortOrder === 'asc' ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>Audio</TableHead>
                <TableHead>Image</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {words.map((word) => (
                <TableRow key={word.definitionId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedWords.has(word.definitionId)}
                      onCheckedChange={(checked) =>
                        handleWordSelect(word.definitionId, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {word.orderIndex}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {word.word}
                      {word.phoneticTranscription && (
                        <div className="text-sm text-muted-foreground">
                          [{word.phoneticTranscription}]
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Translation Column - Show only DefinitionToOneWord or dash */}
                    {word.oneWordTranslation ? (
                      <span className="text-sm">{word.oneWordTranslation}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md text-sm">{word.definition}</div>
                  </TableCell>
                  <TableCell>
                    {word.partOfSpeech && (
                      <Badge variant="outline">
                        {partOfSpeechDisplayNames[word.partOfSpeech]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {word.audioUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handlePlayAudio(word.word, word.audioUrl)
                        }
                        disabled={isPlayingAudio && playingWordId === word.word}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="opacity-50"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {word.imageUrl && (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {words.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? 'No words found matching your search.'
                : 'No words in this list yet.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{' '}
                words
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, wordTexts: [], definitionIds: [] })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Words from List</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove these{' '}
              {deleteDialog.definitionIds.length} words from the list?
              <div className="mt-2 max-h-32 overflow-y-auto">
                <div className="text-sm font-medium">
                  {deleteDialog.wordTexts.slice(0, 5).join(', ')}
                  {deleteDialog.wordTexts.length > 5 &&
                    ` and ${deleteDialog.wordTexts.length - 5} more...`}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({
                  open: false,
                  wordTexts: [],
                  definitionIds: [],
                })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveWords}>
              Remove Words
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
