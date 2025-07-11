'use client';

import {
  Search,
  Plus,
  Loader2,
  Volume2,
  Image as ImageIcon,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  searchWordsForUser,
  addDefinitionToUserDictionary,
  removeDefinitionFromUserDictionary,
  type WordSearchResult,
} from '@/core/domains/dictionary';
import { LanguageCode, PartOfSpeech } from '@/core/types';
import { AddToListDialog } from './AddToListDialog';
import { errorLog } from '@/core/infrastructure/monitoring/clientLogger';

interface AddNewWordContentProps {
  userId: string;
  baseLanguageCode: LanguageCode;
  targetLanguageCode: LanguageCode;
}

/**
 * Part of speech display names for better UX
 */
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
  first_part: 'First Part',
  last_letter: 'Last Letter',
  adj_pl: 'Adjective Plural',
  symbol: 'Symbol',
  phrase: 'Phrase',
  sentence: 'Sentence',
  undefined: 'Other',
};

/**
 * Language display names
 */
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
  pl: 'Polish',
  hi: 'Hindi',
  ne: 'Nepali',
  tr: 'Turkish',
  sv: 'Swedish',
  no: 'Norwegian',
  fi: 'Finnish',
  ur: 'Urdu',
  fa: 'Persian',
  uk: 'Ukrainian',
  ro: 'Romanian',
  nl: 'Dutch',
  vi: 'Vietnamese',
  bn: 'Bengali',
  id: 'Indonesian',
};

