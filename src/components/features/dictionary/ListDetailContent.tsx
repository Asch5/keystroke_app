'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
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
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUserListWords,
  removeWordFromUserList,
  populateInheritedListWithWords,
  type UserListWordWithDetails,
} from '@/core/domains/dictionary/actions/user-list-actions';
import { getUserSettings } from '@/core/domains/user/actions/user-settings-actions';
import { LanguageCode } from '@prisma/client';
import { AudioService } from '@/core/domains/dictionary/services/audio-service';
import {
  getDisplayDefinition,
  shouldShowTranslations,
} from '@/core/domains/user/utils/dictionary-display-utils';
import { cn } from '@/core/shared/utils/common/cn';

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
  userLanguages: initialUserLanguages = {
    base: 'en' as LanguageCode,
    target: 'da' as LanguageCode,
  },
}: ListDetailContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [listInfo, setListInfo] = useState<ListBasicInfo | null>(null);
  const [words, setWords] = useState<UserListWordWithDetails[]>([]);
  const [filteredWords, setFilteredWords] = useState<UserListWordWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userLanguages, setUserLanguages] = useState<{
    base: LanguageCode;
    target: LanguageCode;
  } | null>(null);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Remove word dialog
  const [removeDialog, setRemoveDialog] = useState({
    open: false,
    wordId: '',
    wordText: '',
    userDictionaryId: '',
  });

  // Add words to list dialog
  const [addWordsDialog, setAddWordsDialog] = useState({
    open: false,
  });

  // Load user settings
  const loadUserSettings = useCallback(async () => {
    try {
      const userSettings = await getUserSettings();
      if (
        userSettings &&
        userSettings.user &&
        userSettings.user.baseLanguageCode &&
        userSettings.user.targetLanguageCode
      ) {
        setUserLanguages({
          base: userSettings.user.baseLanguageCode,
          target: userSettings.user.targetLanguageCode,
        });
      } else {
        setUserLanguages(initialUserLanguages);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setUserLanguages(initialUserLanguages);
    }
  }, [initialUserLanguages]);

  // Load list info and words
  const loadData = useCallback(async () => {
    // Don't load data until we have user languages
    if (!userLanguages) {
      return;
    }

    try {
      setLoading(true);

      // Use the proper getUserListWords function with user languages
      const result = await getUserListWords(userId, listId, userLanguages, {
        sortBy: 'orderIndex',
        sortOrder: 'asc',
      });

      setListInfo(result.listDetails);
      setWords(result.words);
      setFilteredWords(result.words);
    } catch (error) {
      console.error('Error loading list data:', error);
      toast.error('Failed to load list data');
    } finally {
      setLoading(false);
    }
  }, [userId, listId, userLanguages]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  useEffect(() => {
    // Load data after user languages are available
    if (userLanguages) {
      loadData();
    }
  }, [loadData, userLanguages]);

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

  // Play word audio from database only (no fallback)
  const playWordAudio = useCallback(
    async (word: string, audioUrl: string | null, wordId: string) => {
      // Debug logging
      console.log('🔊 Audio playback requested:', {
        word,
        audioUrl,
        wordId,
        urlType: typeof audioUrl,
        urlLength: audioUrl?.length,
      });

      // Check if audio is available in database
      if (!audioUrl) {
        console.log('❌ No audio URL provided');
        toast.error('🔇 No audio available for this word', {
          description: 'Audio will be added to the database soon',
          duration: 3000,
        });
        return;
      }

      if (isPlayingAudio && playingWordId === wordId) {
        // Stop if already playing this word
        console.log('⏹️ Stopping current audio playback');
        setIsPlayingAudio(false);
        setPlayingWordId(null);
        return;
      }

      setIsPlayingAudio(true);
      setPlayingWordId(wordId);

      try {
        console.log('🎵 Attempting to play audio from URL:', audioUrl);
        // Only play from database - no fallback
        await AudioService.playAudioFromDatabase(audioUrl);
        console.log('✅ Audio playback successful');
        toast.success('🔊 Playing pronunciation', { duration: 2000 });
      } catch (error) {
        console.error('❌ Database audio playback failed:', error);
        console.error('Error details:', {
          error,
          audioUrl,
          word,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        // More specific error message based on the error
        let errorDescription = 'Please try again or contact support';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorDescription =
              'Audio file is taking too long to load. Check your internet connection.';
          } else if (error.message.includes('Network error')) {
            errorDescription =
              'Network error - please check your internet connection.';
          } else if (error.message.includes('not supported')) {
            errorDescription = 'Audio format not supported by your browser.';
          } else if (error.message.includes('corrupted')) {
            errorDescription = 'Audio file appears to be corrupted.';
          }
        }

        toast.error('Failed to play audio from database', {
          description: errorDescription,
          duration: 4000,
        });
      } finally {
        setIsPlayingAudio(false);
        setPlayingWordId(null);
      }
    },
    [isPlayingAudio, playingWordId],
  );

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
        <p className="text-gray-500 mt-2">
          This list may have been deleted or you may not have access to it.
        </p>
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
      <div className="flex items-center justify-between">
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
              <p className="text-gray-600 mt-1">
                {listInfo.displayDescription}
              </p>
            )}
          </div>
        </div>

        {/* Add Words Button */}
        <Button
          onClick={() => setAddWordsDialog({ open: true })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Words to List
        </Button>
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
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Progress</p>
                <p className="text-2xl font-bold">
                  {progressPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-500" />
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
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{listInfo.learnedWordCount} learned</span>
              <span>
                {listInfo.wordCount - listInfo.learnedWordCount} remaining
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search words in this list..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Words Table */}
      <Card>
        <CardHeader>
          <CardTitle>Words ({filteredWords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWords.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {searchTerm ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900">
                    No words found
                  </h3>
                  <p className="text-gray-500 mt-2">
                    No words match your search &quot;{searchTerm}&quot;
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm('')}
                    className="mt-4"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-gray-900">
                    No words yet
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Start building your vocabulary by adding words to this list
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => setAddWordsDialog({ open: true })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Words
                    </Button>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        startTransition(async () => {
                          try {
                            const result = await populateInheritedListWithWords(
                              userId,
                              listId,
                            );
                            if (result.success) {
                              toast.success(result.message);
                              await loadData();
                            } else {
                              toast.error(result.message);
                            }
                          } catch (error) {
                            console.error('Error populating list:', error);
                            toast.error('Failed to populate list');
                          }
                        });
                      }}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        'Load Original Words'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Translation</TableHead>
                  <TableHead>Definition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWords.map((word) => {
                  return (
                    <TableRow key={word.userDictionaryId}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{word.word}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {word.partOfSpeech}
                              {word.phoneticTranscription && (
                                <span className="font-mono ml-2">
                                  /{word.phoneticTranscription}/
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Audio Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'h-6 w-6 p-0 hover:bg-muted',
                              !word.audioUrl && 'opacity-50 cursor-not-allowed',
                            )}
                            title={
                              word.audioUrl
                                ? 'Play pronunciation'
                                : 'No audio available'
                            }
                            disabled={
                              isPlayingAudio &&
                              playingWordId !== word.userDictionaryId
                            }
                            onClick={() =>
                              playWordAudio(
                                word.word,
                                word.audioUrl,
                                word.userDictionaryId,
                              )
                            }
                          >
                            {word.audioUrl ? (
                              <Volume2
                                className={cn(
                                  'h-3 w-3 text-blue-600',
                                  isPlayingAudio &&
                                    playingWordId === word.userDictionaryId &&
                                    'animate-pulse',
                                )}
                              />
                            ) : (
                              <VolumeX className="h-3 w-3 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* Translation Column - Show only DefinitionToOneWord or dash */}
                        {word.oneWordTranslation ? (
                          <span className="text-sm">
                            {word.oneWordTranslation}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm">
                            {userLanguages &&
                            shouldShowTranslations(
                              userLanguages.base,
                              userLanguages.target,
                            )
                              ? getDisplayDefinition(
                                  {
                                    definition: word.definition,
                                    targetLanguageCode: userLanguages.target,
                                    translations: word.translations.map(
                                      (t) => ({
                                        id: t.id,
                                        languageCode: t.languageCode,
                                        content: t.translatedText,
                                      }),
                                    ),
                                  },
                                  userLanguages.base,
                                ).content
                              : word.definition}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(word.learningStatus)}>
                          {word.learningStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">{word.masteryScore}%</div>
                          <div className="text-xs text-gray-500">
                            ({word.reviewCount} reviews)
                          </div>
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
                                  wordId: word.userDictionaryId,
                                  wordText: word.word,
                                  userDictionaryId: word.userDictionaryId,
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
                  );
                })}
              </TableBody>
            </Table>
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
              dictionary, only from this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromList}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Words Dialog - Navigate to My Dictionary with Add to List workflow */}
      <AlertDialog
        open={addWordsDialog.open}
        onOpenChange={(open) => setAddWordsDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Words to List</AlertDialogTitle>
            <AlertDialogDescription>
              To add words to this list, go to your dictionary and use the
              &quot;Add to List&quot; option for each word you want to add. This
              allows you to select specific words from your personal vocabulary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setAddWordsDialog({ open: false });
                router.push('/dashboard/dictionary/my-dictionary');
              }}
            >
              Go to My Dictionary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
