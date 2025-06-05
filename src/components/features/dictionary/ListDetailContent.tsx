'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Trash2,
  BookOpen,
  Users,
  Target,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserDictionary,
  type UserDictionaryItem,
  type UserDictionaryResponse,
} from '@/core/domains/user/actions/user-dictionary-actions';
import { removeWordFromUserList } from '@/core/domains/dictionary/actions/user-list-actions';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';
import { LanguageCode } from '@prisma/client';

interface ListDetailContentProps {
  userId: string;
  listId: string;
  userLanguages?: {
    base: LanguageCode;
    target: LanguageCode;
  };
}

interface ListBasicInfo {
  id: string;
  displayName: string;
  displayDescription: string | null;
  wordCount: number;
  learnedWordCount: number;
}

export function ListDetailContent({
  userId,
  listId,
  userLanguages = { base: 'en' as LanguageCode, target: 'da' as LanguageCode },
}: ListDetailContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [listInfo, setListInfo] = useState<ListBasicInfo | null>(null);
  const [words, setWords] = useState<UserDictionaryItem[]>([]);
  const [filteredWords, setFilteredWords] = useState<UserDictionaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Remove word dialog
  const [removeDialog, setRemoveDialog] = useState({
    open: false,
    wordId: '',
    wordText: '',
    userDictionaryId: '',
  });

  // Load list info and words
  const loadData = async () => {
    try {
      setLoading(true);

      // For now, we'll create a mock list info
      const mockListInfo: ListBasicInfo = {
        id: listId,
        displayName: 'My Test List',
        displayDescription: 'A sample vocabulary list for testing',
        wordCount: 0,
        learnedWordCount: 0,
      };
      setListInfo(mockListInfo);

      // Load all user dictionary words
      const response: UserDictionaryResponse = await getUserDictionary(userId);
      const allWords = response.items;

      setWords(allWords);
      setFilteredWords(allWords);

      // Update list info with actual word counts
      mockListInfo.wordCount = allWords.length;
      mockListInfo.learnedWordCount = allWords.filter(
        (w: UserDictionaryItem) => w.learningStatus === 'learned',
      ).length;
      setListInfo(mockListInfo);
    } catch (error) {
      console.error('Error loading list data:', error);
      toast.error('Failed to load list data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, listId]);

  // Filter words based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredWords(words);
    } else {
      const filtered = words.filter((word) =>
        word.word.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredWords(filtered);
    }
  }, [words, searchTerm]);

  // Handle remove word from list
  const handleRemoveFromList = async () => {
    startTransition(async () => {
      try {
        const result = await removeWordFromUserList(
          userId,
          listId,
          removeDialog.userDictionaryId,
        );

        if (result.success) {
          toast.success(result.message);
          await loadData();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Error removing word from list:', error);
        toast.error('Failed to remove word from list');
      } finally {
        setRemoveDialog({
          open: false,
          wordId: '',
          wordText: '',
          userDictionaryId: '',
        });
      }
    });
  };

  // Get learning status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'learned':
        return 'bg-green-500 text-white';
      case 'inProgress':
        return 'bg-blue-500 text-white';
      case 'needsReview':
        return 'bg-yellow-500 text-black';
      case 'difficult':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!listInfo) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">List not found</h2>
        <Button
          onClick={() => router.push('/dashboard/dictionary/lists')}
          className="mt-4"
        >
          Back to Lists
        </Button>
      </div>
    );
  }

  const progressPercentage =
    listInfo.wordCount > 0
      ? (listInfo.learnedWordCount / listInfo.wordCount) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/dictionary/lists')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lists
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{listInfo.displayName}</h1>
          {listInfo.displayDescription && (
            <p className="text-gray-600 mt-1">{listInfo.displayDescription}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Words</p>
                <p className="text-2xl font-bold">{listInfo.wordCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Learned</p>
                <p className="text-2xl font-bold">
                  {listInfo.learnedWordCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round(progressPercentage)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Remaining</p>
                <p className="text-2xl font-bold">
                  {listInfo.wordCount - listInfo.learnedWordCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Learning Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Words Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Words in List</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search words..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWords.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm
                  ? 'No matching words found'
                  : 'No words in this list'}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Start adding words to build your vocabulary list'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead>Definition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWords.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-medium">{word.word}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {shouldShowTranslations(
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(word.learningStatus)}
                          variant="secondary"
                        >
                          {word.learningStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <Progress value={word.masteryScore} className="h-2" />
                          <span className="text-xs text-gray-500 mt-1">
                            {Math.round(word.masteryScore)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
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
                              onClick={() =>
                                setRemoveDialog({
                                  open: true,
                                  wordId: word.id,
                                  wordText: word.word,
                                  userDictionaryId: word.id,
                                })
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from List
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Word Dialog */}
      <AlertDialog
        open={removeDialog.open}
        onOpenChange={(open) =>
          !open &&
          setRemoveDialog({
            open: false,
            wordId: '',
            wordText: '',
            userDictionaryId: '',
          })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Word from List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{removeDialog.wordText}
              &quot; from this list? This will not delete the word from your
              dictionary, only from this specific list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromList}
              disabled={isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
