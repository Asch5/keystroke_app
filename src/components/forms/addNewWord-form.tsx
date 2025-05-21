'use client';

import { useState, FormEvent, useRef, ChangeEvent } from 'react';
import {
  getWordFromMerriamWebster,
  processAllWords,
  processOneWord,
} from '@/core/lib/db/processMerriamApi';
import { processDanishVariantOnServer } from '@/core/lib/actions/danishWordActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { checkWordExistsByUuid } from '@/core/lib/actions/dictionaryActions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/core/lib/utils';
import { Upload } from 'lucide-react';
import { DatabaseCleanupDialog } from '../DatabaseCleanupDialog';
import { DanishDictionaryObject } from '@/core/types/translationDanishTypes';
import { logToFile } from '@/core/lib/server/serverLogger';
import { LogLevel } from '@/core/lib/utils/logUtils';

interface ProcessedWord {
  word: string;
  timestamp: Date;
  status: 'added' | 'existed';
  language?: 'en' | 'da';
  phonetic?: string | null;
  stems?: string[];
  definitions?: {
    id: number;
    partOfSpeech: string;
    definition: string;
    examples: { id: number; example: string }[];
  }[];
}

async function getWordsFromDanishDictionary(
  words: string[],
): Promise<DanishDictionaryObject[]> {
  try {
    const response = await fetch(
      'http://localhost:5000/get_danish_definitions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(words),
      },
    );

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Danish definitions:', error);
    throw error;
  }
}

