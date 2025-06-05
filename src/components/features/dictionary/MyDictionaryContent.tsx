'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Book,
  Search,
  SortAsc,
  SortDesc,
  Star,
  StarOff,
  Play,
  Image as ImageIcon,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  X,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getUserDictionary,
  toggleWordFavorite,
  updateWordLearningStatus,
  removeWordFromUserDictionary,
  type UserDictionaryItem,
  type UserDictionaryFilters,
} from '@/core/domains/user/actions/user-dictionary-actions';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import {
  LearningStatus,
  PartOfSpeech,
  DifficultyLevel,
  LanguageCode,
} from '@prisma/client';
import { toast } from 'sonner';
import { AddToListDialog } from './AddToListDialog';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';

interface MyDictionaryContentProps {
  userId: string;
}

/**
 * My Dictionary content component
 *
 * Comprehensive dictionary management with filtering, sorting, search, and pagination
 */
export function MyDictionaryContent({ userId }: MyDictionaryContentProps) {
  const [words, setWords] = useState<UserDictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userLanguages, setUserLanguages] = useState<{
    base: LanguageCode;
    target: LanguageCode;
  } | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LearningStatus[]>([]);
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<
    PartOfSpeech[]
  >([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    DifficultyLevel[]
  >([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);
  const [showNeedsReview, setShowNeedsReview] = useState(false);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    wordId: string;
    wordText: string;
  }>({ open: false, wordId: '', wordText: '' });

  const [addToListDialog, setAddToListDialog] = useState<{
    open: boolean;
    wordText: string;
    definitionId: string;
  }>({ open: false, wordText: '', definitionId: '' });

  // Sort states
  const [sortBy, setSortBy] = useState<
    'word' | 'progress' | 'lastReviewedAt' | 'masteryScore' | 'createdAt'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pageSize = 20;

  // Fetch words with current filters
  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const filters: UserDictionaryFilters = {
        ...(searchQuery && { searchQuery }),
        ...(selectedStatus.length > 0 && { learningStatus: selectedStatus }),
        ...(selectedPartOfSpeech.length > 0 && {
          partOfSpeech: selectedPartOfSpeech,
        }),
        ...(selectedDifficulty.length > 0 && {
          difficultyLevel: selectedDifficulty,
        }),
        ...(showFavoritesOnly && { isFavorite: showFavoritesOnly }),
        ...(showModifiedOnly && { isModified: showModifiedOnly }),
        ...(showNeedsReview && { needsReview: showNeedsReview }),
        sortBy,
        sortOrder,
        page: currentPage,
        pageSize,
      };

      const result = await getUserDictionary(userId, filters);

      if (result && typeof result !== 'string') {
        setWords(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Error fetching dictionary words:', error);
      toast.error('Failed to load dictionary words');
    } finally {
      setLoading(false);
    }
  }, [
    userId,
    searchQuery,
    selectedStatus,
    selectedPartOfSpeech,
    selectedDifficulty,
    showFavoritesOnly,
    showModifiedOnly,
    showNeedsReview,
    sortBy,
    sortOrder,
    currentPage,
  ]);

  // Initial load and refetch on filter changes with debounced search
  useEffect(() => {
    const timeoutId = setTimeout(
      () => {
        fetchWords();
      },
      searchQuery ? 300 : 0,
    ); // 300ms delay for search, immediate for other filters

    return () => clearTimeout(timeoutId);
  }, [fetchWords]);

  // Load user settings on mount
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const userSettings = await getUserSettings();
        setUserLanguages({
          base: userSettings.user.baseLanguageCode,
          target: userSettings.user.targetLanguageCode,
        });
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedStatus,
    selectedPartOfSpeech,
    selectedDifficulty,
    showFavoritesOnly,
    showModifiedOnly,
    showNeedsReview,
    sortBy,
    sortOrder,
  ]);

  // Handle favorite toggle
  const handleToggleFavorite = async (wordId: string) => {
    try {
      const result = await toggleWordFavorite(userId, wordId);
      if ('success' in result && result.success) {
        toast.success('Favorite status updated');
        fetchWords(); // Refresh the list
      } else {
        toast.error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  };

  // Handle learning status update
  const handleStatusUpdate = async (
    wordId: string,
    newStatus: LearningStatus,
  ) => {
    try {
      const result = await updateWordLearningStatus(userId, wordId, newStatus);
      if ('success' in result && result.success) {
        toast.success('Learning status updated');
        fetchWords(); // Refresh the list
      } else {
        toast.error('Failed to update learning status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update learning status');
    }
  };

  // Handle word removal
  const handleRemoveWord = async (wordId: string, wordText: string) => {
    setDeleteDialog({ open: true, wordId, wordText });
  };

  const confirmRemoveWord = async () => {
    try {
      const result = await removeWordFromUserDictionary(
        userId,
        deleteDialog.wordId,
      );
      if ('success' in result && result.success) {
        toast.success('Word removed from dictionary');
        fetchWords(); // Refresh the list
      } else {
        toast.error('Failed to remove word');
      }
    } catch (error) {
      console.error('Error removing word:', error);
      toast.error('Failed to remove word');
    } finally {
      setDeleteDialog({ open: false, wordId: '', wordText: '' });
    }
  };

  // Handle add to list
  const handleAddToList = (wordText: string, userDictionaryId: string) => {
    setAddToListDialog({
      open: true,
      wordText,
      definitionId: userDictionaryId,
    });
  };

  const handleWordAddedToList = (listName: string) => {
    // Optionally refresh the word list or show some indication
    // that the word was added to a list
    toast.success(`Word added to "${listName}"`);
    fetchWords();
  };

  // Get status color
  const getStatusColor = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'bg-green-500 text-white';
      case LearningStatus.inProgress:
        return 'bg-blue-500 text-white';
      case LearningStatus.needsReview:
        return 'bg-yellow-500 text-black';
      case LearningStatus.difficult:
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Get status label
  const getStatusLabel = (status: LearningStatus) => {
    switch (status) {
      case LearningStatus.learned:
        return 'Learned';
      case LearningStatus.inProgress:
        return 'Learning';
      case LearningStatus.needsReview:
        return 'Review';
      case LearningStatus.difficult:
        return 'Difficult';
      case LearningStatus.notStarted:
        return 'Not Started';
      default:
        return status;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus([]);
    setSelectedPartOfSpeech([]);
    setSelectedDifficulty([]);
    setShowFavoritesOnly(false);
    setShowModifiedOnly(false);
    setShowNeedsReview(false);
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  if (loading && words.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search and Filters Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-26" />
            </div>
          </CardContent>
        </Card>

        {/* Results Summary Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filters
          </CardTitle>
          <CardDescription>
            Find and filter your vocabulary words
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search words, definitions, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
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
                setSelectedStatus(
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
                setSelectedPartOfSpeech(
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
                <SelectItem value={PartOfSpeech.adjective}>
                  Adjective
                </SelectItem>
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
              onValueChange={(value) => setSortBy(value as typeof sortBy)}
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
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
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
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="flex items-center gap-1"
            >
              <Star className="h-3 w-3" />
              Favorites Only
            </Button>
            <Button
              variant={showNeedsReview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNeedsReview(!showNeedsReview)}
              className="flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />
              Needs Review
            </Button>
            <Button
              variant={showModifiedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowModifiedOnly(!showModifiedOnly)}
              className="flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Modified Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {words.length} of {totalCount} words
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* Words Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Word</TableHead>
                <TableHead>Definition</TableHead>
                <TableHead>Lists</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Mastery</TableHead>
                <TableHead>Last Reviewed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {words.map((word) => (
                <TableRow key={word.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{word.word}</span>
                          {word.isFavorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                          {word.isModified && (
                            <Edit className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {word.partOfSpeech}{' '}
                          {word.variant && `• ${word.variant}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm truncate">
                        {userLanguages &&
                        shouldShowTranslations(
                          userLanguages.base,
                          userLanguages.target,
                        )
                          ? getDisplayDefinition(
                              {
                                definition: word.definition,
                                targetLanguageCode: userLanguages.target,
                                translations: word.translations,
                              },
                              userLanguages.base,
                            ).content
                          : word.definition}
                      </p>
                      {word.customNotes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Note: {word.customNotes}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {word.lists && word.lists.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {word.lists.slice(0, 2).map((listName, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {listName}
                            </Badge>
                          ))}
                          {word.lists.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{word.lists.length - 2} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No lists
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(word.learningStatus)}>
                      {getStatusLabel(word.learningStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={word.progress} className="h-2 w-16" />
                      <span className="text-xs text-muted-foreground">
                        {word.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {word.masteryScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {word.reviewCount} reviews
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {word.lastReviewedAt
                        ? new Date(word.lastReviewedAt).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleFavorite(word.id)}
                        >
                          {word.isFavorite ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from Favorites
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Add to Favorites
                            </>
                          )}
                        </DropdownMenuItem>
                        {word.audioUrl && (
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Play Audio
                          </DropdownMenuItem>
                        )}
                        {word.imageUrl && (
                          <DropdownMenuItem>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            View Image
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleAddToList(word.word, word.id)}
                        >
                          <Book className="h-4 w-4 mr-2" />
                          Add to List
                        </DropdownMenuItem>

                        {/* Dynamic Learning Status Actions */}
                        {word.learningStatus === LearningStatus.learned ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                word.id,
                                LearningStatus.inProgress,
                              )
                            }
                          >
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Unmark as Learned
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                word.id,
                                LearningStatus.learned,
                              )
                            }
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Mark as Learned
                          </DropdownMenuItem>
                        )}

                        {word.learningStatus === LearningStatus.needsReview ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                word.id,
                                LearningStatus.inProgress,
                              )
                            }
                          >
                            <X className="h-4 w-4 mr-2" />
                            Unmark for Review
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(
                                word.id,
                                LearningStatus.needsReview,
                              )
                            }
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Mark for Review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveWord(word.id, word.word)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from Dictionary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Empty State */}
      {words.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No words found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ||
              selectedStatus.length > 0 ||
              selectedPartOfSpeech.length > 0
                ? 'Try adjusting your search or filters'
                : 'Start building your vocabulary by adding your first word'}
            </p>
            {!searchQuery &&
              selectedStatus.length === 0 &&
              selectedPartOfSpeech.length === 0 && (
                <Button asChild>
                  <a href="/admin/dictionaries/add-new-word">
                    Add Your First Word
                  </a>
                </Button>
              )}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Word from Dictionary</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteDialog.wordText}
              &quot; from your dictionary? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, wordId: '', wordText: '' })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveWord}>
              Remove Word
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      {userLanguages && (
        <AddToListDialog
          isOpen={addToListDialog.open}
          onClose={() =>
            setAddToListDialog({ open: false, wordText: '', definitionId: '' })
          }
          userId={userId}
          userLanguages={userLanguages}
          wordText={addToListDialog.wordText}
          userDictionaryId={addToListDialog.definitionId}
          onWordAddedToList={handleWordAddedToList}
        />
      )}
    </div>
  );
}