export function AddNewWordContent({
  userId,
  baseLanguageCode,
  targetLanguageCode,
}: AddNewWordContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>(targetLanguageCode);
  const [searchResults, setSearchResults] = useState<WordSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Add to List Dialog state
  const [addToListDialog, setAddToListDialog] = useState<{
    open: boolean;
    wordText: string;
    userDictionaryId: string;
  }>({ open: false, wordText: '', userDictionaryId: '' });

  const userLanguages = {
    base: baseLanguageCode,
    target: targetLanguageCode,
  };

  const pageSize = 10;

  /**
   * Handle search for words
   */
  const handleSearch = useCallback(
    async (query: string, page = 1) => {
      if (!query.trim()) {
        setSearchResults([]);
        setTotalPages(0);
        setTotalCount(0);
        return;
      }

      setIsSearching(true);

      try {
        const result = await searchWordsForUser(
          query.trim(),
          selectedLanguage,
          userId,
          baseLanguageCode,
          page,
          pageSize,
        );

        setSearchResults(result.results);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setCurrentPage(page);
      } catch (error) {
        await errorLog(
          'Error searching words',
          error instanceof Error ? error.message : String(error),
        );
        toast.error('Failed to search words. Please try again.');
      } finally {
        setIsSearching(false);
      }
    },
    [selectedLanguage, userId, baseLanguageCode],
  );

  /**
   * Handle adding a definition to user's dictionary only
   */
  const handleAddDefinition = useCallback(
    async (definitionId: number) => {
      startTransition(async () => {
        try {
          const result = await addDefinitionToUserDictionary(
            userId,
            definitionId,
            targetLanguageCode,
          );

          if (result.success) {
            const message = result.isRestored
              ? 'Word restored to your dictionary!'
              : 'Word added to your dictionary!';

            toast.success(message);

            // Refresh search results to update the button states
            await handleSearch(searchQuery, currentPage);
          } else {
            toast.error(result.error ?? 'Failed to add word to dictionary');
          }
        } catch (error) {
          await errorLog(
            'Error adding definition',
            error instanceof Error ? error.message : String(error),
          );
          toast.error('Failed to add word to dictionary');
        } finally {
        }
      });
    },
    [userId, targetLanguageCode, handleSearch, searchQuery, currentPage],
  );

  /**
   * Handle adding a definition to user's dictionary AND opening list dialog
   */
  const handleAddToList = async (definitionId: number, wordText: string) => {
    startTransition(async () => {
      try {
        const result = await addDefinitionToUserDictionary(
          userId,
          definitionId,
          targetLanguageCode,
        );

        if (result.success) {
          const message = result.isRestored
            ? 'Word restored to your dictionary!'
            : 'Word added to your dictionary!';

          toast.success(message);

          // Refresh search results to update the button states
          await handleSearch(searchQuery, currentPage);

          // Open list dialog with the new user dictionary entry
          if (result.data?.id) {
            setAddToListDialog({
              open: true,
              wordText: wordText,
              userDictionaryId: result.data.id,
            });
          }
        } else {
          toast.error(result.error ?? 'Failed to add word to dictionary');
        }
      } catch (error) {
        await errorLog(
          'Error adding definition',
          error instanceof Error ? error.message : String(error),
        );
        toast.error('Failed to add word to dictionary');
      } finally {
      }
    });
  };

  /**
   * Handle removing a definition from user's dictionary
   */
  const handleRemoveDefinition = async (userDictionaryId: string) => {
    startTransition(async () => {
      try {
        const result = await removeDefinitionFromUserDictionary(
          userId,
          userDictionaryId,
        );

        if (result.success) {
          toast.success('Word removed from your dictionary');

          // Refresh search results to update the button states
          await handleSearch(searchQuery, currentPage);
        }
      } catch (error) {
        await errorLog(
          'Error removing definition',
          error instanceof Error ? error.message : String(error),
        );
        toast.error('Failed to remove word from dictionary');
      } finally {
      }
    });
  };

  /**
   * Handle page navigation
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleSearch(searchQuery, newPage);
    }
  };

  /**
   * Handle language change
   */
  const handleLanguageChange = (newLanguage: LanguageCode) => {
    setSelectedLanguage(newLanguage);
    setSearchResults([]);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalCount(0);

    // Re-search if there's a query
    if (searchQuery.trim()) {
      handleSearch(searchQuery, 1);
    }
  };

  /**
   * Handle word added to list
   */
  const handleWordAddedToList = (listName: string) => {
    toast.success(`Word added to "${listName}"`);
    setAddToListDialog({ open: false, wordText: '', userDictionaryId: '' });
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Words
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter word to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="flex-1"
            />
            <Select
              value={selectedLanguage}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languageDisplayNames).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleSearch(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Results Summary */}
          {totalCount > 0 && (
            <div className="text-sm text-muted-foreground">
              Found {totalCount} word{totalCount !== 1 ? 's' : ''} matching
              &ldquo;
              {searchQuery}&rdquo;
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((word) => (
            <Card key={word.wordId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{word.wordText}</CardTitle>
                    {word.phoneticGeneral && (
                      <p className="text-sm text-muted-foreground mt-1">
                        /{word.phoneticGeneral}/
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {languageDisplayNames[word.languageCode]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {word.definitions.map((definition, index) => (
                    <div key={definition.definitionId}>
                      {index > 0 && <Separator className="my-4" />}

                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {
                                  partOfSpeechDisplayNames[
                                    definition.partOfSpeech
                                  ]
                                }
                              </Badge>
                              {definition.variant && (
                                <Badge variant="outline" className="text-xs">
                                  {definition.variant}
                                </Badge>
                              )}
                            </div>

                            <div className="prose prose-sm max-w-none">
                              <p>
                                {definition.displayDefinition ||
                                  definition.definition}
                              </p>
                              {definition.isTranslation &&
                                definition.originalDefinition && (
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    Original: {definition.originalDefinition}
                                  </p>
                                )}
                            </div>

                            {definition.phonetic &&
                              definition.phonetic !== word.phoneticGeneral && (
                                <p className="text-xs text-muted-foreground">
                                  /{definition.phonetic}/
                                </p>
                              )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {definition.hasAudio && (
                                <span className="flex items-center gap-1">
                                  <Volume2 className="h-3 w-3" />
                                  Audio
                                </span>
                              )}
                              {definition.hasImage && (
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  Image
                                </span>
                              )}
                              {definition.exampleCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {definition.exampleCount} example
                                  {definition.exampleCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="ml-4">
                            {definition.isInUserDictionary ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRemoveDefinition(
                                    definition.userDictionaryId!,
                                  )
                                }
                                disabled={isPending}
                                className="text-error-foreground border-error-border hover:bg-error-subtle"
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Remove
                                  </>
                                )}
                              </Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleAddDefinition(definition.definitionId)
                                  }
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add to Dictionary
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleAddToList(
                                      definition.definitionId,
                                      word.wordText,
                                    )
                                  }
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add to List
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || isSearching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || isSearching}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {searchQuery && !isSearching && searchResults.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No words found</h3>
              <p className="text-muted-foreground mt-2">
                No words found matching &ldquo;{searchQuery}&rdquo; in{' '}
                {languageDisplayNames[selectedLanguage]}. Try a different search
                term or check the spelling.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Search for words</h3>
              <p className="text-muted-foreground mt-2">
                Enter a word above to search our dictionary and add new words to
                your vocabulary.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add to List Dialog */}
      <AddToListDialog
        isOpen={addToListDialog.open}
        onClose={() =>
          setAddToListDialog({
            open: false,
            wordText: '',
            userDictionaryId: '',
          })
        }
        userId={userId}
        userLanguages={userLanguages}
        wordText={addToListDialog.wordText}
        userDictionaryId={addToListDialog.userDictionaryId}
        onWordAddedToList={handleWordAddedToList}
      />
    </div>
  );
}