export default function AddNewWordForm() {
  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState('');
  const [language, setLanguage] = useState<'en' | 'da'>('en');
  const [dictionaryType, setDictionaryType] = useState('learners');
  const [processOneWordOnly, setProcessOneWordOnly] = useState(true);
  const [processedWords, setProcessedWords] = useState<ProcessedWord[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processWord = async (wordToProcess: string) => {
    if (!wordToProcess.trim()) {
      return null;
    }

    try {
      if (language === 'en') {
        const formData = new FormData();
        formData.append('word', wordToProcess);
        formData.append('dictionaryType', dictionaryType);

        const result = await getWordFromMerriamWebster(
          {
            message: null,
            errors: { word: [] },
          },
          formData,
        );

        if (result.data && result.data.length > 0) {
          if (processOneWordOnly) {
            const firstEntry = result.data[0];
            const mainId = firstEntry?.meta?.id;
            const mainUuid = firstEntry?.meta?.uuid;
            if (mainId && mainUuid) {
              const existingWord = await checkWordExistsByUuid(
                mainId,
                mainUuid,
              );

              if (existingWord) {
                toast.info(
                  `The word "${wordToProcess}" already exists in the dictionary.`,
                );
                setProcessedWords((prev) => [
                  {
                    word: firstEntry?.meta?.id || wordToProcess,
                    timestamp: new Date(),
                    status: 'existed',
                    language: 'en',
                  },
                  ...prev,
                ]);
                return null;
              }
            }

            if (firstEntry) {
              await processOneWord(firstEntry);
              toast.success(
                `Added "${wordToProcess}" and its related forms to the dictionary.`,
              );

              setProcessedWords((prev) => [
                {
                  word: firstEntry?.meta?.id || wordToProcess,
                  timestamp: new Date(),
                  status: 'added',
                  language: 'en',
                },
                ...prev,
              ]);
            }
          } else {
            let allExist = true;
            let someExist = false;
            const existsMap = new Map<string, boolean>();

            for (const entry of result.data) {
              const uuid = entry?.meta?.uuid;
              const wordId = entry?.meta?.id;

              if (uuid) {
                const exists = await checkWordExistsByUuid(wordId, uuid);
                existsMap.set(wordId, !!exists);

                if (exists) {
                  someExist = true;
                } else {
                  allExist = false;
                }
              }
            }

            if (allExist) {
              toast.info(
                `All words related to "${wordToProcess}" already exist in the dictionary.`,
              );

              const newProcessedWords: ProcessedWord[] = result.data.map(
                (entry) => ({
                  word: entry?.meta?.id || wordToProcess,
                  timestamp: new Date(),
                  status: 'existed',
                  language: 'en',
                }),
              );

              setProcessedWords((prev) => [...newProcessedWords, ...prev]);
              return null;
            }

            await processAllWords(result.data);

            const newProcessedWords: ProcessedWord[] = result.data.map(
              (entry) => {
                const wordId = entry?.meta?.id || wordToProcess;
                return {
                  word: wordId,
                  timestamp: new Date(),
                  status: existsMap.get(wordId) ? 'existed' : 'added',
                  language: 'en',
                };
              },
            );

            setProcessedWords((prev) => [...newProcessedWords, ...prev]);

            if (someExist) {
              toast.success(
                `Added new words related to "${wordToProcess}" to the dictionary. Some were already present.`,
              );
            } else {
              toast.success(
                `Added ${result.data.length} word entries to the dictionary.`,
              );
            }
          }

          return result;
        } else {
          toast.error(`No words found for "${wordToProcess}"`);
          return null;
        }
      } else {
        try {
          const danishResult = await getWordsFromDanishDictionary([
            wordToProcess,
          ]);

          logToFile(
            `Danish result for "${wordToProcess}":`,
            LogLevel.INFO,
            danishResult,
          );

          if (!danishResult || danishResult.length === 0) {
            toast.error(`No Danish definitions found for "${wordToProcess}"`);
            return null;
          }

          const wordsToProccess = processOneWordOnly
            ? [danishResult[0]]
            : danishResult;

          for (const danishWordData of wordsToProccess) {
            if (
              danishWordData &&
              danishWordData.variants &&
              danishWordData.variants.length > 0
            ) {
              for (const variant of danishWordData.variants) {
                if (variant) {
                  const serverResult = await processDanishVariantOnServer(
                    variant,
                    wordToProcess,
                  );

                  if (serverResult.status === 'added') {
                    setProcessedWords((prev) => [
                      {
                        word: serverResult.wordDisplay,
                        timestamp: new Date(),
                        status: 'added',
                        language: 'da',
                      },
                      ...prev,
                    ]);
                  } else {
                    toast.error(
                      `Failed to process Danish variant ${serverResult.wordDisplay}. ${serverResult.error ? `Error: ${serverResult.error}` : ''}`,
                    );
                  }
                }
              }
            }
          }
          // Ensure we only work with actual DanishDictionaryObject instances
          const validWordsToProcess = wordsToProccess.filter(
            (item): item is DanishDictionaryObject => Boolean(item),
          );

          if (
            validWordsToProcess.length > 0 &&
            validWordsToProcess.some((d) => d.variants && d.variants.length > 0)
          ) {
            toast.success(
              `Processed Danish word "${wordToProcess}" and its variants.`,
            );
          } else if (validWordsToProcess.length > 0) {
            toast.info(
              `No specific variants found to process for Danish word "${wordToProcess}", but main entry might have been processed if applicable.`,
            );
          }
        } catch (error) {
          console.error('Error processing Danish word:', error);
          toast.error(`Failed to process the Danish word "${wordToProcess}".`);
          return null;
        }
      }
    } catch (error) {
      console.error('Error processing word:', error);
      toast.error(
        `Failed to add the word "${wordToProcess}". Please try again.`,
      );
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!word.trim()) {
      return;
    }

    setLoading(true);

    try {
      await processWord(word);
      // Reset form
      setWord('');
    } catch (error) {
      console.error('Error processing word:', error);
      toast.error('Failed to add the word. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain') {
      toast.error('Please upload a .txt file');
      return;
    }

    setFileUploading(true);
    setUploadedFileName(file.name);

    try {
      const text = await file.text();
      const words = text.split('\n').filter((w) => w.trim());

      if (words.length === 0) {
        toast.error('No words found in the file');
        setFileUploading(false);
        return;
      }

      toast.info(`Processing ${words.length} words from file...`);

      let processed = 0;
      let failed = 0;

      for (const word of words) {
        const trimmedWord = word.trim();
        if (trimmedWord) {
          const result = await processWord(trimmedWord);
          if (result) {
            processed++;
          } else {
            failed++;
          }
        }
      }

      toast.success(
        `Processed ${processed} words from file. ${failed > 0 ? `${failed} failed.` : ''}`,
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadedFileName('');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please try again.');
    } finally {
      setFileUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearWordHistory = () => {
    setProcessedWords([]);
    toast.success('Word history cleared');
  };

  return (
    <div className="mt-10 w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Add New Word
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="single">Single Word</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="word">Word</Label>
                  <Input
                    id="word"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Enter word"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as 'en' | 'da')}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="da">Danish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {language === 'en' && (
                  <div className="space-y-2">
                    <Label htmlFor="dictionaryType">Dictionary Type</Label>
                    <Select
                      value={dictionaryType}
                      onValueChange={setDictionaryType}
                    >
                      <SelectTrigger id="dictionaryType">
                        <SelectValue placeholder="Select dictionary" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learners">
                          Learner&apos;s Dictionary
                        </SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate Dictionary
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Checkbox
                    id="processOneWordOnly"
                    checked={processOneWordOnly}
                    onCheckedChange={(checked) =>
                      setProcessOneWordOnly(checked === true)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="processOneWordOnly"
                      className="text-sm font-medium"
                    >
                      Process only one word
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only the first matching word will be
                      processed
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Processing...' : 'Add Word'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="file">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={language}
                    onValueChange={(value) => setLanguage(value as 'en' | 'da')}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="da">Danish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {language === 'en' && (
                  <div className="space-y-2">
                    <Label htmlFor="dictionaryType">Dictionary Type</Label>
                    <Select
                      value={dictionaryType}
                      onValueChange={setDictionaryType}
                    >
                      <SelectTrigger id="dictionaryType">
                        <SelectValue placeholder="Select dictionary" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learners">
                          Learner&apos;s Dictionary
                        </SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate Dictionary
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Checkbox
                    id="processOneWordOnlyFile"
                    checked={processOneWordOnly}
                    onCheckedChange={(checked) =>
                      setProcessOneWordOnly(checked === true)
                    }
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor="processOneWordOnlyFile"
                      className="text-sm font-medium"
                    >
                      Process only one word
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only the first matching word will be
                      processed
                    </p>
                  </div>
                </div>

                <div
                  onClick={triggerFileUpload}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors',
                    fileUploading && 'opacity-50 pointer-events-none',
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt"
                    onChange={handleFileChange}
                    disabled={fileUploading}
                  />
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="font-medium">
                    {uploadedFileName || 'Click to upload a .txt file'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Each line will be processed as a separate word
                  </p>
                </div>

                <Button
                  onClick={triggerFileUpload}
                  className="w-full"
                  disabled={fileUploading}
                >
                  {fileUploading ? 'Processing...' : 'Upload and Process File'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {processedWords.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Processed Words</CardTitle>
            <Button onClick={clearWordHistory} variant="outline" size="sm">
              Clear History
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {processedWords.map((processedWord, index) => (
                <div
                  key={index}
                  className="py-2 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">{processedWord.word}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {processedWord.timestamp.toLocaleTimeString()}
                    </span>
                    {processedWord.language && (
                      <Badge variant="outline" className="ml-2">
                        {processedWord.language === 'en' ? 'EN' : 'DA'}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={
                      processedWord.status === 'added' ? 'default' : 'secondary'
                    }
                  >
                    {processedWord.status === 'added' ? 'Added' : 'Existed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <DatabaseCleanupDialog />
    </div>
  );
}
